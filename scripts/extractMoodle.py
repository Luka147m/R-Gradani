# py 3.13.8
import argparse, os, sys, math, tarfile, html
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from PIL import Image
import shutil
import urllib.parse

OUTPUT_DIR = Path("forum_export")
HTML_DIR = OUTPUT_DIR / "html"
IMAGES_DIR = OUTPUT_DIR / "images"
HTML_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

html_dir = Path("forum_export/html")
image_dir = Path("forum_export/images")
target_path = image_dir / "example.png"

relative_path = os.path.relpath(target_path, html_dir)

DISCUSSIONS_PER_PAGE = 50

def detect_image_extension(file_path):
    try:
        with Image.open(file_path) as img:
            ext = img.format.lower()
            if ext == 'jpeg':
                ext = 'jpg'
            return ext
    except Exception:
        return None

def load_files_mapping(files_xml_path: str, files_dir: str):
    """
    Build mapping: postid -> original_filename -> relative_path_in_images_folder
    """
    tree = ET.parse(files_xml_path)
    root = tree.getroot()
    files_dir = Path(files_dir)
    
    mapping = {}
    
    for file_elem in root.findall(".//file"):
        filename = file_elem.findtext("filename")
        contenthash = file_elem.findtext("contenthash")
        itemid = file_elem.findtext("itemid")
        
        if filename and contenthash and itemid:
            subfolder = contenthash[:2]
            file_path = files_dir / subfolder / contenthash
            if file_path.exists():
                ext = detect_image_extension(file_path)
                if ext:
                    target_path = IMAGES_DIR / f"{contenthash}.{ext}"
                    shutil.copy(file_path, target_path)
                    filename_decoded = urllib.parse.unquote(filename)
                    
                    if itemid not in mapping:
                        mapping[itemid] = {}
                    mapping[itemid][filename_decoded] = os.path.relpath(target_path, HTML_DIR)

    return mapping

def replace_images(message, postid, files_map):
    """
    Replace @@PLUGINFILE@@/filename with actual path for a specific post
    """
    if postid not in files_map:
        return message
    for original_name, relative_path in files_map[postid].items():
        original_name_enc = urllib.parse.quote(original_name)
        message = message.replace(f"@@PLUGINFILE@@/{original_name}", relative_path)
        message = message.replace(f"@@PLUGINFILE@@/{original_name_enc}", relative_path)
    return message

def convert_time(unix_timestamp):
    """Convert Unix timestamp to approximate Croatia time (CET/CEST)"""
    dt_utc = datetime.utcfromtimestamp(int(unix_timestamp))
    croatia_offset = timedelta(hours=2)  
    dt_croatia = dt_utc + croatia_offset
    return dt_croatia.strftime('%d.%m.%Y. %H:%M:%S')

def generate_html_page(discussions_sub, page_num, total_pages):
    """Generate a single HTML page for a subset of posts."""
    html_content = [
        "<!DOCTYPE html>",
        "<html lang='en'>",
        "<head>",
        "  <meta charset='UTF-8'>",
        "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
        f"  <title>Forum Page {page_num}</title>",
        "  <style>",
        "    body { font-family: Arial, sans-serif; margin: 20px; }",
        "    .discussion { border-bottom: 1px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }",
        "    .subject { font-weight: bold; font-size: 1.1em; }",
        "    .meta { font-size: 0.9em; color: #555; }",
        "    .message img { max-width: 90%; height: auto; display: block; margin: 10px 0; }",
        "  </style>",
        "</head>",
        "<body>",
        f"<h1>Forum Discussions - Page {page_num}</h1>"
    ]

    for discussion in discussions_sub:
        html_content.append("<div class='discussion'>")
        html_content.append(f"  <div class='subject'>{html.escape(discussion['subject'] or '')}</div>")
        html_content.append(f"  <div class='meta'>User ID: {discussion['userid']} | Post ID: {discussion['postid']} | Created: {discussion['created']}</div>")
        html_content.append(f"  <div class='message'>{discussion['message']}</div>")
        html_content.append("</div>")

    html_content.append("<div class='navigation'>")
    if page_num > 1:
        html_content.append(f"<a href='page{page_num-1}.html'>Previous</a>")
    if page_num < total_pages:
        html_content.append(f"<a href='page{page_num+1}.html' style='margin-left:20px;'>Next</a>")
    html_content.append("</div>")

    html_content.append("</body></html>")
    return "\n".join(html_content)

def generate_forum_pages(discussions):
    total_pages = math.ceil(len(discussions) / DISCUSSIONS_PER_PAGE)
    for page_num in range(1, total_pages + 1):
        start = (page_num - 1) * DISCUSSIONS_PER_PAGE
        end = start + DISCUSSIONS_PER_PAGE
        discussions_sub = discussions[start:end]

        page_html = generate_html_page(discussions_sub, page_num, total_pages)
        page_file = HTML_DIR / f"page{page_num}.html"
        page_file.write_text(page_html, encoding="utf-8")
        print(f"Generated {page_file}")

def validate_mbz_file(file_path):
    if not os.path.exists(file_path):
        raise argparse.ArgumentTypeError(f"Input file does not exist: {file_path}")
    if not file_path.lower().endswith('.mbz'):
        raise argparse.ArgumentTypeError(f"Input file must be a .mbz file, got: {file_path}")
    return file_path

def unpack(tgz_file):
    """Treat .mbz as .tgz and extract its contents"""
    with tarfile.open(tgz_file, "r:gz") as tar:
        tar.extractall(path='./extracted_moodle')
        print(f"Extracted to ./extracted_moodle")

def load_discussions(files_map):
    """Load discussions from the extracted Moodle data"""
    activities_dir = Path('./extracted_moodle/activities')
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
            postid = post.get("id")
            created_timestamp = post.findtext("created")
            message = post.findtext("message")
            message = replace_images(message, postid, files_map)
            
            post_data = {
                "postid": postid,
                "userid": post.findtext("userid"),
                "created": convert_time(created_timestamp),
                "subject": post.findtext("subject"),
                "message": message
            }
            discussions.append(post_data)
    
    return discussions

def main(args):
    input_file = validate_mbz_file(args.input)
    print(f"Processing Moodle backup file: {input_file}")
    unpack(input_file)
    files_map = load_files_mapping('./extracted_moodle/files.xml', './extracted_moodle/files')
    discussions = load_discussions(files_map)
    generate_forum_pages(discussions)
    temp_dir = Path('./extracted_moodle')
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
        print("Removed temporary extracted data")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract and process Moodle data")
    parser.add_argument("-i", "--input", help="Input Moodle backup file path (.mbz)", required=True, type=str)
    
    try:
        args = parser.parse_args()
        main(args)
    except argparse.ArgumentTypeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)