import sqlite3
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SQLITE_DB = BASE_DIR / "vibehub_backend" / "db.sqlite3"
OUTPUT_FILE = Path(__file__).resolve().parent / "exported_data.json"

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def export_data():
    if not SQLITE_DB.exists():
        print(f"[Export] SQLite database not found at {SQLITE_DB}")
        return

    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = dict_factory
    cur = conn.cursor()

    tables = [
        "users_user",
        "users_profile",
        "users_follow",
        "posts_post",
        "posts_like",
        "posts_comment",
        "posts_savedpost",
        "chat_conversation",
        "chat_conversation_participants",
        "chat_message",
        "notifications_notification",
        "stories_story",
        "stories_storyviewer",
    ]

    export_payload = {}

    for table in tables:
        try:
            cur.execute(f'SELECT * FROM "{table}"')
            rows = cur.fetchall()
            export_payload[table] = rows
            print(f"[Export] {table}: {len(rows)} records exported")
        except sqlite3.OperationalError as e:
            print(f"[Export] Warning: {table} skipped: {e}")
            export_payload[table] = []

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2, default=str)

    print(f"[Export] Completed! Data written to {OUTPUT_FILE}")
    conn.close()

if __name__ == "__main__":
    export_data()
