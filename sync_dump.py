import os
import sys
import json
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

print("=" * 65)
print("  PACKING PLAN - SYNC DUMP.XLSX, NQA AUDITS & FULL AUDIT SCHEDULE")
print("=" * 65)

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMP_PATH = os.path.join(PROJECT_DIR, "Dump.xlsx")
NQA_PATH = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"
SCHEDULE_PATH = os.path.join(PROJECT_DIR, "Packing_Finishing_Shipment_Schedule.xlsm")
SCHEDULE_FALLBACK = r"E:\Adv. Excel Assignmens\AI Projects\Shipment Plan\Packing_Finishing_Shipment_Schedule.xlsm"

# 1. Parse NQA Final Audit Reports if exists
nqa_dict = {}

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

        print(f"[SUCCESS] Loaded {len(job_records):,} unique job audits from NQA_Final_Audit_Reports.xlsx!")
    except Exception as e:
        print(f"[WARNING] Could not read NQA Audit Reports: {e}")
else:
    print(f"[INFO] NQA Audit file not found at: {NQA_PATH}")

def format_excel_date(val):
    if not val or str(val).strip().lower() in ('nan', 'none', '-', '0', ''):
        return ''
    val_str = str(val).strip()
    try:
        f_val = float(val_str)
        if 30000 < f_val < 60000:
            dt = datetime(1899, 12, 30) + timedelta(days=f_val)
            return dt.strftime('%d-%b-%Y')
    except Exception:
        pass
    return val_str

def clean_val(v):
    if v is None:
        return ''
    s = str(v).strip()
    if s.lower() in ('nan', 'none', 'null', '#n/a', '#value!'):
        return ''
    return s

