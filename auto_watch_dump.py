import os
import sys
import time
import json
import zipfile
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMP_FILE = os.path.join(PROJECT_DIR, "Dump.xlsx")
NQA_FILE = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"
SCHEDULE_FILE = os.path.join(PROJECT_DIR, "Packing_Finishing_Shipment_Schedule.xlsm")
SCHEDULE_FALLBACK = r"E:\Adv. Excel Assignmens\AI Projects\Shipment Plan\Packing_Finishing_Shipment_Schedule.xlsm"

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
            f.flush()
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

def load_schedule_auditors():
    target_path = SCHEDULE_FILE if os.path.exists(SCHEDULE_FILE) else (SCHEDULE_FALLBACK if os.path.exists(SCHEDULE_FALLBACK) else None)
    if not target_path:
        return {}

    for attempt in range(1, 4):
        try:
            zf = zipfile.ZipFile(target_path, 'r')
            shared_strings = []
            if 'xl/sharedStrings.xml' in zf.namelist():
                tree = ET.fromstring(zf.read('xl/sharedStrings.xml'))
                for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    if t is not None and t.text:
                        shared_strings.append(t.text)
                    else:
                        text_parts = [r.text for r in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if r.text]
                        shared_strings.append(''.join(text_parts))

            wb_tree = ET.fromstring(zf.read('xl/workbook.xml'))
            rels_tree = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
            rel_map = {r.attrib['Id']: r.attrib['Target'] for r in rels_tree}

            sheet_target = None
            for sheet in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
                name = sheet.attrib.get('name', '').strip()
                if name.lower() == 'audit plan':
                    sheet_target = rel_map.get(sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'))
                    break

            if not sheet_target:
                return {}

            sheet_path = 'xl/' + sheet_target.lstrip('/')
            sheet_tree = ET.fromstring(zf.read(sheet_path))

            auditor_map = {}
            for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                if int(row.attrib.get('r', 0)) < 17:
                    continue
                job_val, auditor_val = None, None
                for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    col = ''.join([ch for ch in c.attrib.get('r', '') if ch.isalpha()])
                    t = c.attrib.get('t', '')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = None
                    if v is not None and v.text:
                        val = shared_strings[int(v.text)] if t == 's' else v.text
                    if col == 'Q':
                        job_val = val
                    elif col == 'BE':
                        auditor_val = val

                if job_val:
                    j_str = str(job_val).strip().upper()
                    if not j_str.startswith('J'):
                        if j_str.isdigit():
                            j_str = 'J' + j_str
                        else:
                            continue
                    if auditor_val:
                        a_str = str(auditor_val).strip()
                        if a_str.lower() in ('nan', 'none', '-', '0', 'audior', 'auditors') or a_str.isdigit():
                            continue
                        if a_str.lower() == 'qmp':
                            clean_aud = 'QMP'
                        elif a_str.lower() == 'aadil':
                            clean_aud = 'Aadil'
                        elif 'aadil' in a_str.lower() and 'qmp' in a_str.lower():
                            clean_aud = 'Aadil + QMP'
                        else:
                            clean_aud = a_str
                        auditor_map[j_str] = clean_aud
                        clean_no_j = j_str.replace('J', '')
                        if clean_no_j:
                            auditor_map[clean_no_j] = clean_aud

            zf.close()
            return auditor_map
        except Exception as e:
            if attempt < 3:
                time.sleep(1.0)
            else:
                log(f"[WARNING] Error reading schedule auditors after 3 attempts: {e}")
                return {}
    return {}

def sync_dump_to_git():
    log("=" * 60)
    log("Dump.xlsx, NQA Audit Report ya Schedule me changes detect hui hain!")
    log("=" * 60)

    try:
        time.sleep(1.0)
        nqa_dict = load_nqa_audits()
        auditor_dict = load_schedule_auditors()

        with open(AUDIT_JS, "w", encoding="utf-8") as f:
            f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")
            f.write(f"window.AUDITOR_DATA = {json.dumps(auditor_dict, ensure_ascii=False)};\n")
        log(f"audit_data.js updated with {len(nqa_dict):,} audits & {len(auditor_dict)//2 if auditor_dict else 0:,} auditors.")

        import pandas as pd
        df = pd.read_excel(DUMP_FILE)
        jobs = []
        stats = {'nqa': 0, 'dump': 0, 'none': 0, 'auditor': 0}

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

            job_auditor = auditor_dict.get(j_key) or auditor_dict.get(clean_j) or ''
            if job_auditor:
                stats['auditor'] += 1

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
                'audit_source': audit_source,
                'auditor': job_auditor
            })

        js_content = f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n"
        with open(JOBS_JS, "w", encoding="utf-8") as f:
            f.write(js_content)

        log(f"Parsed {len(jobs):,} jobs (NQA: {stats['nqa']}, Dump: {stats['dump']}, Not Audited: {stats['none']}, Auditors: {stats['auditor']}).")

        # Git operations (Runs 100% silently with CREATE_NO_WINDOW so no black cmd windows pop up)
        no_window_flag = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        os.chdir(PROJECT_DIR)
        subprocess.run(["git", "config", "http.postBuffer", "524288000"], check=True, creationflags=no_window_flag)
        files_to_add = ["jobs_data.js", "Dump.xlsx", "audit_data.js"]
        subprocess.run(["git", "add"] + files_to_add, check=True, creationflags=no_window_flag)
        
        diff_check = subprocess.run(["git", "diff", "--cached", "--quiet"], creationflags=no_window_flag)
        if diff_check.returncode != 0:
            commit_msg = f"Auto-sync Dump, Audits & Auditors: {time.strftime('%Y-%m-%d %H:%M')} ({len(jobs):,} jobs)"
            subprocess.run(["git", "commit", "-m", commit_msg], check=True, creationflags=no_window_flag)
            
            pushed = False
            for attempt in range(1, 4):
                log(f"GitHub Cloud par push kiya ja raha hai (Attempt {attempt}/3)...")
                push_res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True, creationflags=no_window_flag)
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
    log("  PACKING PLAN - REAL-TIME DUMP, AUDITS & AUDITORS WATCHER ACTIVE")
    log("=" * 65)
    log(f"Watching Dump:     {DUMP_FILE}")
    log(f"Watching Audits:   {NQA_FILE}")
    log(f"Watching Schedule: {SCHEDULE_FILE}")
    log("Jab bhi files update hongi, yeh automatically GitHub Cloud update karega.")
    log("-" * 65)

    last_dump_mtime = os.path.getmtime(DUMP_FILE) if os.path.exists(DUMP_FILE) else 0
    last_nqa_mtime = os.path.getmtime(NQA_FILE) if os.path.exists(NQA_FILE) else 0
    last_sched_mtime = os.path.getmtime(SCHEDULE_FILE) if os.path.exists(SCHEDULE_FILE) else 0

    while True:
        try:
            dump_changed = False
            nqa_changed = False
            sched_changed = False

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

            if os.path.exists(SCHEDULE_FILE):
                cur_sched_mtime = os.path.getmtime(SCHEDULE_FILE)
                if cur_sched_mtime != last_sched_mtime:
                    sched_changed = True
                    last_sched_mtime = cur_sched_mtime

            if dump_changed or nqa_changed or sched_changed:
                log(f"File modification detected (Dump: {dump_changed}, NQA: {nqa_changed}, Schedule: {sched_changed})")
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
