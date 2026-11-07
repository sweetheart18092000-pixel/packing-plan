import os
import sys
import json
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime

print("=" * 65)
print("  PACKING PLAN - SYNC DUMP.XLSX, NQA AUDITS & AUDITOR SCHEDULE")
print("=" * 65)

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMP_PATH = os.path.join(PROJECT_DIR, "Dump.xlsx")
NQA_PATH = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"
SCHEDULE_PATH = os.path.join(PROJECT_DIR, "Packing_Finishing_Shipment_Schedule.xlsm")
SCHEDULE_FALLBACK = r"E:\Adv. Excel Assignmens\AI Projects\Shipment Plan\Packing_Finishing_Shipment_Schedule.xlsm"

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

# 2. Parse Auditors from Packing_Finishing_Shipment_Schedule.xlsm (' Audit Plan' sheet)
auditor_dict = {}

def load_schedule_auditors():
    target_path = SCHEDULE_PATH if os.path.exists(SCHEDULE_PATH) else (SCHEDULE_FALLBACK if os.path.exists(SCHEDULE_FALLBACK) else None)
    if not target_path:
        print(f"[INFO] Schedule file not found at {SCHEDULE_PATH} or {SCHEDULE_FALLBACK}")
        return {}

    try:
        print(f"Reading Auditors from Schedule: {target_path}...")
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
            print("[WARNING] 'Audit Plan' sheet not found in workbook.")
            return {}

        sheet_path = 'xl/' + sheet_target.lstrip('/')
        sheet_tree = ET.fromstring(zf.read(sheet_path))

        auditor_map = {}
        for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_num = int(row.attrib.get('r', 0))
            if row_num < 17:
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
        unique_auds = len(set(auditor_map.values()))
        print(f"[SUCCESS] Loaded {len(auditor_map)//2:,} jobs with Auditors (distinct auditors: {unique_auds}) from Audit Plan!")
        return auditor_map
    except Exception as e:
        print(f"[WARNING] Could not read schedule auditors: {e}")
        return {}

auditor_dict = load_schedule_auditors()

# 3. Write audit_data.js (containing both AUDIT_DATA and AUDITOR_DATA)
audit_js_path = os.path.join(PROJECT_DIR, "audit_data.js")
try:
    with open(audit_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")
        f.write(f"window.AUDITOR_DATA = {json.dumps(auditor_dict, ensure_ascii=False)};\n")
    print(f"[SUCCESS] audit_data.js generated with {len(nqa_dict):,} audits & {len(auditor_dict)//2 if auditor_dict else 0:,} auditors.")
except Exception as e:
    print(f"[ERROR] Could not write audit_data.js: {e}")

# 4. Parse Dump.xlsx
if not os.path.exists(DUMP_PATH):
    print(f"[ERROR] Dump.xlsx file nahi mili: {DUMP_PATH}")
    sys.exit(1)

try:
    import pandas as pd
    print("Reading Dump.xlsx...")
    df = pd.read_excel(DUMP_PATH)

    jobs = []
    stats = {'nqa': 0, 'dump': 0, 'none': 0, 'auditor_found': 0}

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

        # Auditor resolution from Audit Plan sheet
        job_auditor = auditor_dict.get(j_key) or auditor_dict.get(clean_j) or ''
        if job_auditor:
            stats['auditor_found'] += 1

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

    jobs_js_path = os.path.join(PROJECT_DIR, "jobs_data.js")
    with open(jobs_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n")

    print(f"[SUCCESS] {len(jobs):,} jobs successfully synced into jobs_data.js!")
    print(f"  - From NQA Audit Reports: {stats['nqa']:,}")
    print(f"  - From Dump (OK-AUDIT):   {stats['dump']:,}")
    print(f"  - Not Audited:            {stats['none']:,}")
    print(f"  - Auditor Assigned:       {stats['auditor_found']:,}")
except Exception as e:
    print(f"[ERROR] Sync issue: {e}")

print("=" * 65)
