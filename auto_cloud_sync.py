import os
import sys
import time
import json
import subprocess
from datetime import datetime

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

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

def load_nqa_audits(nqa_path):
    if not os.path.exists(nqa_path):
        return {}
    try:
        import openpyxl
        wb = openpyxl.load_workbook(nqa_path, read_only=True, data_only=True)
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
        log(f"[WARNING] Error reading NQA audits: {e}")
        return {}

def sync_and_push():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)
    dump_file = "Dump.xlsx"
    nqa_file = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"

    log("=" * 60)
    log("  PACKING PLAN - AUTO CLOUD SYNC (DUMP & NQA AUDITS)")
    log("=" * 60)

    if not os.path.exists(dump_file):
        log(f"[WARNING] {dump_file} nahi mila! Skipping sync.")
        return False

    try:
        nqa_dict = load_nqa_audits(nqa_file)
        if nqa_dict:
            log(f"Loaded {len(nqa_dict):,} keys from NQA Final Audit Reports.")
            with open("audit_data.js", "w", encoding="utf-8") as f:
                f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")

        import pandas as pd
        log(f"Reading {dump_file}...")
        df = pd.read_excel(dump_file)
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
        with open("jobs_data.js", "w", encoding="utf-8") as f:
            f.write(js_content)

        log(f"Parsed {len(jobs):,} jobs (NQA: {stats['nqa']}, Dump: {stats['dump']}, Not Audited: {stats['none']}).")

        # Check git status for changes
        subprocess.run(["git", "config", "http.postBuffer", "524288000"], check=True)
        files_to_add = ["jobs_data.js", "Dump.xlsx"]
        if os.path.exists("audit_data.js"):
            files_to_add.append("audit_data.js")
        subprocess.run(["git", "add"] + files_to_add, check=True)

        diff_check = subprocess.run(["git", "diff", "--cached", "--quiet"])
        if diff_check.returncode == 0:
            log("[UP-TO-DATE] Koi nayi changes nahi hain. Cloud pehle se updated hai.")
            return True

        log("Nayi changes detect hui hain. GitHub par push kiya ja raha hai...")
        commit_msg = f"Auto-sync Dump & NQA Audits: {time.strftime('%Y-%m-%d %H:%M')} ({len(jobs):,} jobs)"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)

        # Retry push
        for attempt in range(1, 4):
            log(f"GitHub push attempt {attempt}/3...")
            res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
            if res.returncode == 0:
                log("[SUCCESS] GitHub Cloud site 100% updated successfully!")
                return True
            else:
                log(f"[RETRY] Push failed: {res.stderr.strip()}. Retrying in 2s...")
                time.sleep(2)

        log("[ERROR] Could not push to GitHub.")
        return False

    except Exception as e:
        log(f"[ERROR] Sync issue: {e}")
        return False

if __name__ == "__main__":
    success = sync_and_push()
    if "--pause" in sys.argv:
        print("\nPress Enter to close window...")
        input()
    sys.exit(0 if success else 1)
