import argparse, os, sys
import xml.etree.ElementTree as ET
from datetime import datetime
import tarfile
from pathlib import Path
import shutil
import re
from bs4 import BeautifulSoup
import html
import requests
import psycopg2
from psycopg2.extras import execute_values, Json

def get_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="r-gradani",
        user="postgres",
        password="admin",
        port=5432
    )
    return conn

def create_postgres_tables(conn):
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS izdavac (
            id TEXT PRIMARY KEY,
            publisher TEXT,
            description TEXT
        );
        
        CREATE TABLE IF NOT EXISTS skup_podataka (
            id TEXT PRIMARY KEY,
            title TEXT,
            refresh_frequency TEXT,
            theme TEXT,
            description TEXT,
            url TEXT,
            state TEXT,
            created TIMESTAMP,
            modified TIMESTAMP,
            isopen BOOLEAN,
            access_rights TEXT,
            license_title TEXT,
            license_url TEXT,
            license_id TEXT,
            publisher_id TEXT REFERENCES izdavac(id),
            tags JSONB
        );
        
        CREATE TABLE IF NOT EXISTS resurs (
            id TEXT PRIMARY KEY,
            skup_id TEXT REFERENCES skup_podataka(id),
            available_through_api BOOLEAN,
            name TEXT,
            description TEXT,
            created TIMESTAMP,
            last_modified TIMESTAMP,
            format TEXT,
            mimetype TEXT,
            state TEXT,
            size INT,
            url TEXT
        );
        
        CREATE TABLE IF NOT EXISTS komentar (
            id BIGINT PRIMARY KEY,
            user_id BIGINT,
            skup_id TEXT REFERENCES skup_podataka(id),
            created TIMESTAMP,
            subject TEXT,
            message TEXT
        );
        
        CREATE TABLE IF NOT EXISTS slika (
            komentar_id BIGINT,
            content_hash TEXT,
            original_name TEXT,
            mime_type TEXT,
            created TIMESTAMP,
            PRIMARY KEY(komentar_id, content_hash)
        );
        
        CREATE TABLE IF NOT EXISTS odgovor (
            id SERIAL PRIMARY KEY,
            komentar_id BIGINT REFERENCES komentar(id),
            created TIMESTAMP,
            message TEXT
        );
        """)
        conn.commit()

def insert_izdavac(conn, izdavaci_dict):
    # izdavaci_dict: {publisher_id: {id, publisher, description}, ...}
    if not izdavaci_dict:
        return
    
    with conn.cursor() as cur:
        values = [(v["id"], v["publisher"], v["description"]) for v in izdavaci_dict.values()]
        execute_values(
            cur,
            "INSERT INTO izdavac (id, publisher, description) VALUES %s ON CONFLICT (id) DO NOTHING",
            values
        )
        conn.commit()

def insert_skup_podataka(conn, datasets_dict):
    if not datasets_dict:
        return
    
    with conn.cursor() as cur:
        values = [
            (
                v["id"], v["title"], v["refresh_frequency"], v["theme"], v["description"],
                v["url"], v["state"], v["created"], v["modified"], v["isopen"],
                v["access_rights"], v["license_title"], v["license_url"], v["license_id"],
                v["publisher_id"], Json(v.get("tags", []))
            )
            for v in datasets_dict.values()
        ]
        execute_values(
            cur,
            """INSERT INTO skup_podataka (
                id, title, refresh_frequency, theme, description, url, state,
                created, modified, isopen, access_rights, license_title,
                license_url, license_id, publisher_id, tags
            ) VALUES %s ON CONFLICT (id) DO UPDATE
               SET tags = EXCLUDED.tags""",
            values
        )
        conn.commit()


def insert_resurs(conn, resurs_list):
    if not resurs_list:
        return
    
    with conn.cursor() as cur:
        values = [
            (
                r["id"], r["skup_id"], r["available_through_api"], r["name"], r["description"],
                r["created"], r["last_modified"], r["format"], r["mimetype"], r["state"],
                r["size"], r["url"]
            )
            for r in resurs_list
        ]
        execute_values(
            cur,
            """INSERT INTO resurs (
                id, skup_id, available_through_api, name, description, created, last_modified,
                format, mimetype, state, size, url
            ) VALUES %s ON CONFLICT (id) DO NOTHING""",
            values
        )
        conn.commit()

def insert_komentar(conn, komentar_list):
    if not komentar_list:
        return
    
    with conn.cursor() as cur:
        values = [
            (
                k["id"], k["user_id"], k["skup_id"], k["created"], k["subject"], k["message"]
            )
            for k in komentar_list
        ]
        execute_values(
            cur,
            """INSERT INTO komentar (
                id, user_id, skup_id, created, subject, message
            ) VALUES %s ON CONFLICT (id) DO NOTHING""",
            values
        )
        conn.commit()
        
def insert_slika(conn, slika_list):
    if not slika_list:
        return
    
    with conn.cursor() as cur:
        values = [
            (
                s["komentar_id"], s["content_hash"], s["original_name"],
                s["mime_type"], s["created"]
            )
            for s in slika_list
        ]
        execute_values(
            cur,
            """INSERT INTO slika (
                komentar_id, content_hash, original_name, mime_type, created
            ) VALUES %s ON CONFLICT (komentar_id, content_hash) DO NOTHING""",
            values
        )
        conn.commit()

def unpack(tgz_file):
    with tarfile.open(tgz_file, "r:gz") as tar:
        tar.extractall(path='./extracted_moodle', filter='data')
        
def clean(text):
    if not text:
        return ""
    
    # if isinstance(text, bytes):
    #     text = text.decode("utf-8", "replace")
    # else:
    #     text = text.encode("utf-8", "replace").decode("utf-8")
    
    replacements = {
        "\u2013": "-", "\u2014": "-",
        "\u2212": "-", "\u2018": "'",
        "\u2019": "'", "\u201C": '"',
        "\u201D": '"', "\u2026": "...",
        "\u00A0": " ", "\u200B": "",    
    }
     
    for bad, good in replacements.items():
        text = text.replace(bad, good)
        
    text = ''.join(c for c in text if c.isprintable())
    
    text = re.sub(r'[\u2000-\u200F\u202A-\u202F\u205F\u3000]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_url_valid(url, timeout=5):
    try:
        response = requests.head(url, allow_redirects=True, timeout=timeout)
        return response.status_code == 200
    except requests.RequestException:
        return False

def extract_img_data(files_xml_path, seen_posts):
    tree = ET.parse(files_xml_path)
    root = tree.getroot()
    files = []

    for file_elem in root.findall(".//file"):
        filename = file_elem.findtext("filename")
        contenthash = file_elem.findtext("contenthash")
        item_id = file_elem.findtext("itemid")
        mimetype = file_elem.findtext("mimetype")
        created = file_elem.findtext("timecreated")

        
        if int(item_id) not in seen_posts:
            continue
        
        if (filename and filename != "." and mimetype not in ("$@NULL@$", None, "") and contenthash and item_id):
            files.append({
                "komentar_id": int(item_id),
                "content_hash": contenthash,
                "original_name": clean(filename),
                "mime_type": mimetype,
                "created": datetime.fromtimestamp(int(created)),
            })
            
    return files

# def collect_files_from_backup(extracted_root, output_folder, files_info):
#     files_dir = os.path.join(extracted_root, "files")
#     os.makedirs(output_folder, exist_ok=True)

#     for f in files_info:
#         content_hash = f["content_hash"]
#         subdir = content_hash[:2]
#         src_path = os.path.join(files_dir, subdir, content_hash)
#         if os.path.exists(src_path):
#             dst_path = os.path.join(output_folder, content_hash)
#             shutil.copy2(src_path, dst_path)
#         else:
#             continue

def extract_data(activities_path, all_datasets, all_resources, all_publishers, seen_posts):
    activities_dir = Path(activities_path)
    forum_folders = [d for d in activities_dir.iterdir() if d.is_dir()]
    if not forum_folders:
        raise FileNotFoundError("No forum folder found inside activities/")

    forum_dir = forum_folders[0]
    discussion_file = forum_dir / 'forum.xml'
    tree = ET.parse(discussion_file)
    root = tree.getroot()   
    discussions = []

    for discussion in root.findall(".//discussion"):
        for post in discussion.findall(".//post"):
            
            # Osnovne informacije komentara (id, korisnik, vrijeme, naslov, poruka)
            post_id = int(post.get("id"))
            seen_posts.add(post_id)
            user_id = int(post.findtext("userid"))
            created_timestamp = datetime.fromtimestamp(int(post.findtext("created")))
            subject = clean(post.findtext("subject") or "")
            
            message = post.findtext("message")
            soup = BeautifulSoup(html.unescape(message), features="html.parser")
            
            for tag in soup(["script", "style", "noscript", "img"]):
                tag.decompose()
            for elem in soup.find_all(string=True):
                elem.replace_with(clean(elem))
            for tag in soup.find_all():
                tag.attrs = {}

            message_cleaned = str(soup)
            
            discussions.append({
                "id": post_id,
                "user_id": user_id,
                "skup_id": None,
                "created": created_timestamp,
                "subject": subject,
                "message": message_cleaned
            })
                        
            # Postoji li dataset link, izvuci metapodatke skupa
            match = re.search(r'(https:\/\/data\.gov\.hr\/ckan\/dataset\/([a-zA-Z0-9\-]+))', message or "")
            if match:
                full_url = match.group(1)
                identifier = match.group(2)
                
                if identifier in all_datasets:
                    dataset_id = all_datasets[identifier]["id"]
                    # print(f"[INFO] Nasao sam duplikat dodijeliti cu mu id {dataset_id}")
                    discussions[-1]["skup_id"] = dataset_id
                    continue
                
                api_url = f"https://data.gov.hr/ckan/api/3/action/package_show?id={identifier}"

                try:
                    response = requests.get(api_url, timeout=3)
                    response.raise_for_status()
                    resp_json = response.json()

                    if resp_json.get("success"):

                        # Metapodaci skupa - stringovi
                        dataset_id = resp_json["result"].get("id")
                        title = resp_json["result"].get("title")
                        refresh_frequency = resp_json["result"].get("data_refresh_frequency")
                        theme = resp_json["result"].get("theme")
                        dataset_description = resp_json["result"].get("notes")
                        url = full_url
                        state = resp_json["result"].get("state")
                        
                        # Update discussion sa skup_id
                        discussions[-1]["skup_id"] = dataset_id
                        
                        # Timestamp  "2021-05-05T11:47:30.254500" - vec je u formatu
                        created = resp_json["result"].get("metadata_created")
                        modified = resp_json["result"].get("metadata_modified")
                        
                        # Licenca
                        is_open = bool(resp_json["result"].get("isopen"))
                        access_rights = resp_json["result"].get("access_rights")
                        license_title = resp_json["result"].get("license_title")
                        license_url = resp_json["result"].get("license_url")
                        license_id = resp_json["result"].get("license_id")
                        
                        # Izdavac
                        publisher_id = resp_json["result"].get("organization", {}).get("id")
                        publisher = resp_json["result"].get("organization", {}).get("title")
                        publisher_description = resp_json["result"].get("organization", {}).get("description")
                        if not publisher:
                            publisher = resp_json["result"].get("author")
                            
                            
                        if publisher_id and publisher_id not in all_publishers:
                            all_publishers[publisher_id] = {
                                "id": publisher_id,
                                "publisher": publisher,
                                "description": publisher_description,
                            }
                            
                        # Tags
                        tags = resp_json["result"].get("tags", [])
                        tags_list = [tag.get("name") for tag in tags]
                        
                        # Resursi
                        resources = resp_json["result"].get("resources", [])
                        for res in resources:
                            resource_id = res.get("id")
                            # Zasto im je ovo string? :)
                            available_through_api = res.get("available_through_api", "").lower()
                            available_through_api = available_through_api in ("true", "1", "yes")
                            
                            created = res.get("created")
                            resource_desc = res.get("description")
                            fmt = res.get("format")
                            last_modified = res.get("last_modified")
                            mimetype = res.get("mimetype")
                            name = res.get("name")
                            state = res.get("state")
                            size = int(res.get("size", 0) or 0)
                            resource_url = res.get("url")
                            
                            all_resources.append({
                                "id": resource_id,
                                "skup_id": dataset_id,
                                "available_through_api": available_through_api,
                                "name": name,
                                "description": resource_desc,
                                "created": created,
                                "last_modified": last_modified,
                                "format": fmt,
                                "mimetype": mimetype,
                                "state": state,
                                "size": size,
                                "url": resource_url
                            })
                            
                            
                        all_datasets[identifier] = {
                            "id": dataset_id,
                            "title": title,
                            "refresh_frequency": refresh_frequency,
                            "theme": theme,
                            "description": dataset_description,
                            "url": url,
                            "state": state,
                            "created": created,
                            "modified": modified,
                            "isopen": is_open,
                            "access_rights": access_rights,
                            "license_title": license_title,
                            "license_url": license_url,
                            "license_id": license_id,
                            "publisher_id": publisher_id,
                            "tags": tags_list
                        }
                        
                    else:
                        discussions.pop()
                        print(f"[Warning]: Invalid dataset response for {identifier}, removing discussion {post_id}")
                        
                except requests.RequestException as e:
                    discussions.pop()
                    print(f"[Error] fetching dataset {identifier} for discussion {post_id}: {e}")
                
    return discussions
            
def process_single_backup(mbz_path, all_datasets, all_discussions, all_resources, all_files, all_publishers, output_folder):
    print(f"Processing: {mbz_path}")
    unpack(mbz_path)
    
    seen_posts = set()
    
    discussions = extract_data('./extracted_moodle/activities', all_datasets, all_resources, all_publishers, seen_posts)
    all_discussions.extend(discussions)
    
    files = extract_img_data('./extracted_moodle/files.xml', seen_posts)
    all_files.extend(files)
    
    # collect_files_from_backup('./extracted_moodle', output_folder, files)

    shutil.rmtree('./extracted_moodle', ignore_errors=True)

def main(args):
    input_path = args.input
    if not os.path.exists(input_path):
        print(f"Input path {input_path} does not exist.")
        sys.exit(1)

    mbz_files = []
    if os.path.isdir(input_path):
        mbz_files = [os.path.join(input_path, f) for f in os.listdir(input_path) if f.endswith(".mbz")]
    elif input_path.endswith(".mbz"):
        mbz_files = [input_path]
    else:
        print("Error: input must be a folder or .mbz file")
        sys.exit(1)
    
    all_datasets = {}
    all_publishers = {}
    all_discussions = []
    all_files = []
    all_resources = []

    output_folder = "./all_files"
    # os.makedirs(output_folder, exist_ok=True)
    
    for mbz in mbz_files:
        process_single_backup(mbz, all_datasets, all_discussions, all_resources, all_files, all_publishers, output_folder)
        
    all_discussions = [d for d in all_discussions if d["skup_id"] is not None]

    conn = get_connection()
    create_postgres_tables(conn)
    insert_izdavac(conn, all_publishers)
    insert_skup_podataka(conn, all_datasets)
    insert_resurs(conn, all_resources)
    insert_komentar(conn, all_discussions)
    insert_slika(conn, all_files)
    conn.close()
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract and process Moodle data and load into db")
    parser.add_argument("-i", "--input", help="Input .mbz file or folder of .mbz files", required=True, type=str)
    args = parser.parse_args()
    main(args)
    