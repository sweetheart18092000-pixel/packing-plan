import os
import sys
import time
import json
import subprocess

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMP_FILE = os.path.join(PROJECT_DIR, "Dump.xlsx")
JOBS_JS = os.path.join(PROJECT_DIR, "jobs_data.js")

def log(msg):
    log_line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    if sys.stdout:
        try:
            print(log_line, flush=True)
        except Exception:
            pass
    try:
        with open(os.path.join(PROJECT_DIR, "watcher.log"), "a", encoding="utf-8") as f:
            f.write(log_line + "\n")
    except Exception:
        pass

def sync_dump_to_git():
    log("=" * 60)
    log("Dump.xlsx me nayi changes detect hui hain!")
    log("=" * 60)

    try:
        import pandas as pd
        # Wait briefly to ensure file is fully written by Excel
        time.sleep(1.5)
        df = pd.read_excel(DUMP_FILE)
        
        jobs = []
        for _, row in df.iterrows():
            job_val = str(row.get('JOB #', '') or '').strip()
            if not job_val or job_val.lower() == 'nan':
                continue
            jobs.append({
                'job': job_val,
                'po': str(row.get('PONO', '') or '').strip(),
                'style': str(row.get('STYLE #', '') or '').strip(),
                'finish': str(row.get('FINISH', '') or '').strip(),
                'qty': int(row.get('QTY', 0) if pd.notnull(row.get('QTY')) else 0),
                'customer': str(row.get('CUSTOMER', '') or '').strip(),
                'status': str(row.get('STATUS', '') or '').strip(),
                'audit': str(row.get('AUDIT CONFIRM', '') or '').strip()
            })

        js_content = f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n"
        with open(JOBS_JS, "w", encoding="utf-8") as f:
            f.write(js_content)

        log(f"Parsed {len(jobs):,} jobs from Dump.xlsx.")

        # Git operations
        os.chdir(PROJECT_DIR)
        subprocess.run(["git", "config", "http.postBuffer", "524288000"], check=True)
        subprocess.run(["git", "add", "jobs_data.js", "Dump.xlsx"], check=True)
        
        # Check if there is anything to commit
        diff_check = subprocess.run(["git", "diff", "--cached", "--quiet"])
        if diff_check.returncode != 0:
            commit_msg = f"Auto-sync Dump: {time.strftime('%Y-%m-%d %H:%M')} ({len(jobs):,} jobs)"
            subprocess.run(["git", "commit", "-m", commit_msg], check=True)
            
            # Push with retry
            pushed = False
            for attempt in range(1, 4):
                log(f"GitHub Cloud par push kiya ja raha hai (Attempt {attempt}/3)...")
                push_res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
                if push_res.returncode == 0:
                    log(f"[SUCCESS] Cloud site successfully updated with {len(jobs):,} jobs!")
                    pushed = True
                    break
                else:
                    log(f"[RETRY] Push failed: {push_res.stderr.strip()}. Retrying in 3 seconds...")
                    time.sleep(3)

            if not pushed:
                log("[WARNING] Push fail ho gaya. Internet connection check karein.")
        else:
            log("[INFO] No new changes to commit.")

    except Exception as e:
        log(f"[ERROR] Sync error: {e}")

def watch_loop():
    log("=" * 65)
    log("  PACKING PLAN - REAL-TIME DUMP.XLSX WATCHER ACTIVE")
    log("=" * 65)
    log(f"Watching: {DUMP_FILE}")
    log("Jab bhi Dump.xlsx update hoga, yeh automatically GitHub Cloud update karega.")
    log("-" * 65)

    last_mtime = 0
    if os.path.exists(DUMP_FILE):
        last_mtime = os.path.getmtime(DUMP_FILE)

    while True:
        try:
            time.sleep(4)
            if os.path.exists(DUMP_FILE):
                current_mtime = os.path.getmtime(DUMP_FILE)
                if current_mtime != last_mtime:
                    last_mtime = current_mtime
                    sync_dump_to_git()
        except KeyboardInterrupt:
            log("Watcher stopped by user.")
            break
        except Exception as e:
            time.sleep(5)

if __name__ == "__main__":
    watch_loop()
