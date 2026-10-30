import os
import sys
import time
import json
import subprocess

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def sync_and_push():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)
    dump_file = "Dump.xlsx"

    log("=" * 60)
    log("  PACKING PLAN - AUTO CLOUD DUMP SYNC")
    log("=" * 60)

    if not os.path.exists(dump_file):
        log(f"[WARNING] {dump_file} nahi mila! Skipping sync.")
        return False

    try:
        import pandas as pd
        log(f"Reading {dump_file}...")
        df = pd.read_excel(dump_file)
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
        with open("jobs_data.js", "w", encoding="utf-8") as f:
            f.write(js_content)

        log(f"Parsed {len(jobs):,} jobs into jobs_data.js.")

        # Check git status for changes in jobs_data.js or Dump.xlsx
        status_res = subprocess.run(["git", "status", "--porcelain", "jobs_data.js", "Dump.xlsx"], capture_output=True, text=True)
        
        if not status_res.stdout.strip():
            log("[UP-TO-DATE] Dump.xlsx me koi nayi change nahi hai. Cloud pehle se updated hai.")
            return True

        log("Nayi changes detect hui hain. GitHub par push kiya ja raha hai...")
        subprocess.run(["git", "add", "jobs_data.js", "Dump.xlsx"], check=True)
        commit_msg = f"Auto-sync Dump: {time.strftime('%Y-%m-%d %H:%M')}"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        
        push_res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
        if push_res.returncode == 0:
            log("[SUCCESS] Cloud site successfully updated!")
            log("GitHub Pages aglay 30 seconds me live update ho jayega.")
            return True
        else:
            log(f"[ERROR] Git push failed: {push_res.stderr.strip()}")
            return False

    except Exception as e:
        log(f"[ERROR] Sync error: {e}")
        return False

if __name__ == "__main__":
    success = sync_and_push()
    # Wait briefly if run from desktop batch
    if len(sys.argv) > 1 and sys.argv[1] == "--pause":
        input("\nPress Enter to close...")
    else:
        time.sleep(3)
