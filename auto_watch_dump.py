import os
import sys
import time
import json
import subprocess
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMP_FILE = os.path.join(PROJECT_DIR, "Dump.xlsx")
NQA_FILE = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"
JOBS_JS = os.path.join(PROJECT_DIR, "jobs_data.js")
AUDIT_JS = os.path.join(PROJECT_DIR, "audit_data.js")

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

def parse_nqa_datetime(dt_val):
    if not dt_val:
        return datetime.min
    dt_str = str(dt_val).strip()
    for fmt in ('%I:%M %p, %d/%m/%Y', '%H:%M, %d/%m/%Y', '%d/%m/%Y %H:%M:%S', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y'):
        try:
            return datetime.strptime(dt_str, fmt)
        except Exception:
            pass
    return datetime.min

def load_nqa_audits():
    if not os.path.exists(NQA_FILE):
        return {}
    
    # Retry up to 3 times in case WhatsApp Bot is currently writing to the file
    for attempt in range(1, 4):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(NQA_FILE, read_only=True, data_only=True)
            sheet_name = 'Audit Details' if 'Audit Details' in wb.sheetnames else wb.sheetnames[0]
            sheet = wb[sheet_name]
            job_records = {}
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not row or len(row) < 8:
                    continue
                dt_raw = row[0]
                job_raw = row[2]
                status_raw = row[7]
                job_str = str(job_raw).strip().upper() if job_raw else ''
                status_str = str(status_raw).strip() if status_raw else ''
                if not job_str or not status_str or status_str.lower() in ('nan', 'none', '-'):
                    continue
                dt = parse_nqa_datetime(dt_raw)
                if job_str not in job_records or dt > job_records[job_str]['dt']:
                    job_records[job_str] = {'status': status_str, 'dt': dt}
            wb.close()
            res = {}
            for j_key, val in job_records.items():
                st = val['status']
                res[j_key] = st
                clean = j_key.replace('J', '')
                if clean:
                    res[clean] = st
            return res
        except Exception as e:
            if attempt < 3:
                time.sleep(1.0)
            else:
                log(f"[WARNING] Error reading NQA audits after 3 attempts: {e}")
                return {}
    return {}

def sync_dump_to_git():
    log("=" * 60)
    log("Dump.xlsx ya NQA Audit Report me nayi changes detect hui hain!")
    log("=" * 60)

    try:
        time.sleep(1.0)
        nqa_dict = load_nqa_audits()
        if nqa_dict:
            with open(AUDIT_JS, "w", encoding="utf-8") as f:
                f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")
            log(f"audit_data.js updated with {len(nqa_dict):,} keys.")

        import pandas as pd
        df = pd.read_excel(DUMP_FILE)
        jobs = []
        stats = {'nqa': 0, 'dump': 0, 'none': 0}

        for _, row in df.iterrows():
            job_val = str(row.get('JOB #', '') or '').strip()
            if not job_val or job_val.lower() == 'nan':
                continue
            clean_j = job_val.upper().replace('J', '')
            j_key = 'J' + clean_j
            dump_audit = str(row.get('AUDIT CONFIRM', '') or '').strip()
            if dump_audit.lower() in ('nan', 'none'):
                dump_audit = ''

            resolved_status = nqa_dict.get(j_key) or nqa_dict.get(clean_j) or ''
            audit_source = 'NQA'
            if not resolved_status:
                if dump_audit and dump_audit != '-':
                    resolved_status = dump_audit
                    audit_source = 'Dump'
                else:
                    resolved_status = 'Not Audited'
                    audit_source = 'None'

            if audit_source == 'NQA':
                stats['nqa'] += 1
            elif audit_source == 'Dump':
                stats['dump'] += 1
            else:
                stats['none'] += 1

            jobs.append({
                'job': job_val,
                'po': str(row.get('PONO', '') or '').strip(),
                'style': str(row.get('STYLE #', '') or '').strip(),
                'finish': str(row.get('FINISH', '') or '').strip(),
                'qty': int(row.get('QTY', 0) if pd.notnull(row.get('QTY')) else 0),
                'customer': str(row.get('CUSTOMER', '') or '').strip(),
                'status': str(row.get('STATUS', '') or '').strip(),
                'audit': dump_audit,
                'audit_status': resolved_status,
                'audit_source': audit_source
            })

        js_content = f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n"
        with open(JOBS_JS, "w", encoding="utf-8") as f:
            f.write(js_content)

        log(f"Parsed {len(jobs):,} jobs (NQA: {stats['nqa']}, Dump: {stats['dump']}, Not Audited: {stats['none']}).")

        # Git operations
        os.chdir(PROJECT_DIR)
        subprocess.run(["git", "config", "http.postBuffer", "524288000"], check=True)
        files_to_add = ["jobs_data.js", "Dump.xlsx"]
        if os.path.exists(AUDIT_JS):
            files_to_add.append("audit_data.js")
        subprocess.run(["git", "add"] + files_to_add, check=True)
        
        diff_check = subprocess.run(["git", "diff", "--cached", "--quiet"])
        if diff_check.returncode != 0:
            commit_msg = f"Auto-sync Dump & Audits: {time.strftime('%Y-%m-%d %H:%M')} ({len(jobs):,} jobs)"
            subprocess.run(["git", "commit", "-m", commit_msg], check=True)
            
            pushed = False
            for attempt in range(1, 4):
                log(f"GitHub Cloud par push kiya ja raha hai (Attempt {attempt}/3)...")
                push_res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
                if push_res.returncode == 0:
                    log(f"[SUCCESS] Cloud site successfully updated with {len(jobs):,} jobs!")
                    pushed = True
                    break
                else:
                    log(f"[RETRY] Push failed: {push_res.stderr.strip()}. Retrying in 2 seconds...")
                    time.sleep(2)

            if not pushed:
                log("[WARNING] Push fail ho gaya. Internet connection check karein.")
        else:
            log("[INFO] No new changes to commit.")

    except Exception as e:
        log(f"[ERROR] Sync error: {e}")

def watch_loop():
    log("=" * 65)
    log("  PACKING PLAN - REAL-TIME DUMP & AUDIT WATCHER ACTIVE")
    log("=" * 65)
    log(f"Watching Dump:  {DUMP_FILE}")
    log(f"Watching Audit: {NQA_FILE}")
    log("Jab bhi Dump.xlsx ya NQA Audit report update hoga, yeh automatically GitHub Cloud update karega.")
    log("-" * 65)

    last_dump_mtime = os.path.getmtime(DUMP_FILE) if os.path.exists(DUMP_FILE) else 0
    last_nqa_mtime = os.path.getmtime(NQA_FILE) if os.path.exists(NQA_FILE) else 0

    while True:
        try:
            dump_changed = False
            nqa_changed = False

            if os.path.exists(DUMP_FILE):
                cur_dump_mtime = os.path.getmtime(DUMP_FILE)
                if cur_dump_mtime != last_dump_mtime:
                    dump_changed = True
                    last_dump_mtime = cur_dump_mtime

            if os.path.exists(NQA_FILE):
                cur_nqa_mtime = os.path.getmtime(NQA_FILE)
                if cur_nqa_mtime != last_nqa_mtime:
                    nqa_changed = True
                    last_nqa_mtime = cur_nqa_mtime

            if dump_changed or nqa_changed:
                log(f"File modification detected (Dump: {dump_changed}, NQA: {nqa_changed})")
                sync_dump_to_git()

            time.sleep(2)
        except KeyboardInterrupt:
            log("Watcher stopped by user.")
            break
        except Exception as e:
            log(f"Loop error: {e}")
            time.sleep(3)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        sync_dump_to_git()
    else:
        watch_loop()
