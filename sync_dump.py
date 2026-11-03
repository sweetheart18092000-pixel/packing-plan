import os
import sys
import json
from datetime import datetime

print("=" * 65)
print("  PACKING PLAN - SYNC DUMP.XLSX & NQA AUDIT REPORTS")
print("=" * 65)

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMP_PATH = os.path.join(PROJECT_DIR, "Dump.xlsx")
NQA_PATH = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"

# 1. Parse NQA Final Audit Reports if exists
nqa_dict = {}
nqa_count = 0

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

if os.path.exists(NQA_PATH):
    try:
        print(f"Reading NQA Audit Reports: {NQA_PATH}...")
        import openpyxl
        wb = openpyxl.load_workbook(NQA_PATH, read_only=True, data_only=True)
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

        for j_key, val in job_records.items():
            st = val['status']
            nqa_dict[j_key] = st
            clean = j_key.replace('J', '')
            if clean:
                nqa_dict[clean] = st

        nqa_count = len(job_records)
        print(f"[SUCCESS] Loaded {nqa_count:,} unique job audits from NQA_Final_Audit_Reports.xlsx!")
    except Exception as e:
        print(f"[WARNING] Could not read NQA Audit Reports: {e}")
else:
    print(f"[INFO] NQA Audit file not found at: {NQA_PATH}")

# Write audit_data.js
audit_js_path = os.path.join(PROJECT_DIR, "audit_data.js")
try:
    with open(audit_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")
    print(f"[SUCCESS] audit_data.js generated with {len(nqa_dict):,} keys.")
except Exception as e:
    print(f"[ERROR] Could not write audit_data.js: {e}")

# 2. Parse Dump.xlsx
if not os.path.exists(DUMP_PATH):
    print(f"[ERROR] Dump.xlsx file nahi mili: {DUMP_PATH}")
    sys.exit(1)

try:
    import pandas as pd
    print("Reading Dump.xlsx...")
    df = pd.read_excel(DUMP_PATH)

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

        # Priority 1: NQA Final Audit Reports
        resolved_status = nqa_dict.get(j_key) or nqa_dict.get(clean_j) or ''
        audit_source = 'NQA'

        # Priority 2: Dump.xlsx OK-AUDIT
        if not resolved_status:
            if dump_audit and dump_audit != '-':
                resolved_status = dump_audit
                audit_source = 'Dump'
            else:
                # Priority 3: Not Audited
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

    jobs_js_path = os.path.join(PROJECT_DIR, "jobs_data.js")
    with open(jobs_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n")

    print(f"[SUCCESS] {len(jobs):,} jobs successfully synced into jobs_data.js!")
    print(f"  - From NQA Audit Reports: {stats['nqa']:,}")
    print(f"  - From Dump (OK-AUDIT):   {stats['dump']:,}")
    print(f"  - Not Audited:            {stats['none']:,}")
except Exception as e:
    print(f"[ERROR] Sync issue: {e}")

print("=" * 65)