def load_ok_audit_status():
    target_path = SCHEDULE_PATH if os.path.exists(SCHEDULE_PATH) else (SCHEDULE_FALLBACK if os.path.exists(SCHEDULE_FALLBACK) else None)
    if not target_path:
        return {}
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
            if name.lower() == 'ok_audit status':
                sheet_target = rel_map.get(sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'))
                break

        if not sheet_target:
            zf.close()
            return {}

        sheet_path = 'xl/' + sheet_target.lstrip('/')
        sheet_tree = ET.fromstring(zf.read(sheet_path))

        ok_map = {}
        for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_num = int(row.attrib.get('r', 0))
            if row_num < 2:
                continue
            cols = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                col = ''.join([ch for ch in c.attrib.get('r', '') if ch.isalpha()])
                t = c.attrib.get('t', '')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = None
                if v is not None and v.text:
                    val = shared_strings[int(v.text)] if t == 's' else v.text
                cols[col] = val

            st = str(cols.get('B', '') or '').strip()
            job = str(cols.get('D', '') or '').strip().upper()
            if job and st and st.lower() not in ('nan', 'none', '-', ''):
                clean = job.replace('J', '')
                ok_map[job] = st
                if clean:
                    ok_map[clean] = st

        zf.close()
        print(f'[SUCCESS] Loaded {len(ok_map)//2:,} audits from Ok_AUDIT Status sheet!')
        return ok_map
    except Exception as e:
        print(f'[WARNING] Could not read Ok_AUDIT Status: {e}')
        return {}

def load_schedule_full():
    target_path = SCHEDULE_PATH if os.path.exists(SCHEDULE_PATH) else (SCHEDULE_FALLBACK if os.path.exists(SCHEDULE_FALLBACK) else None)
    if not target_path:
        print(f"[INFO] Schedule file not found at {SCHEDULE_PATH} or {SCHEDULE_FALLBACK}")
        return {}, {}

    try:
        print(f"Reading Full Schedule Details: {target_path}...")
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
            return {}, {}

        sheet_path = 'xl/' + sheet_target.lstrip('/')
        sheet_tree = ET.fromstring(zf.read(sheet_path))

        # Dynamically discover column letters from Row 16 by header text
        field_cols = {}
        for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_num = int(row.attrib.get('r', 0))
            if row_num == 16:
                for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    col = ''.join([ch for ch in c.attrib.get('r', '') if ch.isalpha()])
                    t = c.attrib.get('t', '')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = None
                    if v is not None and v.text:
                        val = shared_strings[int(v.text)] if t == 's' else v.text
                    if val:
                        h = val.strip().lower()
                        if h in ('jobs#', 'job#', 'jobs', 'job') and 'job' not in field_cols:
                            field_cols['job'] = col
                        elif 'auditor' in h:
                            field_cols['auditor'] = col
                        elif 'exf' in h:
                            field_cols['exf_date'] = col
                        elif 'prepared' in h:
                            field_cols['audit_prepared_by'] = col
                        elif 'ready audit' in h:
                            field_cols['ready_audit_plan'] = col
                        elif h == 'action' and 'action' not in field_cols:
                            field_cols['action'] = col
                        elif 'remarks from email' in h:
                            field_cols['remarks_emails'] = col
                        elif 'pl_position' in h or 'pl position' in h:
                            field_cols['pl_position'] = col
                        elif h == 'pack':
                            field_cols['pack'] = col
                        elif 'destination' in h:
                            field_cols['destination'] = col
                        elif h == 'dpcs':
                            field_cols['dpcs'] = col
                        elif h in ('d_ctns', 'd ctns'):
                            field_cols['d_ctns'] = col
                        elif h in ('loose_pcs', 'loose pcs'):
                            field_cols['loose_pcs'] = col
                        elif h in ('loose ctns', 'loose_ctns'):
                            field_cols['loose_ctns'] = col

        # Defaults if headers not matched
        job_col = field_cols.get('job', 'R')
        aud_col = field_cols.get('auditor', 'BF')
        exf_col = field_cols.get('exf_date', 'K')
        prep_col = field_cols.get('audit_prepared_by', 'N')
        ready_col = field_cols.get('ready_audit_plan', 'J')
        act_col = field_cols.get('action', 'O')
        rem_col = field_cols.get('remarks_emails', 'P')
        pl_col = field_cols.get('pl_position', 'D')
        pack_col = field_cols.get('pack', 'V')
        dest_col = field_cols.get('destination', 'Y')
        dpcs_col = field_cols.get('dpcs', 'AF')
        dctns_col = field_cols.get('d_ctns', 'AH')
        lpcs_col = field_cols.get('loose_pcs', 'AI')
        lctns_col = field_cols.get('loose_ctns', 'AJ')

        print(f"Dynamic column detection: Job={job_col}, Auditor={aud_col}, EXF={exf_col}")

        full_map = {}
        auds_map = {}

        for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_num = int(row.attrib.get('r', 0))
            if row_num < 17:
                continue
            row_dict = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                col = ''.join([ch for ch in c.attrib.get('r', '') if ch.isalpha()])
                t = c.attrib.get('t', '')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = None
                if v is not None and v.text:
                    val = shared_strings[int(v.text)] if t == 's' else v.text
                row_dict[col] = val

            job_raw = row_dict.get(job_col)
            if not job_raw:
                continue
            j_str = str(job_raw).strip().upper()
            if not j_str.startswith('J'):
                if j_str.isdigit():
                    j_str = 'J' + j_str
                else:
                    continue

            raw_aud = clean_val(row_dict.get(aud_col))
            if raw_aud.lower() in ('0', '-', 'audior', 'auditors') or raw_aud.isdigit():
                raw_aud = ''
            elif raw_aud.lower() == 'qmp':
                raw_aud = 'QMP'
            elif raw_aud.lower() == 'aadil':
                raw_aud = 'Aadil'
            elif 'aadil' in raw_aud.lower() and 'qmp' in raw_aud.lower():
                raw_aud = 'Aadil + QMP'

            rec = {
                'auditor': raw_aud,
                'exf_date': format_excel_date(clean_val(row_dict.get(exf_col))),
                'audit_prepared_by': clean_val(row_dict.get(prep_col)),
                'ready_audit_plan': format_excel_date(clean_val(row_dict.get(ready_col))),
                'action': clean_val(row_dict.get(act_col)),
                'remarks_emails': clean_val(row_dict.get(rem_col)),
                'pl_position': clean_val(row_dict.get(pl_col)),
                'pack': clean_val(row_dict.get(pack_col)),
                'destination': clean_val(row_dict.get(dest_col)),
                'dpcs': clean_val(row_dict.get(dpcs_col)),
                'd_ctns': clean_val(row_dict.get(dctns_col)),
                'loose_pcs': clean_val(row_dict.get(lpcs_col)),
                'loose_ctns': clean_val(row_dict.get(lctns_col))
            }

            clean_no_j = j_str.replace('J', '')
            full_map[j_str] = rec
            if clean_no_j:
                full_map[clean_no_j] = rec

            if raw_aud:
                auds_map[j_str] = raw_aud
                if clean_no_j:
                    auds_map[clean_no_j] = raw_aud

        zf.close()
        print(f"[SUCCESS] Loaded {len(full_map)//2:,} schedule jobs with full details from Audit Plan!")
        return full_map, auds_map
    except Exception as e:
        print(f"[WARNING] Could not read schedule details: {e}")
        return {}, {}

schedule_dict, auditor_dict = load_schedule_full()
ok_audit_dict = load_ok_audit_status()
for k, v in ok_audit_dict.items():
    if k not in nqa_dict:
        nqa_dict[k] = v

# 3. Write audit_data.js (containing AUDIT_DATA, AUDITOR_DATA, and SCHEDULE_DATA)
audit_js_path = os.path.join(PROJECT_DIR, "audit_data.js")
try:
    with open(audit_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")
        f.write(f"window.AUDITOR_DATA = {json.dumps(auditor_dict, ensure_ascii=False)};\n")
        f.write(f"window.SCHEDULE_DATA = {json.dumps(schedule_dict, ensure_ascii=False)};\n")
    print(f"[SUCCESS] audit_data.js generated with {len(nqa_dict):,} audits & {len(schedule_dict)//2:,} full schedule jobs.")
except Exception as e:
    print(f"[ERROR] Could not write audit_data.js: {e}")

# 4. Parse Dump.xlsx and embed schedule data
if not os.path.exists(DUMP_PATH):
    print(f"[ERROR] Dump.xlsx file nahi mili: {DUMP_PATH}")
    sys.exit(1)

try:
    import pandas as pd
    print("Reading Dump.xlsx...")
    df = pd.read_excel(DUMP_PATH)

    jobs = []
    stats = {'nqa': 0, 'dump': 0, 'none': 0, 'sched_matched': 0}

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

        # Schedule details matching
        sched_rec = schedule_dict.get(j_key) or schedule_dict.get(clean_j) or {}
        if sched_rec:
            stats['sched_matched'] += 1

        job_obj = {
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
            'auditor': sched_rec.get('auditor', ''),
            'exf_date': sched_rec.get('exf_date', ''),
            'audit_prepared_by': sched_rec.get('audit_prepared_by', ''),
            'ready_audit_plan': sched_rec.get('ready_audit_plan', ''),
            'action': sched_rec.get('action', ''),
            'remarks_emails': sched_rec.get('remarks_emails', ''),
            'pl_position': sched_rec.get('pl_position', ''),
            'pack': sched_rec.get('pack', ''),
            'destination': sched_rec.get('destination', ''),
            'dpcs': sched_rec.get('dpcs', ''),
            'd_ctns': sched_rec.get('d_ctns', ''),
            'loose_pcs': sched_rec.get('loose_pcs', ''),
            'loose_ctns': sched_rec.get('loose_ctns', '')
        }
        jobs.append(job_obj)

    jobs_js_path = os.path.join(PROJECT_DIR, "jobs_data.js")
    with open(jobs_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n")

    print(f"[SUCCESS] {len(jobs):,} jobs successfully synced into jobs_data.js!")
    print(f"  - From NQA Audit Reports: {stats['nqa']:,}")
    print(f"  - From Dump (OK-AUDIT):   {stats['dump']:,}")
    print(f"  - Not Audited:            {stats['none']:,}")
    print(f"  - Full Schedule Matched:  {stats['sched_matched']:,}")
except Exception as e:
    print(f"[ERROR] Sync issue: {e}")

print("=" * 65)
