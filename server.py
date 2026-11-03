import http.server
import socketserver
import webbrowser
import os
import socket
import sys
import json
import time
from datetime import datetime

# Ensure stdout handles utf-8
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Dedicated Unique Port
PORT = 7890

# In-memory Dump & Audit cache
DUMP_CACHE = {
    "mtime": 0,
    "nqa_mtime": 0,
    "jobs": [],
    "audit_data": {},
    "last_sync": "",
    "count": 0
}

NQA_PATH = r"E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx"

def get_all_active_ips():
    ips = []
    try:
        hostname = socket.gethostname()
        _, _, ip_list = socket.gethostbyname_ex(hostname)
        for ip in ip_list:
            if not ip.startswith("127.") and not ip.startswith("169.254"):
                ips.append(ip)
    except Exception:
        pass

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
        if primary_ip not in ips and not primary_ip.startswith("127."):
            ips.insert(0, primary_ip)
    except Exception:
        pass

    if not ips:
        ips.append("127.0.0.1")
    return ips

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

def load_system_dump(force_reload=False):
    global DUMP_CACHE
    dump_file = "Dump.xlsx"
    if not os.path.exists(dump_file):
        return DUMP_CACHE

    try:
        current_dump_mtime = os.path.getmtime(dump_file)
        current_nqa_mtime = os.path.getmtime(NQA_PATH) if os.path.exists(NQA_PATH) else 0

        if not force_reload and current_dump_mtime == DUMP_CACHE["mtime"] and current_nqa_mtime == DUMP_CACHE["nqa_mtime"] and DUMP_CACHE["jobs"]:
            return DUMP_CACHE

        # 1. Load NQA Final Audit Reports
        nqa_dict = {}
        if os.path.exists(NQA_PATH):
            try:
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
            except Exception as e:
                print(f"[WARNING] Error reading NQA audits in server.py: {e}")

        # Write audit_data.js
        with open("audit_data.js", "w", encoding="utf-8") as f:
            f.write(f"window.AUDIT_DATA = {json.dumps(nqa_dict, ensure_ascii=False)};\n")

        # 2. Load Dump.xlsx
        import pandas as pd
        df = pd.read_excel(dump_file)
        jobs = []
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

        DUMP_CACHE["mtime"] = current_dump_mtime
        DUMP_CACHE["nqa_mtime"] = current_nqa_mtime
        DUMP_CACHE["jobs"] = jobs
        DUMP_CACHE["audit_data"] = nqa_dict
        DUMP_CACHE["count"] = len(jobs)
        DUMP_CACHE["last_sync"] = time.strftime("%Y-%m-%d %H:%M:%S")

        with open("jobs_data.js", "w", encoding="utf-8") as f:
            f.write(f"window.DUMP_JOBS = {json.dumps(jobs, ensure_ascii=False)};\nwindow.JOBS_DATA = window.DUMP_JOBS;\n")

        print(f"[SYSTEM SYNC] Dump & NQA audits parsed: {len(jobs):,} jobs, {len(nqa_dict):,} audit keys at {DUMP_CACHE['last_sync']}.")
    except Exception as e:
        print(f"[ERROR SYNC] Failed to parse: {e}")

    return DUMP_CACHE

def print_qr_code(url, label="SCAN TO OPEN"):
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=1,
            border=1
        )
        qr.add_data(url)
        qr.make(fit=True)
        print(f"\n--- {label}: {url} ---")
        qr.print_ascii(invert=True)
    except Exception:
        pass

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/sync-dump' or self.path.startswith('/api/sync-dump?'):
            dump_data = load_system_dump(force_reload=True)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response_payload = {
                "success": True,
                "count": dump_data["count"],
                "last_sync": dump_data["last_sync"],
                "jobs": dump_data["jobs"],
                "audit_data": dump_data.get("audit_data", {})
            }
            self.wfile.write(json.dumps(response_payload).encode('utf-8'))
            return

        if self.path == '/api/network-info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            active_ips = get_all_active_ips()
            data = {
                "port": PORT,
                "ips": [
                    {
                        "ip": ip,
                        "url": f"http://{ip}:{PORT}",
                        "is_primary": idx == 0
                    }
                    for idx, ip in enumerate(active_ips)
                ]
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return
        
        return super().do_GET()

def start_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    load_system_dump()

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        ips = get_all_active_ips()
        primary_url = f"http://{ips[0]}:{PORT}"
        localhost_url = f"http://localhost:{PORT}"

        print("=" * 65)
        print("  PACKING PLAN & AUDIT ENGINE - LIVE SERVER ACTIVE")
        print("=" * 65)
        print(f"  Local PC:      {localhost_url}")
        print(f"  Mobile / WiFi: {primary_url}")
        print("=" * 65)
        print_qr_code(primary_url, label="MOBILE QR CODE")

        if len(sys.argv) > 1 and sys.argv[1] == "--open-browser":
            webbrowser.open(localhost_url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer gracefully shut down.")

if __name__ == "__main__":
    start_server()
