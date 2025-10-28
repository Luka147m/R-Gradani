import argparse, os, sys
import xml.etree.ElementTree as ET
import csv
from datetime import datetime
import tarfile
from pathlib import Path
import shutil
import re
from bs4 import BeautifulSoup
import html
import uuid

NAMESPACE = uuid.UUID("12345678-1234-5678-1234-567812345678")

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

def extract_files(files_xml_path, itemid_to_postid):
    tree = ET.parse(files_xml_path)
    root = tree.getroot()
    files = []

    for file_elem in root.findall(".//file"):
        filename = file_elem.findtext("filename")
        contenthash = file_elem.findtext("contenthash")
        itemid = file_elem.findtext("itemid")
        mimetype = file_elem.findtext("mimetype")
        created = file_elem.findtext("timecreated")

        analiza_id = itemid_to_postid.get(itemid)
        if analiza_id is None:
            continue
        
        if (filename and filename != "." and mimetype not in ("$@NULL@$", None, "") and contenthash and itemid):
            files.append({
                "analiza_id": int(itemid),
                "content_hash": contenthash,
                "original_name": clean(filename),
                "mime_type": mimetype,
                "created": datetime.fromtimestamp(int(created))
            })
            
    return files

def collect_files_from_backup(extracted_root, output_folder, files_info):
    files_dir = os.path.join(extracted_root, "files")
    os.makedirs(output_folder, exist_ok=True)

    for f in files_info:
        content_hash = f["content_hash"]
        subdir = content_hash[:2]
        src_path = os.path.join(files_dir, subdir, content_hash)
        if os.path.exists(src_path):
            dst_path = os.path.join(output_folder, content_hash)
            shutil.copy2(src_path, dst_path)
        else:
            continue

def extract_discussions(activities_path, unique_urls, analiza_skup_links, itemid_to_postid):
    activities_dir = Path(activities_path)
    forum_folders = [d for d in activities_dir.iterdir() if d.is_dir()]
    if not forum_folders:
        raise FileNotFoundError("No forum folder found inside activities/")

    forum_dir = forum_folders[0]
    discussion_file = forum_dir / 'forum.xml'
    tree = ET.parse(discussion_file)
    root = tree.getroot()   
    discussions = {}

    for discussion in root.findall(".//discussion"):
        for post in discussion.findall(".//post"):
            postid = post.get("id")
            created_timestamp = post.findtext("created")
            message = post.findtext("message")
            soup = BeautifulSoup(html.unescape(message), features="html.parser")
            for script in soup(["script", "style"]):
                script.extract()

            text = clean(soup.get_text(separator=" "))
            subject = clean(post.findtext("subject") or "")
            urls = re.findall(r'https://data[^\s,"<]+', message or "")

            seen_analiza_skup = set()
            
            if urls:
                for u in urls:
                    if u not in unique_urls:
                        u_id = uuid.uuid5(NAMESPACE, u)
                        unique_urls[u] = (str(u_id), subject)
                    else:
                        u_id = unique_urls[u][0]

                    key = (int(postid), str(u_id))
                    if key not in seen_analiza_skup:
                        analiza_skup_links.append({
                            "analiza_id": int(postid),
                            "skup_id": str(u_id)
                        })
                        seen_analiza_skup.add(key)

                discussions[postid] = {
                    "id": int(postid),
                    "user_id": int(post.findtext("userid")),
                    "created": datetime.fromtimestamp(int(created_timestamp)),
                    "subject": subject,
                    "message": text
                }
                itemid_to_postid[str(postid)] = postid

    return list(discussions.values()), unique_urls, analiza_skup_links
            
def process_single_backup(mbz_path, unique_urls, all_discussions, all_files, analiza_skup_links, output_folder):
    print(f"Processing: {mbz_path}")
    unpack(mbz_path)
    
    itemid_to_postid = {}
    
    discussions, urls, analiza_skup_links = extract_discussions('./extracted_moodle/activities', unique_urls, analiza_skup_links, itemid_to_postid)
    all_discussions.extend(discussions)
    
    files = extract_files('./extracted_moodle/files.xml', itemid_to_postid)
    all_files.extend(files)
    
    collect_files_from_backup('./extracted_moodle', output_folder, files)

    shutil.rmtree('./extracted_moodle', ignore_errors=True)
    return analiza_skup_links

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
    
    unique_urls = {}
    all_discussions = []
    all_files = []
    analiza_skup_links = []
    
    output_folder = "./all_files"
    os.makedirs(output_folder, exist_ok=True)
    csv_output_folder = "./csv_output"
    os.makedirs(csv_output_folder, exist_ok=True)
    
    analize_csv = os.path.join(csv_output_folder, "analize.csv")
    analize_skup_csv = os.path.join(csv_output_folder, "analize_skup.csv")
    skup_csv = os.path.join(csv_output_folder, "skup.csv")
    slike_csv = os.path.join(csv_output_folder, "slike.csv")
    
    for mbz in mbz_files:
        process_single_backup(mbz, unique_urls, all_discussions, all_files, analiza_skup_links, output_folder)
    
    with open(analize_csv, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["id", "user_id", "created", "subject", "message"], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(all_discussions)

    with open(skup_csv, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["id", "url", "name"], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for url, (u_id, name) in unique_urls.items():
            writer.writerow({"id": u_id, "url": url, "name": name})
            
    with open(analize_skup_csv, "w", newline="", encoding="UTF-8") as file:
        writer = csv.DictWriter(file, fieldnames=["analiza_id", "skup_id"], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(analiza_skup_links)

    seen_hashes = set()
    unique_files = [f for f in all_files if not (f["content_hash"] in seen_hashes or seen_hashes.add(f["content_hash"]))]

    with open(slike_csv, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["analiza_id", "content_hash", "original_name", "mime_type", "created"], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(unique_files)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract and process Moodle data")
    parser.add_argument("-i", "--input", help="Input .mbz file or folder of .mbz files", required=True, type=str)
    args = parser.parse_args()
    main(args)
    