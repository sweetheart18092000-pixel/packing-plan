// =========================================================================
// WhatsApp Packing Report Generator - Mobile & Live Port 7890
// Ultra Responsive, Concise & High Aesthetic UI Engine
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // --- State Variables: Prioritize freshest preloaded Dump ---
    let preloaded = (typeof window.DUMP_JOBS !== 'undefined' && Array.isArray(window.DUMP_JOBS)) 
        ? window.DUMP_JOBS 
        : ((typeof window.JOBS_DATA !== 'undefined' && Array.isArray(window.JOBS_DATA)) ? window.JOBS_DATA : []);

    let savedJobs = null;
    try {
        const cached = localStorage.getItem('PACKING_PLAN_CACHE');
        if (cached) {
            savedJobs = JSON.parse(cached);
        }
    } catch (e) {}

    // Use preloaded by default so git updates reflect immediately, or fallback to savedJobs
    let jobsDataset = (preloaded && preloaded.length > 0) 
        ? preloaded 
        : ((savedJobs && savedJobs.length > 0) ? savedJobs : []);

    let currentJob = null;
    let multiQueue = [];
    let reportMode = 'single'; // 'single' or 'multi'

    // --- DOM Elements ---
    const inputJobSearch = document.getElementById('input-job-search');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const suggestionsBox = document.getElementById('suggestions-box');
    const dumpCountBadge = document.getElementById('dump-count-badge');
    const btnSyncDump = document.getElementById('btn-sync-dump');
    const btnBadgeSync = document.getElementById('btn-badge-sync');
    const iconSync = document.getElementById('icon-sync');
    const activeJobIndicator = document.getElementById('active-job-indicator');

    // Display Fields
    const displayPo = document.getElementById('display-po');
    const displayQty = document.getElementById('display-qty');
    const displayStyle = document.getElementById('display-style');
    const displayCustomer = document.getElementById('display-customer');
    const displayFinish = document.getElementById('display-finish');
    const displayAuditor = document.getElementById('display-auditor');
    const displayAuditorBadge = document.getElementById('display-auditor-badge');
    const displayAuditorCard = document.getElementById('display-auditor-card');
    const displayAudit = document.getElementById('display-audit');
    const displayAuditBadge = document.getElementById('display-audit-badge');
    const displayAuditCard = document.getElementById('display-audit-card');

    // Remarks & Controls
    const inputRemarks = document.getElementById('input-remarks');
    const quickRemarkBtns = document.querySelectorAll('.quick-remark-btn');
    const btnResetForm = document.getElementById('btn-reset-form');
    const btnAddToMulti = document.getElementById('btn-add-to-multi');

    // --- Bulk Mode Elements ---
    const tabBtnSingle = document.getElementById('tab-btn-single');
    const tabBtnBulk = document.getElementById('tab-btn-bulk');
    const sectionSingleMode = document.getElementById('section-single-mode');
    const sectionBulkMode = document.getElementById('section-bulk-mode');
    const inputBulkJobs = document.getElementById('input-bulk-jobs');
    const inputBulkRemarks = document.getElementById('input-bulk-remarks');
    const btnGenerateBulk = document.getElementById('btn-generate-bulk');
    const btnClearBulkText = document.getElementById('btn-clear-bulk-text');
    const bulkStatusBox = document.getElementById('bulk-status-box');
    const bulkRemarkChips = document.querySelectorAll('.bulk-remark-chip');

    // --- Admin & Worker Auth Elements ---
    const btnNavAdmin = document.getElementById('btn-nav-admin');
    const labelNavAdmin = document.getElementById('label-nav-admin');
    const btnNavWorker = document.getElementById('btn-nav-worker');
    const labelNavWorker = document.getElementById('label-nav-worker');
    const modalAdminLogin = document.getElementById('modal-admin-login');
    const modalAdminLoginClose = document.getElementById('modal-admin-login-close');
    const inputAdminUsername = document.getElementById('input-admin-username');
    const inputAdminPassword = document.getElementById('input-admin-password');
    const btnLoginAdmin = document.getElementById('btn-login-admin');
    const modalWorkerSelect = document.getElementById('modal-worker-select');
    const modalWorkerClose = document.getElementById('modal-worker-close');
    const authActiveUserDisplay = document.getElementById('auth-active-user-display');
    const selectWorkerList = document.getElementById('select-worker-list');
    const btnSetActiveWorker = document.getElementById('btn-set-active-worker');
    const btnDeleteWorker = document.getElementById('btn-delete-worker');
    const btnDeleteAllWorkers = document.getElementById('btn-delete-all-workers');
    const inputNewWorkerName = document.getElementById('input-new-worker-name');
    const inputNewWorkerDept = document.getElementById('input-new-worker-dept');
    const btnCreateWorker = document.getElementById('btn-create-worker');
    const modalAdminDashboard = document.getElementById('modal-admin-dashboard');
    const modalAdminClose = document.getElementById('modal-admin-close');
    const btnAdminLogout = document.getElementById('btn-admin-logout');

    const kpiTodayJobs = document.getElementById('kpi-today-jobs');
    const kpiTodayQty = document.getElementById('kpi-today-qty');
    const kpiActiveWorkers = document.getElementById('kpi-active-workers');
    const kpiTotalLogs = document.getElementById('kpi-total-logs');
    const btnLogDateFilters = document.querySelectorAll('.btn-log-date-filter');
    const filterLogWorker = document.getElementById('filter-log-worker');
    const inputSearchLogs = document.getElementById('input-search-logs');
    const adminLogsTbody = document.getElementById('admin-logs-tbody');
    const logRecordsCount = document.getElementById('log-records-count');
    const btnExportExcel = document.getElementById('btn-export-excel');
    const btnClearLogs = document.getElementById('btn-clear-logs');

    // Preview & Mode Switchers
    const btnFormatSingle = document.getElementById('btn-format-single');
    const btnFormatMulti = document.getElementById('btn-format-multi');
    const btnFormatBulk = document.getElementById('btn-format-bulk');
    const multiCountBadge = document.getElementById('multi-count-badge');
    const previewMessageEl = document.getElementById('whatsapp-message-preview');
    const previewTimeEl = document.getElementById('preview-time');

    // Queue Card
    const multiJobQueueCard = document.getElementById('multi-job-queue-card');
    const queueCountEl = document.getElementById('queue-count');
    const queueItemsList = document.getElementById('queue-items-list');
    const btnClearQueue = document.getElementById('btn-clear-queue');

    // Desktop Buttons
    const btnCopyWaDesktop = document.getElementById('btn-copy-whatsapp');
    const btnCopyTextDesktop = document.getElementById('btn-copy-text');
    const btnOpenWaDesktop = document.getElementById('btn-open-wa');

    // Mobile Bottom Sticky Buttons
    const btnCopyWaMobile = document.getElementById('btn-copy-whatsapp-mobile');
    const btnCopyTextMobile = document.getElementById('btn-copy-text-mobile');
    const btnOpenWaMobile = document.getElementById('btn-open-wa-mobile');

    // QR Modal Elements
    const btnShowQr = document.getElementById('btn-show-qr');
    const modalQr = document.getElementById('modal-qr');
    const modalQrClose = document.getElementById('modal-qr-close');
    const qrImage = document.getElementById('qr-image');
    const mobileUrlDisplay = document.getElementById('mobile-url-display');
    const btnCopyMobileUrl = document.getElementById('btn-copy-mobile-url');

    // Toast
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Update Initial Badge
    if (dumpCountBadge && jobsDataset.length > 0) {
        dumpCountBadge.textContent = `${jobsDataset.length.toLocaleString()} Jobs`;
    }

    // --- Helper: Toast Notification ---
    let toastTimeout = null;
    function showToast(msg, isSuccess = true) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = msg;
        clearTimeout(toastTimeout);
        toast.classList.remove('opacity-0', '-translate-y-16', 'sm:translate-y-16');
        toast.classList.add('opacity-100', 'translate-y-0');

        toastTimeout = setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', '-translate-y-16', 'sm:translate-y-16');
        }, 2200);
    }

    // --- Helper: Clock in WhatsApp Bubble ---
    function updateClock() {
        if (!previewTimeEl) return;
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        previewTimeEl.textContent = `${hours}:${minutes} ${ampm}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    // --- Live System & Cloud Dump Sync ---
        async function syncSystemDump(showNotice = false) {
        if (iconSync) iconSync.classList.add('animate-spin');

        let synced = false;
        let auditSynced = false;

        // 1. Try local server API
        try {
            const res = await fetch('/api/sync-dump');
            if (res.ok) {
                const result = await res.json();
                if (result && result.jobs && Array.isArray(result.jobs) && result.jobs.length > 0) {
                    jobsDataset = result.jobs;
                    synced = true;
                }
                if (result && result.audit_data && typeof result.audit_data === 'object') {
                    window.AUDIT_DATA = result.audit_data;
                    auditSynced = true;
                }
            }
        } catch (e) {}

        // 2. Fetch fresh jobs_data.js with cache busting
        if (!synced) {
            try {
                const bustUrl = './jobs_data.js?_t=' + Date.now();
                const res = await fetch(bustUrl, { cache: 'no-store' });
                if (res.ok) {
                    const jsText = await res.text();
                    const jsonMatch = jsText.match(/window\.DUMP_JOBS\s*=\s*(\[.*?\].*?);/s);
                    if (jsonMatch && jsonMatch[1]) {
                        const parsed = JSON.parse(jsonMatch[1]);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            jobsDataset = parsed;
                            synced = true;
                        }
                    }
                }
            } catch (err) {
                console.warn('Fallback jobs_data fetch error:', err);
            }
        }

        // 3. Fetch fresh audit_data.js with cache busting
        try {
            const auditBustUrl = './audit_data.js?_t=' + Date.now();
            const aRes = await fetch(auditBustUrl, { cache: 'no-store' });
            if (aRes.ok) {
                const aText = await aRes.text();
                const aMatch = aText.match(/window\.AUDIT_DATA\s*=\s*(\{.*?\}.*?);/s);
                if (aMatch && aMatch[1]) {
                    window.AUDIT_DATA = JSON.parse(aMatch[1]);
                    try {
                        localStorage.setItem('PACKING_AUDIT_DATA', JSON.stringify(window.AUDIT_DATA));
                    } catch (e) {}
                    auditSynced = true;
                }
            }
        } catch (err) {
            console.warn('Fallback audit_data fetch error:', err);
        }

        if (synced) {
            window.DUMP_JOBS = jobsDataset;
            window.JOBS_DATA = jobsDataset;
            try {
                localStorage.setItem('PACKING_PLAN_CACHE', JSON.stringify(jobsDataset));
            } catch (e) {}
            if (dumpCountBadge) {
                dumpCountBadge.textContent = `${jobsDataset.length.toLocaleString()} Jobs`;
            }
        }

        // If current job is open, instantly refresh its display and preview with fresh audit status!
        if (currentJob) {
            const updated = jobsDataset.find(j => {
                const jNum = String(j.job || '').toUpperCase();
                return jNum === String(currentJob.job).toUpperCase();
            });
            if (updated) {
                currentJob = updated;
            }
            selectJob(currentJob);
        } else if (reportMode === 'bulk') {
            handleBulkCompile();
        } else {
            updatePreview();
        }

        if (showNotice) {
            const auditCount = window.AUDIT_DATA ? Math.round(Object.keys(window.AUDIT_DATA).length / 2) : 0;
            showToast(`✅ Synced ${jobsDataset.length.toLocaleString()} Jobs & ${auditCount} Audit Records!`);
        }

        if (iconSync) {
            setTimeout(() => iconSync.classList.remove('animate-spin'), 600);
        }
    }

    // Auto-sync on initial page load
    syncSystemDump(false);

    // --- Live Auto-Refresh Engine ---
    // 1. Periodic background polling every 15 seconds for live audit updates
    setInterval(() => {
        syncSystemDump(false);
    }, 15000);

    // 2. Immediate refresh when user switches back to this tab or unlocks mobile screen
    window.addEventListener('focus', () => syncSystemDump(false));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            syncSystemDump(false);
        }
    });

    // Bind manual Sync button clicks
    if (btnSyncDump) {
        btnSyncDump.addEventListener('click', () => syncSystemDump(true));
    }
    if (btnBadgeSync) {
        btnBadgeSync.addEventListener('click', () => syncSystemDump(true));
    }

    // --- Format Report Text ---
    let bulkGeneratedText = '';

    // --- Audit Status Lookup Engine ---
    // Priority 1: NQA Final Audit Reports (window.AUDIT_DATA / local cache)
    // Priority 2: Dump.xlsx OK-AUDIT
    // Priority 3: Not Audited
    function getJobAuditStatus(jobOrItem) {
        if (!jobOrItem) return 'Not Audited';

        let jobNum = '';
        let itemAudit = '';
        let embeddedStatus = '';

        if (typeof jobOrItem === 'string') {
            jobNum = jobOrItem.trim().toUpperCase();
        } else if (typeof jobOrItem === 'object') {
            jobNum = String(jobOrItem.job || '').trim().toUpperCase();
            itemAudit = String(jobOrItem.audit || '').trim();
            embeddedStatus = String(jobOrItem.audit_status || '').trim();
        }

        const cleanJob = jobNum.replace(/^J/i, '');

        // 1. Priority 1: Check window.AUDIT_DATA (from NQA_Final_Audit_Reports.xlsx)
        if (typeof window.AUDIT_DATA === 'object' && window.AUDIT_DATA !== null) {
            if (window.AUDIT_DATA[jobNum]) return window.AUDIT_DATA[jobNum];
            if (cleanJob && window.AUDIT_DATA['J' + cleanJob]) return window.AUDIT_DATA['J' + cleanJob];
            if (cleanJob && window.AUDIT_DATA[cleanJob]) return window.AUDIT_DATA[cleanJob];
        }

        // 1b. Check localStorage uploaded audit reports cache
        try {
            const localAudit = JSON.parse(localStorage.getItem('PACKING_AUDIT_DATA') || '{}');
            if (localAudit[jobNum]) return localAudit[jobNum];
            if (cleanJob && localAudit['J' + cleanJob]) return localAudit['J' + cleanJob];
            if (cleanJob && localAudit[cleanJob]) return localAudit[cleanJob];
        } catch (e) {}

        // If pre-compiled into jobs_data.js
        if (embeddedStatus && embeddedStatus !== 'Not Audited' && embeddedStatus.toLowerCase() !== 'nan' && embeddedStatus.toLowerCase() !== 'none') {
            return embeddedStatus;
        }

        // 2. Priority 2: Check Dump.xlsx audit column (e.g. OK-AUDIT)
        if (!itemAudit || itemAudit.toLowerCase() === 'nan' || itemAudit.toLowerCase() === 'null') {
            const found = jobsDataset.find(j => {
                const jNum = String(j.job || '').toUpperCase();
                return jNum === jobNum || jNum.replace(/^J/i, '') === cleanJob;
            });
            if (found) {
                if (found.audit_status && found.audit_status !== 'Not Audited' && found.audit_status.toLowerCase() !== 'nan') {
                    return found.audit_status;
                }
                if (found.audit && found.audit.toLowerCase() !== 'nan') {
                    itemAudit = String(found.audit).trim();
                }
            }
        }

        if (itemAudit && itemAudit.toLowerCase() !== 'nan' && itemAudit.toLowerCase() !== 'null' && itemAudit !== '-' && itemAudit !== '') {
            return itemAudit;
        }

        // 3. Priority 3: Fallback to Not Audited
        return 'Not Audited';
    }

    function getAuditBadgeStyle(status) {
        const s = String(status || '').toLowerCase();
        if (s.includes('pass') || s.includes('ok')) {
            return {
                badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
                icon: 'check-circle'
            };
        }
        if (s.includes('fail') || s.includes('reject') || s.includes('hold')) {
            return {
                badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
                icon: 'alert-circle'
            };
        }
        return {
            badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
            icon: 'clock'
        };
    }

    // Helper to get Assigned Auditor from Packing_Finishing_Shipment_Schedule.xlsm
    function getJobAuditor(jobOrItem) {
        if (!jobOrItem) return 'Not Assigned';

        let jobNum = '';
        let embeddedAuditor = '';

        if (typeof jobOrItem === 'string') {
            jobNum = jobOrItem.trim().toUpperCase();
        } else if (typeof jobOrItem === 'object') {
            jobNum = String(jobOrItem.job || '').trim().toUpperCase();
            embeddedAuditor = String(jobOrItem.auditor || '').trim();
        }

        const cleanJob = jobNum.replace(/^J/i, '');

        // 1. Check window.AUDITOR_DATA (loaded from audit_data.js)
        if (typeof window.AUDITOR_DATA === 'object' && window.AUDITOR_DATA !== null) {
            if (window.AUDITOR_DATA[jobNum]) return window.AUDITOR_DATA[jobNum];
            if (cleanJob && window.AUDITOR_DATA['J' + cleanJob]) return window.AUDITOR_DATA['J' + cleanJob];
            if (cleanJob && window.AUDITOR_DATA[cleanJob]) return window.AUDITOR_DATA[cleanJob];
        }

        // 2. Check localStorage
        try {
            const localAuditors = JSON.parse(localStorage.getItem('PACKING_AUDITOR_DATA') || '{}');
            if (localAuditors[jobNum]) return localAuditors[jobNum];
            if (cleanJob && localAuditors['J' + cleanJob]) return localAuditors['J' + cleanJob];
            if (cleanJob && localAuditors[cleanJob]) return localAuditors[cleanJob];
        } catch (e) {}

        // 3. Embedded in job item
        if (embeddedAuditor && embeddedAuditor.toLowerCase() !== 'nan' && embeddedAuditor.toLowerCase() !== 'none' && embeddedAuditor !== 'Not Assigned') {
            return embeddedAuditor;
        }

        // 4. Lookup from jobsDataset
        const found = jobsDataset.find(j => {
            const jNum = String(j.job || '').toUpperCase();
            return jNum === jobNum || jNum.replace(/^J/i, '') === cleanJob;
        });
        if (found && found.auditor && found.auditor.toLowerCase() !== 'nan' && found.auditor !== 'Not Assigned') {
            return found.auditor;
        }

        return 'Not Assigned';
    }

    function getAuditorBadgeStyle(auditor) {
        const a = String(auditor || '').toLowerCase();
        if (a && a !== 'not assigned' && a !== '---' && a !== '-') {
            return {
                badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold',
                textClass: 'text-indigo-800 font-black'
            };
        }
        return {
            badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300 font-medium',
            textClass: 'text-slate-500 font-medium'
        };
    }

    // Smart Format for Multi & Bulk Jobs: Consolidate repeated Style, Finish, Buyer, Auditor, Audit Status & Remarks
    function formatSmartJobsReport(jobs, customRemarks = '') {
        if (!jobs || jobs.length === 0) return '';
        let totalQty = 0;
        jobs.forEach(j => totalQty += (Number(j.qty) || 0));

        // Group by style + finish
        const groups = {};
        jobs.forEach(j => {
            const key = (j.style || '---') + '___' + (j.finish || '---');
            if (!groups[key]) {
                groups[key] = {
                    style: j.style || '---',
                    finish: j.finish || '---',
                    customer: j.customer || '',
                    items: []
                };
            }
            const st = j.audit_status || getJobAuditStatus(j);
            const aud = j.auditor || getJobAuditor(j);
            groups[key].items.push({
                ...j,
                audit_status: st,
                auditor: aud
            });
        });

        const groupKeys = Object.keys(groups);
        const finalRemarks = (customRemarks || '').trim() || 'Ready For Audit';

        // Case A: Single Style Group (All jobs have same Style/Finish)
        if (groupKeys.length === 1) {
            const g = groups[groupKeys[0]];
            const uniqueStatuses = [...new Set(g.items.map(it => it.audit_status || 'Not Audited'))];
            const isHomogeneousStatus = uniqueStatuses.length === 1;
            const groupAuditStatusText = isHomogeneousStatus ? uniqueStatuses[0] : uniqueStatuses.join(' / ');

            const assignedAuditors = [...new Set(g.items.map(it => it.auditor).filter(a => a && a !== 'Not Assigned'))];
            const groupAuditorText = assignedAuditors.length > 0 ? assignedAuditors.join(' / ') : 'Not Assigned';
            const isHomogeneousAuditor = assignedAuditors.length <= 1;

            let msg = `*📦 CLOSED PACKING LISTS UPDATE (${jobs.length} JOBS)*\n`;
            msg += `*Finish Name:* ${g.finish}\n`;
            msg += `*Style:* ${g.style}\n`;
            if (g.customer && g.customer !== '---') {
                msg += `*Buyer:* ${g.customer}\n`;
            }
            msg += `*Auditor:* ${groupAuditorText}\n`;
            msg += `*Audit Status:* ${groupAuditStatusText}\n`;
            msg += `*Remarks:* ${finalRemarks}\n`;
            msg += `-------------------------------------\n`;
            msg += `*JOBS & PO BREAKDOWN:*\n`;
            g.items.forEach((item, idx) => {
                const q = Number(item.qty) || 0;
                const qStr = q > 0 ? q.toLocaleString() : '---';
                let extraNotes = [];
                if (!isHomogeneousAuditor && item.auditor && item.auditor !== 'Not Assigned') {
                    extraNotes.push(`Auditor: ${item.auditor}`);
                }
                if (!isHomogeneousStatus && item.audit_status) {
                    extraNotes.push(`Audit: ${item.audit_status}`);
                }
                const extra = extraNotes.length > 0 ? ` (${extraNotes.join(' | ')})` : '';
                msg += `${idx + 1}. Job: ${item.job} | PO: ${item.po || '---'} | QTY: ${qStr}${extra}\n`;
            });
            msg += `-------------------------------------\n`;
            msg += `*Total Jobs:* ${jobs.length} | *Total QTY:* ${totalQty.toLocaleString()} pcs`;
            return msg;
        }

        // Case B: Multiple Style Groups
        let msg = `*📦 CLOSED PACKING LISTS UPDATE (${jobs.length} JOBS)*\n`;
        msg += `-------------------------------------\n`;
        groupKeys.forEach((key, gIdx) => {
            const g = groups[key];
            let subQty = 0;
            g.items.forEach(it => subQty += (Number(it.qty) || 0));

            const uniqueStatuses = [...new Set(g.items.map(it => it.audit_status || 'Not Audited'))];
            const isHomogeneousStatus = uniqueStatuses.length === 1;
            const groupAuditStatusText = isHomogeneousStatus ? uniqueStatuses[0] : uniqueStatuses.join(' / ');

            const assignedAuditors = [...new Set(g.items.map(it => it.auditor).filter(a => a && a !== 'Not Assigned'))];
            const groupAuditorText = assignedAuditors.length > 0 ? assignedAuditors.join(' / ') : 'Not Assigned';
            const isHomogeneousAuditor = assignedAuditors.length <= 1;

            msg += `*GROUP #${gIdx + 1}:*\n`;
            msg += `*Finish Name:* ${g.finish}\n`;
            msg += `*Style:* ${g.style}\n`;
            if (g.customer && g.customer !== '---') {
                msg += `*Buyer:* ${g.customer}\n`;
            }
            msg += `*Auditor:* ${groupAuditorText}\n`;
            msg += `*Audit Status:* ${groupAuditStatusText}\n`;
            msg += `*Remarks:* ${finalRemarks}\n`;
            msg += `*JOBS & PO BREAKDOWN:*\n`;
            g.items.forEach((item, idx) => {
                const q = Number(item.qty) || 0;
                const qStr = q > 0 ? q.toLocaleString() : '---';
                let extraNotes = [];
                if (!isHomogeneousAuditor && item.auditor && item.auditor !== 'Not Assigned') {
                    extraNotes.push(`Auditor: ${item.auditor}`);
                }
                if (!isHomogeneousStatus && item.audit_status) {
                    extraNotes.push(`Audit: ${item.audit_status}`);
                }
                const extra = extraNotes.length > 0 ? ` (${extraNotes.join(' | ')})` : '';
                msg += `  ${idx + 1}. Job: ${item.job} | PO: ${item.po || '---'} | QTY: ${qStr}${extra}\n`;
            });
            if (g.items.length > 1) {
                msg += `  _Subtotal: ${subQty.toLocaleString()} pcs_\n`;
            }
            msg += `-------------------------------------\n`;
        });

        msg += `*Total Jobs:* ${jobs.length} | *Total QTY:* ${totalQty.toLocaleString()} pcs`;
        return msg;
    }

    function generateReportText() {
        if (reportMode === 'bulk') {
            if (bulkGeneratedText) return bulkGeneratedText;
            const raw = (typeof inputBulkJobs !== 'undefined' && inputBulkJobs) ? inputBulkJobs.value.trim() : '';
            if (raw && typeof handleBulkCompile === 'function') {
                handleBulkCompile();
                if (bulkGeneratedText) return bulkGeneratedText;
            }
            return `*📦 CLOSED PACKING LISTS UPDATE (BULK JOBS)*\n` +
                   `-------------------------------------\n` +
                   `📝 _Yahan jobs list paste karein (e.g. 65250, 67215)_\n` +
                   `_Combined WhatsApp message khud ban jayega._\n` +
                   `-------------------------------------`;
        }

        if (reportMode === 'multi') {
            if (multiQueue.length === 0) {
                return `*📦 CLOSED PACKING LISTS UPDATE*\n` +
                       `-------------------------------------\n` +
                       `⚠️ _Koi jobs queue me add nahi kiye gaye._\n` +
                       `_Job search karein aur 'Add to Multi-Job Queue' dabayein._\n` +
                       `-------------------------------------`;
            }
            return formatSmartJobsReport(multiQueue, (inputRemarks ? inputRemarks.value.trim() : '') || 'Ready For Audit');
        }

        // Single Mode
        if (!currentJob) {
            return `*📦 CLOSED PACKING LISTS UPDATE*\n` +
                   `-------------------------------------\n` +
                   `*Job:* ---\n` +
                   `*Po:* ---\n` +
                   `*Style:* ---\n` +
                   `*Finish Name:* ---\n` +
                   `*QTY:* ---\n` +
                   `*Auditor:* Not Assigned\n` +
                   `*Audit Status:* Not Audited\n` +
                   `*Remarks:* Ready For Audit\n` +
                   `-------------------------------------\n` +
                   `_Job number search karein ya type karein._`;
        }

        const auditStatus = getJobAuditStatus(currentJob);
        const auditor = getJobAuditor(currentJob);
        const userEntered = inputRemarks ? inputRemarks.value.trim() : '';
        const remarksText = userEntered || 'Ready For Audit';
        const formattedQty = currentJob.qty ? Number(currentJob.qty).toLocaleString() : '---';
        const auditorVal = (auditor && auditor !== 'Not Assigned') ? auditor : 'Not Assigned';

        return `*📦 CLOSED PACKING LISTS UPDATE*\n` +
               `-------------------------------------\n` +
               `*Job:* ${currentJob.job}\n` +
               `*Po:* ${currentJob.po || '---'}\n` +
               `*Style:* ${currentJob.style || '---'}\n` +
               `*Finish Name:* ${currentJob.finish || '---'}\n` +
               `*QTY:* ${formattedQty}\n` +
               `*Auditor:* ${auditorVal}\n` +
               `*Audit Status:* ${auditStatus}\n` +
               `*Remarks:* ${remarksText}\n` +
               `-------------------------------------`;
    }

    // --- Update WhatsApp Bubble Preview ---
    function updatePreview() {
        if (!previewMessageEl) return;
        const rawText = generateReportText();
        previewMessageEl.textContent = rawText;
    }

    // --- Populate Form with Selected Job ---
    function selectJob(jobItem) {
        currentJob = jobItem;
        
        displayPo.textContent = jobItem.po || '---';
        displayQty.textContent = jobItem.qty ? Number(jobItem.qty).toLocaleString() + ' pcs' : '0 pcs';
        displayStyle.textContent = jobItem.style || '---';
        displayCustomer.textContent = jobItem.customer || '---';
        displayFinish.textContent = jobItem.finish || '---';

        // Auditor Display
        const auditor = getJobAuditor(jobItem);
        if (displayAuditor) {
            displayAuditor.textContent = auditor;
        }
        if (displayAuditorBadge) {
            displayAuditorBadge.textContent = auditor === 'Not Assigned' ? 'Unassigned' : auditor;
            const aStyle = getAuditorBadgeStyle(auditor);
            displayAuditorBadge.className = `text-[10px] font-bold px-2 py-0.5 rounded-md ${aStyle.badgeClass}`;
        }

        // Audit Status Display
        const auditStatus = getJobAuditStatus(jobItem);
        if (displayAudit) {
            displayAudit.textContent = auditStatus;
        }
        if (displayAuditBadge) {
            displayAuditBadge.textContent = auditStatus;
            const bStyle = getAuditBadgeStyle(auditStatus);
            displayAuditBadge.className = `text-[10px] font-black px-2.5 py-0.5 rounded-md ${bStyle.badgeClass}`;
        }

        if (inputRemarks) {
            inputRemarks.placeholder = 'Remarks (Default: Ready For Audit, or type custom)...';
        }

        if (activeJobIndicator) {
            activeJobIndicator.textContent = `Job #${jobItem.job}`;
            activeJobIndicator.className = 'text-[10px] font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-xs';
        }

        inputJobSearch.value = jobItem.job;
        suggestionsBox.classList.add('hidden');

        updatePreview();
        showToast(`✅ Job #${jobItem.job} Loaded! (${auditStatus})`);

        // Mobile UX: brief gentle scroll to preview or remarks
        if (window.innerWidth < 640) {
            inputRemarks.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // --- Search Category Filter State ---
    let currentSearchFilter = 'all'; // 'all', 'job', 'po', 'style'
    const searchFilterPills = document.querySelectorAll('.search-filter-pill');
    const searchInputIcon = document.getElementById('search-input-icon');

    if (searchFilterPills && searchFilterPills.length > 0) {
        searchFilterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                const filter = pill.getAttribute('data-search-filter');
                currentSearchFilter = filter;

                // Update active pill styling
                searchFilterPills.forEach(p => {
                    p.className = 'search-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition tap-active flex items-center gap-1';
                });
                pill.className = 'search-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs transition tap-active flex items-center gap-1';

                // Adjust inputmode and placeholder for fast thumb typing
                if (filter === 'job') {
                    inputJobSearch.setAttribute('inputmode', 'numeric');
                    inputJobSearch.placeholder = 'Type Job # (e.g. 67250 / J67250)...';
                } else if (filter === 'po') {
                    inputJobSearch.setAttribute('inputmode', 'text');
                    inputJobSearch.placeholder = 'Type PO # (e.g. PO1234)...';
                } else if (filter === 'style') {
                    inputJobSearch.setAttribute('inputmode', 'text');
                    inputJobSearch.placeholder = 'Type Style # (e.g. ST-401)...';
                } else {
                    inputJobSearch.setAttribute('inputmode', 'text');
                    inputJobSearch.placeholder = 'Type Job # (67250 / J67250), PO #, Style #...';
                }

                if (window.lucide) lucide.createIcons();
                inputJobSearch.focus();
                handleSearchInput();
            });
        });
    }

    // --- Search Autocomplete Handler (Job, PO, Style & Numeric-without-J) ---
    function handleSearchInput() {
        const rawQuery = inputJobSearch.value.trim();
        if (!rawQuery) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        const query = rawQuery.toLowerCase();
        const isNumeric = /^\d+$/.test(query);
        const cleanDigits = query.replace(/^j/i, '');

        let matches = [];

        if (currentSearchFilter === 'job') {
            matches = jobsDataset.filter(item => {
                const j = String(item.job || '').toLowerCase();
                const cleanJ = j.replace(/^j/i, '');
                return j.includes(query) || (cleanDigits && cleanJ.includes(cleanDigits));
            });
        } else if (currentSearchFilter === 'po') {
            matches = jobsDataset.filter(item => {
                const p = String(item.po || '').toLowerCase();
                return p.includes(query);
            });
        } else if (currentSearchFilter === 'style') {
            matches = jobsDataset.filter(item => {
                const s = String(item.style || '').toLowerCase();
                return s.includes(query);
            });
        } else {
            // 'all' Universal mode
            if (isNumeric) {
                // If user types pure numbers (e.g. 67250), prioritize matching Job # first
                const jobMatches = jobsDataset.filter(item => {
                    const j = String(item.job || '').toLowerCase();
                    const cleanJ = j.replace(/^j/i, '');
                    return j.includes(query) || cleanJ.includes(query);
                });
                const otherMatches = jobsDataset.filter(item => {
                    const p = String(item.po || '').toLowerCase();
                    const s = String(item.style || '').toLowerCase();
                    return !jobMatches.includes(item) && (p.includes(query) || s.includes(query));
                });
                matches = [...jobMatches, ...otherMatches];
            } else {
                matches = jobsDataset.filter(item => {
                    const j = String(item.job || '').toLowerCase();
                    const cleanJ = j.replace(/^j/i, '');
                    const p = String(item.po || '').toLowerCase();
                    const s = String(item.style || '').toLowerCase();
                    const f = String(item.finish || '').toLowerCase();
                    const c = String(item.customer || '').toLowerCase();

                    return j.includes(query) || (cleanDigits && cleanJ.includes(cleanDigits)) || p.includes(query) || s.includes(query) || f.includes(query) || c.includes(query);
                });
            }
        }

        const trimmedMatches = matches.slice(0, 35);

        if (trimmedMatches.length === 0) {
            suggestionsBox.innerHTML = `
                <div class="p-3 text-xs text-slate-500 text-center">
                    No matching records found for "<strong>${inputJobSearch.value}</strong>".
                </div>
            `;
            suggestionsBox.classList.remove('hidden');
            return;
        }

        // Dropdown Header with result count & active filter
        let dropdownHtml = `
            <div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-between border-b border-slate-100">
                <span>Found ${matches.length} matches (${currentSearchFilter.toUpperCase()} Mode)</span>
                <span class="text-emerald-700 font-normal">Tap any job to load</span>
            </div>
        `;

        dropdownHtml += trimmedMatches.map(item => {
            const isPoMatch = String(item.po || '').toLowerCase().includes(query);
            const isStyleMatch = String(item.style || '').toLowerCase().includes(query);

            return `
            <div class="suggestion-row p-2.5 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer transition flex items-center justify-between text-xs border-b border-slate-100 last:border-b-0 tap-active" data-job="${item.job}">
                <div class="overflow-hidden pr-2">
                    <div class="flex items-center gap-1.5">
                        <span class="font-extrabold text-slate-900 font-mono text-xs sm:text-sm text-emerald-800">Job #${item.job}</span>
                        ${item.customer ? `<span class="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-bold">${item.customer}</span>` : ''}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5 truncate flex flex-wrap gap-x-2">
                        <span class="${isPoMatch ? 'text-emerald-700 font-black bg-emerald-100 px-1 rounded' : ''}"><strong>PO:</strong> ${item.po || '-'}</span>
                        <span class="${isStyleMatch ? 'text-purple-700 font-black bg-purple-100 px-1 rounded' : ''}"><strong>Style:</strong> ${item.style || '-'}</span>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <span class="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-mono font-black text-xs">
                        ${item.qty ? Number(item.qty).toLocaleString() : '0'} pcs
                    </span>
                    <div class="text-[9px] text-slate-400 mt-0.5 truncate max-w-[100px]">${item.finish || ''}</div>
                </div>
            </div>
            `;
        }).join('');

        suggestionsBox.innerHTML = dropdownHtml;
        suggestionsBox.classList.remove('hidden');

        // Attach Click to Suggestions
        const rows = suggestionsBox.querySelectorAll('.suggestion-row');
        rows.forEach(r => {
            r.addEventListener('click', () => {
                const jobNum = r.getAttribute('data-job');
                const matched = jobsDataset.find(x => String(x.job) === String(jobNum));
                if (matched) {
                    selectJob(matched);
                }
            });
        });
    }

    // Bind Search Input Events
    if (inputJobSearch) {
        inputJobSearch.addEventListener('input', handleSearchInput);
        inputJobSearch.addEventListener('focus', () => {
            if (inputJobSearch.value.trim().length > 0) {
                handleSearchInput();
            }
        });
        inputJobSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = inputJobSearch.value.trim().toLowerCase();
                const cleanDigits = query.replace(/^j/i, '');
                const matched = jobsDataset.find(x => {
                    const j = String(x.job).toLowerCase();
                    const p = String(x.po).toLowerCase();
                    const s = String(x.style).toLowerCase();
                    return j === query || j === 'j' + cleanDigits || p === query || s === query;
                });
                if (matched) {
                    selectJob(matched);
                    inputJobSearch.blur();
                }
            }
        });
    }

    // Close Dropdown on outside click
    document.addEventListener('click', (e) => {
        if (suggestionsBox && !suggestionsBox.contains(e.target) && e.target !== inputJobSearch) {
            suggestionsBox.classList.add('hidden');
        }
    });

    // Clear Search Input
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            inputJobSearch.value = '';
            suggestionsBox.classList.add('hidden');
            inputJobSearch.focus();
        });
    }

    // Real-time Remarks Typing
    if (inputRemarks) {
        inputRemarks.addEventListener('input', updatePreview);
    }

    // --- Voice Typing Setup (Web Speech API) ---
    function setupVoiceTyping(btnId, iconId, inputEl) {
        const btn = document.getElementById(btnId);
        const icon = document.getElementById(iconId);
        if (!btn || !inputEl) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            btn.addEventListener('click', () => {
                alert('⚠️ Voice typing is supported on Google Chrome, Microsoft Edge, and Android Chrome. Please open the link in Chrome browser.');
            });
            return;
        }

        let recognition = null;
        let isListening = false;

        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.lang = 'ur-PK'; // Urdu with English words recognition

            recognition.onstart = () => {
                isListening = true;
                btn.classList.add('recording-active');
                inputEl.placeholder = '🎤 Sun raha hoon... Boliye (Listening)';
                showToast('🎤 Voice Typing Active: Remarks boliye...');
                if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
            };

            recognition.onresult = (event) => {
                if (event.results && event.results.length > 0) {
                    const transcript = event.results[0][0].transcript;
                    if (transcript) {
                        const curr = inputEl.value.trim();
                        inputEl.value = curr ? `${curr} ${transcript}` : transcript;
                        updatePreview();
                        showToast(`🎤 Added: "${transcript}"`);
                    }
                }
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    showToast(`⚠️ Mic Notice: ${event.error}`, false);
                }
            };

            recognition.onend = () => {
                isListening = false;
                btn.classList.remove('recording-active');
                inputEl.placeholder = 'Type remarks or tap chips below...';
            };

            btn.addEventListener('click', () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    try {
                        recognition.start();
                    } catch (e) {
                        recognition.stop();
                    }
                }
            });
        } catch (e) {
            console.error('Speech setup error:', e);
        }
    }

    // Initialize Voice Typing for Single Remarks & Bulk Remarks
    setupVoiceTyping('btn-voice-remarks', 'icon-voice-remarks', inputRemarks);
    setupVoiceTyping('btn-bulk-voice-remarks', 'icon-bulk-voice-remarks', inputBulkRemarks);

    // Quick Remarks Chips
    quickRemarkBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentVal = inputRemarks.value.trim();
            const textToAdd = btn.textContent.trim();
            if (currentVal) {
                inputRemarks.value = `${currentVal}, ${textToAdd}`;
            } else {
                inputRemarks.value = textToAdd;
            }
            updatePreview();
            showToast(`Remark added: ${textToAdd}`);
            if (navigator.vibrate) navigator.vibrate(15);
        });
    });

    // --- Mode Switcher (Single vs Bulk Tab & Bulk Compilation) ---

    // Parse job numbers accurately from any pasted text
    function parseBulkJobTokens(rawText) {
        if (!rawText) return [];
        const linesOrParts = rawText.split(/[\r\n,;|\t]+/).map(s => s.trim()).filter(Boolean);
        const tokens = [];

        linesOrParts.forEach(part => {
            const matches = part.match(/\bJ?\d{3,8}\b/gi) || part.match(/J?\d+/gi);
            if (matches) {
                matches.forEach(m => tokens.push(m.trim().toUpperCase()));
            }
        });

        if (tokens.length === 0) {
            const spaceMatches = rawText.match(/\bJ?\d+\b/gi) || [];
            spaceMatches.forEach(m => tokens.push(m.trim().toUpperCase()));
        }

        return [...new Set(tokens)];
    }

    // Format mode pills updater
    function updateFormatModePills() {
        if (btnFormatSingle) {
            if (reportMode === 'single') {
                btnFormatSingle.classList.add('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
                btnFormatSingle.classList.remove('text-slate-600');
            } else {
                btnFormatSingle.classList.remove('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
                btnFormatSingle.classList.add('text-slate-600');
            }
        }
        if (btnFormatMulti) {
            if (reportMode === 'multi') {
                btnFormatMulti.classList.add('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
                btnFormatMulti.classList.remove('text-slate-600');
            } else {
                btnFormatMulti.classList.remove('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
                btnFormatMulti.classList.add('text-slate-600');
            }
        }
        if (btnFormatBulk) {
            if (reportMode === 'bulk') {
                btnFormatBulk.classList.add('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
                btnFormatBulk.classList.remove('text-slate-600');
            } else {
                btnFormatBulk.classList.remove('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
                btnFormatBulk.classList.add('text-slate-600');
            }
        }
    }

    // Compile Bulk Jobs into Single Message
    function handleBulkCompile() {
        const rawInput = inputBulkJobs ? inputBulkJobs.value.trim() : '';
        if (!rawInput) {
            bulkGeneratedText = '';
            if (bulkStatusBox) bulkStatusBox.classList.add('hidden');
            updatePreview();
            return;
        }

        const tokens = parseBulkJobTokens(rawInput);
        if (tokens.length === 0) {
            bulkGeneratedText = '';
            if (bulkStatusBox) bulkStatusBox.classList.add('hidden');
            updatePreview();
            return;
        }

        const compiledJobs = [];
        let matchedCount = 0;
        let manualCount = 0;

        let passCount = 0;
        let failCount = 0;
        let dumpOkCount = 0;
        let notAuditedCount = 0;

        tokens.forEach(tok => {
            const cleanTok = tok.replace(/^J/i, '');
            const found = jobsDataset.find(item => {
                const j = String(item.job || '').toUpperCase();
                const cleanJ = j.replace(/^J/i, '');
                return j === tok || cleanJ === cleanTok;
            });

            const auditStatus = getJobAuditStatus(found || tok);
            const auditor = getJobAuditor(found || tok);
            const lowerAudit = auditStatus.toLowerCase();
            if (lowerAudit.includes('fail')) failCount++;
            else if (lowerAudit.includes('pass')) passCount++;
            else if (lowerAudit.includes('ok')) dumpOkCount++;
            else notAuditedCount++;

            if (found) {
                matchedCount++;
                compiledJobs.push({
                    job: found.job || ('J' + cleanTok),
                    po: found.po || '---',
                    style: found.style || '---',
                    finish: found.finish || '---',
                    qty: found.qty ? Number(found.qty) : 0,
                    customer: found.customer || '',
                    audit: found.audit || '',
                    audit_status: auditStatus,
                    auditor: auditor,
                    fromDump: true
                });
            } else {
                manualCount++;
                compiledJobs.push({
                    job: tok.startsWith('J') ? tok : ('J' + tok),
                    po: '---',
                    style: '---',
                    finish: '---',
                    qty: 0,
                    customer: '',
                    audit: '',
                    audit_status: auditStatus,
                    auditor: auditor,
                    fromDump: false
                });
            }
        });

        const commonRemarks = (inputBulkRemarks && inputBulkRemarks.value.trim()) ? inputBulkRemarks.value.trim() : '';
        let totalQty = 0;
        compiledJobs.forEach(jobItem => {
            totalQty += (Number(jobItem.qty) || 0);
        });

        const combinedMsg = formatSmartJobsReport(compiledJobs, commonRemarks);
        bulkGeneratedText = combinedMsg;
        reportMode = 'bulk';
        updateFormatModePills();
        updatePreview();

        if (bulkStatusBox) {
            bulkStatusBox.className = 'p-2.5 rounded-xl text-xs space-y-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900';
            
            let auditStatsHtml = [];
            if (passCount > 0) auditStatsHtml.push(`<span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">${passCount} Passed</span>`);
            if (dumpOkCount > 0) auditStatsHtml.push(`<span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">${dumpOkCount} OK-AUDIT</span>`);
            if (notAuditedCount > 0) auditStatsHtml.push(`<span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">${notAuditedCount} Not Audited</span>`);
            if (failCount > 0) auditStatsHtml.push(`<span class="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">${failCount} Failed</span>`);

            let statusHtml = `
                <div class="flex items-center justify-between font-bold">
                    <span>✅ ${compiledJobs.length} Jobs Ready in Combined Msg</span>
                    <span>Total QTY: ${totalQty.toLocaleString()} pcs</span>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap text-[11px] pt-1 border-t border-emerald-200/60">
                    <span class="font-bold text-slate-600">Audit Status:</span>
                    ${auditStatsHtml.join(' ')}
                </div>
            `;
            if (manualCount > 0) {
                statusHtml += `<div class="text-[10px] text-amber-700 font-semibold">
                    ℹ️ ${matchedCount} jobs Dump me mili hain, ${manualCount} manual add ki gayi hain.
                </div>`;
            }
            bulkStatusBox.innerHTML = statusHtml;
            bulkStatusBox.classList.remove('hidden');
        }
    }

    function switchToSingleMode() {
        reportMode = 'single';
        if (tabBtnSingle) tabBtnSingle.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 bg-white text-emerald-950 shadow-sm tap-active';
        if (tabBtnBulk) tabBtnBulk.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 tap-active';
        if (sectionSingleMode) sectionSingleMode.classList.remove('hidden');
        if (sectionBulkMode) sectionBulkMode.classList.add('hidden');
        updateFormatModePills();
        updatePreview();
    }

    function switchToBulkMode() {
        reportMode = 'bulk';
        if (tabBtnBulk) tabBtnBulk.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 bg-white text-emerald-950 shadow-sm tap-active';
        if (tabBtnSingle) tabBtnSingle.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 tap-active';
        if (sectionBulkMode) sectionBulkMode.classList.remove('hidden');
        if (sectionSingleMode) sectionSingleMode.classList.add('hidden');
        updateFormatModePills();
        handleBulkCompile();
    }

    if (tabBtnSingle) tabBtnSingle.addEventListener('click', switchToSingleMode);
    if (tabBtnBulk) tabBtnBulk.addEventListener('click', switchToBulkMode);

    // Real-time live auto-compile as user types or pastes
    if (inputBulkJobs) inputBulkJobs.addEventListener('input', handleBulkCompile);
    if (inputBulkRemarks) inputBulkRemarks.addEventListener('input', handleBulkCompile);

    // Bulk Quick Chips
    bulkRemarkChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const current = inputBulkRemarks.value.trim();
            const val = chip.textContent.trim();
            inputBulkRemarks.value = current ? `${current}, ${val}` : val;
            handleBulkCompile();
            showToast(`Bulk Remark: ${val}`);
            if (navigator.vibrate) navigator.vibrate(15);
        });
    });

    // Clear Bulk Textarea
    if (btnClearBulkText) {
        btnClearBulkText.addEventListener('click', () => {
            if (inputBulkJobs) inputBulkJobs.value = '';
            if (inputBulkRemarks) inputBulkRemarks.value = '';
            if (bulkStatusBox) bulkStatusBox.classList.add('hidden');
            bulkGeneratedText = '';
            updatePreview();
            showToast('Bulk inputs cleared!');
        });
    }

    // Generate Button Click
    if (btnGenerateBulk) {
        btnGenerateBulk.addEventListener('click', () => {
            handleBulkCompile();
            const rawInput = inputBulkJobs ? inputBulkJobs.value.trim() : '';
            if (!rawInput) {
                showToast('⚠️ Pehle jobs numbers list enter karein!', false);
                if (inputBulkJobs) inputBulkJobs.focus();
                return;
            }
            showToast('✅ Combined Message ban gaya!');
            if (navigator.vibrate) navigator.vibrate([20, 40]);
            if (window.innerWidth < 1024) {
                const previewCard = document.getElementById('whatsapp-message-preview');
                if (previewCard) previewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Reset Form
    if (btnResetForm) {
        btnResetForm.addEventListener('click', () => {
            currentJob = null;
            inputJobSearch.value = '';
            displayPo.textContent = '-';
            displayQty.textContent = '-';
            displayStyle.textContent = '-';
            displayCustomer.textContent = '-';
            displayFinish.textContent = '-';
            if (displayAuditor) displayAuditor.textContent = 'Not Assigned';
            if (displayAuditorBadge) {
                displayAuditorBadge.textContent = 'Schedule';
                displayAuditorBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200';
            }
            if (displayAudit) displayAudit.textContent = 'Not Audited';
            if (displayAuditBadge) {
                displayAuditBadge.textContent = 'Not Audited';
                displayAuditBadge.className = 'text-[10px] font-black px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300';
            }
            inputRemarks.value = '';
            inputRemarks.placeholder = 'Remarks (Default: Ready For Audit, or type custom)...';
            if (activeJobIndicator) {
                activeJobIndicator.textContent = 'No Job Selected';
                activeJobIndicator.className = 'text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200';
            }
            suggestionsBox.classList.add('hidden');
            updatePreview();
            showToast('Form reset!');
        });
    }

    // Add to Multi-Job Queue
    if (btnAddToMulti) {
        btnAddToMulti.addEventListener('click', () => {
            if (!currentJob) {
                showToast('⚠️ Pehle koi Job search karke select karein!', false);
                return;
            }

            const auditStatus = getJobAuditStatus(currentJob);
            const auditor = getJobAuditor(currentJob);
            const itemToQueue = {
                job: currentJob.job,
                po: currentJob.po,
                style: currentJob.style,
                finish: currentJob.finish,
                qty: currentJob.qty,
                customer: currentJob.customer,
                audit: currentJob.audit || '',
                audit_status: auditStatus,
                auditor: auditor,
                remarks: inputRemarks.value.trim() || 'Ready For Audit'
            };

            multiQueue.push(itemToQueue);
            updateQueueUI();
            showToast(`➕ Job #${currentJob.job} added to queue (${multiQueue.length})!`);
            if (navigator.vibrate) navigator.vibrate([15, 30]);
        });
    }

    // Update Queue UI
    function updateQueueUI() {
        if (multiCountBadge) multiCountBadge.textContent = multiQueue.length;
        if (queueCountEl) queueCountEl.textContent = multiQueue.length;

        if (multiQueue.length > 0) {
            multiJobQueueCard.classList.remove('hidden');
            queueItemsList.innerHTML = multiQueue.map((item, idx) => {
                const st = item.audit_status || getJobAuditStatus(item);
                const bStyle = getAuditBadgeStyle(st);
                const aud = item.auditor || getJobAuditor(item);
                const audBadge = (aud && aud !== 'Not Assigned')
                    ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">👤 ${aud}</span>`
                    : '';
                return `
                <div class="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs gap-2">
                    <div class="truncate flex-1">
                        <span class="font-bold text-slate-900 font-mono">#${idx + 1} Job ${item.job}</span> &bull; 
                        <span class="text-slate-600">PO: ${item.po || '-'}</span> &bull; 
                        <span class="font-semibold text-emerald-700">${item.qty ? Number(item.qty).toLocaleString() : '0'} pcs</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${audBadge}
                        <span class="text-[10px] font-black px-2 py-0.5 rounded ${bStyle.badgeClass}">
                            ${st}
                        </span>
                        <button class="btn-remove-queue-item text-rose-500 hover:text-rose-700 p-1 font-bold tap-active" data-index="${idx}">
                            ✕
                        </button>
                    </div>
                </div>
            `;
            }).join('');

            // Bind remove item
            const removeBtns = queueItemsList.querySelectorAll('.btn-remove-queue-item');
            removeBtns.forEach(b => {
                b.addEventListener('click', () => {
                    const idx = parseInt(b.getAttribute('data-index'), 10);
                    multiQueue.splice(idx, 1);
                    updateQueueUI();
                    updatePreview();
                });
            });
        } else {
            multiJobQueueCard.classList.add('hidden');
            queueItemsList.innerHTML = '';
        }

        if (reportMode === 'multi') {
            updatePreview();
        }
    }

    // Clear Queue
    if (btnClearQueue) {
        btnClearQueue.addEventListener('click', () => {
            multiQueue = [];
            updateQueueUI();
            updatePreview();
            showToast('Multi-job queue cleared!');
        });
    }

    // Mode Switcher Buttons (Single, Multi, Bulk)
    if (btnFormatSingle) {
        btnFormatSingle.addEventListener('click', () => {
            switchToSingleMode();
        });
    }

    if (btnFormatMulti) {
        btnFormatMulti.addEventListener('click', () => {
            reportMode = 'multi';
            updateFormatModePills();
            updatePreview();
        });
    }

    if (btnFormatBulk) {
        btnFormatBulk.addEventListener('click', () => {
            switchToBulkMode();
        });
    }

    // --- Copy Routine (Desktop & Mobile) ---
    async function copyReport() {
        const text = generateReportText();
        let copied = false;

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                copied = true;
            } catch (err) {
                console.warn('Clipboard write error:', err);
            }
        }

        if (!copied) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
                copied = true;
            } catch (e) {
                console.error('Fallback copy error:', e);
            }
            ta.remove();
        }

        if (copied) {
            if (navigator.vibrate) navigator.vibrate(30);
            showToast('📋 WhatsApp Report Copied to Clipboard!');
            
            // Auto-log report submission into Central DB under Active Worker
            logCurrentReportSubmission();

            if (btnCopyTextDesktop) btnCopyTextDesktop.textContent = 'COPIED TO CLIPBOARD!';
            if (btnCopyTextMobile) btnCopyTextMobile.textContent = 'Copied!';
            
            setTimeout(() => {
                if (btnCopyTextDesktop) btnCopyTextDesktop.textContent = 'COPY WHATSAPP REPORT';
                if (btnCopyTextMobile) btnCopyTextMobile.textContent = 'Copy Report';
            }, 2000);
        } else {
            showToast('⚠️ Copy failed, please manually select text.', false);
        }
    }

    // --- Direct Share to WhatsApp ---
    function shareToWhatsApp() {
        const text = generateReportText();
        const encodedText = encodeURIComponent(text);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        let url = '';
        if (isMobile) {
            url = `whatsapp://send?text=${encodedText}`;
        } else {
            url = `https://api.whatsapp.com/send?text=${encodedText}`;
        }

        // Auto-log report submission into Central DB under Active Worker
        logCurrentReportSubmission();

        if (navigator.vibrate) navigator.vibrate(20);
        window.open(url, '_blank');
    }

    // Bind Copy & Share Buttons
    if (btnCopyWaDesktop) btnCopyWaDesktop.addEventListener('click', copyReport);
    if (btnOpenWaDesktop) btnOpenWaDesktop.addEventListener('click', shareToWhatsApp);
    if (btnCopyWaMobile) btnCopyWaMobile.addEventListener('click', copyReport);
    if (btnOpenWaMobile) btnOpenWaMobile.addEventListener('click', shareToWhatsApp);

    // --- Network Options & QR Modal Logic ---
    const networkOptionsContainer = document.getElementById('network-options-container');
    let availableUrls = [
        { name: "Wi-Fi 2 (PDMesh)", ip: "192.168.68.32", url: "http://192.168.68.32:7890" },
        { name: "Atil Internet", ip: "192.168.0.52", url: "http://192.168.0.52:7890" }
    ];

    function setQrUrl(targetUrl) {
        if (mobileUrlDisplay) {
            mobileUrlDisplay.textContent = targetUrl;
        }
        if (qrImage) {
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}&color=075e54`;
        }
    }

    function renderNetworkOptions() {
        if (!networkOptionsContainer) return;
        networkOptionsContainer.innerHTML = availableUrls.map((item, idx) => `
            <button type="button" class="net-pill-btn px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${idx === 0 ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}" data-url="${item.url}">
                ${item.ip}
            </button>
        `).join('');

        const buttons = networkOptionsContainer.querySelectorAll('.net-pill-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.className = 'net-pill-btn px-2.5 py-1 text-[11px] font-bold rounded-lg border transition bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                });
                btn.className = 'net-pill-btn px-2.5 py-1 text-[11px] font-bold rounded-lg border transition bg-emerald-600 text-white border-emerald-700 shadow-sm';
                const chosenUrl = btn.getAttribute('data-url');
                setQrUrl(chosenUrl);
                showToast(`Switched to ${chosenUrl}`);
            });
        });

        if (availableUrls.length > 0) {
            setQrUrl(availableUrls[0].url);
        }
    }

    // Fetch dynamic network IPs
    fetch('/api/network-info')
        .then(res => res.json())
        .then(data => {
            if (data && data.ips && data.ips.length > 0) {
                availableUrls = data.ips.map((item, idx) => ({
                    name: `Network ${idx + 1}`,
                    ip: item.ip,
                    url: item.url
                }));
                renderNetworkOptions();
            }
        })
        .catch(() => {
            renderNetworkOptions();
        });

    // --- Modal Show & Hide Utilities (Bulletproof Mobile & Desktop Touch) ---
    let modalOpenTimestamp = 0;
    function showModal(modalEl) {
        if (!modalEl) return;
        modalOpenTimestamp = Date.now();
        modalEl.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modalEl) {
        if (!modalEl) return;
        if (Date.now() - modalOpenTimestamp < 350) return;
        modalEl.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (btnShowQr && modalQr) {
        btnShowQr.addEventListener('click', () => showModal(modalQr));
    }

    if (modalQrClose && modalQr) {
        modalQrClose.addEventListener('click', () => hideModal(modalQr));
    }

    if (modalQr) {
        modalQr.addEventListener('click', (e) => {
            if (e.target === modalQr) hideModal(modalQr);
        });
    }

    if (btnCopyMobileUrl && mobileUrlDisplay) {
        btnCopyMobileUrl.addEventListener('click', () => {
            const url = mobileUrlDisplay.textContent.trim();
            navigator.clipboard.writeText(url).then(() => {
                showToast('🔗 Mobile URL copied!');
            });
        });
    }

    // --- Browser-side Excel Dump Upload (Works on 24/7 Cloud without server) ---
    const inputUploadDump = document.getElementById('input-upload-dump');
    if (inputUploadDump && window.XLSX) {
        inputUploadDump.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Check if uploaded file is Packing Schedule ('Audit Plan' sheet)
                    const isSchedule = workbook.SheetNames.some(s => s.trim().toLowerCase() === 'audit plan') || file.name.toLowerCase().includes('schedule');
                    if (isSchedule) {
                        const targetSheet = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'audit plan') || workbook.SheetNames[0];
                        const ws = workbook.Sheets[targetSheet];
                        const schedRows = XLSX.utils.sheet_to_json(ws, { range: 15, defval: '' });

                        if (!window.AUDITOR_DATA) window.AUDITOR_DATA = {};
                        let loadedCount = 0;
                        schedRows.forEach(r => {
                            const jVal = String(r['JOBS#'] || r['Job'] || r['JOB #'] || '').trim().toUpperCase();
                            const aVal = String(r['Auditors '] || r['Auditors'] || r['Auditor'] || '').trim();
                            if (jVal && jVal.startsWith('J') && aVal && !aVal.match(/^\d+$/) && !['nan', 'none', '-', '0', 'audior'].includes(aVal.toLowerCase())) {
                                let cleanAud = aVal;
                                if (cleanAud.toLowerCase() === 'qmp') cleanAud = 'QMP';
                                else if (cleanAud.toLowerCase() === 'aadil') cleanAud = 'Aadil';
                                else if (cleanAud.toLowerCase().includes('aadil') && cleanAud.toLowerCase().includes('qmp')) cleanAud = 'Aadil + QMP';
                                window.AUDITOR_DATA[jVal] = cleanAud;
                                const cleanNoJ = jVal.replace(/^J/i, '');
                                if (cleanNoJ) window.AUDITOR_DATA[cleanNoJ] = cleanAud;
                                loadedCount++;
                            }
                        });
                        try {
                            localStorage.setItem('PACKING_AUDITOR_DATA', JSON.stringify(window.AUDITOR_DATA));
                        } catch (e) {}

                        if (currentJob) selectJob(currentJob);
                        if (reportMode === 'bulk') handleBulkCompile();
                        else updatePreview();

                        showToast(`🎉 Schedule Loaded: ${loadedCount.toLocaleString()} Auditors from ${file.name}!`);
                        return;
                    }

                    // Check if uploaded file is NQA Final Audit Reports
                    if (workbook.SheetNames.includes('Audit Details') || file.name.toLowerCase().includes('audit')) {
                        const targetSheet = workbook.SheetNames.includes('Audit Details') ? 'Audit Details' : workbook.SheetNames[0];
                        const ws = workbook.Sheets[targetSheet];
                        const auditRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

                        if (auditRows && auditRows.length > 0) {
                            if (!window.AUDIT_DATA) window.AUDIT_DATA = {};
                            let loadedCount = 0;
                            auditRows.forEach(r => {
                                const jVal = String(r['Job'] || r['JOB'] || r['JOB #'] || '').trim().toUpperCase();
                                const sVal = String(r['Status'] || r['STATUS'] || '').trim();
                                if (jVal && sVal && sVal.toLowerCase() !== 'nan') {
                                    window.AUDIT_DATA[jVal] = sVal;
                                    const clean = jVal.replace(/^J/i, '');
                                    if (clean) window.AUDIT_DATA[clean] = sVal;
                                    loadedCount++;
                                }
                            });
                            try {
                                localStorage.setItem('PACKING_AUDIT_DATA', JSON.stringify(window.AUDIT_DATA));
                            } catch (e) {}

                            if (currentJob) selectJob(currentJob);
                            if (reportMode === 'bulk') handleBulkCompile();
                            else updatePreview();

                            showToast(`🎉 NQA Audit Reports Loaded: ${loadedCount.toLocaleString()} records from ${file.name}!`);
                            return;
                        }
                    }

                    // Otherwise treat as Dump.xlsx
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (rows && rows.length > 0) {
                        const newJobs = [];
                        rows.forEach(r => {
                            const jobVal = r['JOB #'] || r['JOB'] || r['Job'] || r['job'];
                            if (!jobVal) return;
                            const jClean = String(jobVal).trim();
                            const dumpAudit = String(r['AUDIT CONFIRM'] || r['Audit'] || '').trim();
                            const st = getJobAuditStatus({ job: jClean, audit: dumpAudit });
                            newJobs.push({
                                job: jClean,
                                po: String(r['PONO'] || r['PO'] || r['po'] || '').trim(),
                                style: String(r['STYLE #'] || r['STYLE'] || r['style'] || '').trim(),
                                finish: String(r['FINISH'] || r['Finish Name'] || r['finish'] || '').trim(),
                                qty: Number(r['QTY'] || r['Qty'] || r['qty'] || 0),
                                customer: String(r['CUSTOMER'] || r['Customer'] || '').trim(),
                                status: String(r['STATUS'] || r['Status'] || '').trim(),
                                audit: dumpAudit,
                                audit_status: st
                            });
                        });

                        jobsDataset = newJobs;
                        try {
                            localStorage.setItem('PACKING_PLAN_CACHE', JSON.stringify(newJobs));
                        } catch (err) {}

                        if (dumpCountBadge) {
                            dumpCountBadge.textContent = `${jobsDataset.length.toLocaleString()} Jobs (Uploaded)`;
                        }
                        showToast(`🎉 Dump Updated: ${jobsDataset.length.toLocaleString()} jobs loaded from ${file.name}!`);
                    }
                } catch (err) {
                    showToast('❌ Excel read error: ' + err.message, false);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // =========================================================================
    // USER AUTHENTICATION, CENTRAL DATABASE & ADMIN DASHBOARD ENGINE
    // Admin: admin / shoaib65 | Multi-worker logging & SheetJS Excel Export
    // =========================================================================

    // Auto reset old dummy workers (Usman, Ali, etc.) from localStorage
    try {
        if (!localStorage.getItem('PACKING_WORKERS_RESET_V2')) {
            localStorage.removeItem('PACKING_WORKERS');
            localStorage.removeItem('PACKING_ACTIVE_USER');
            localStorage.setItem('PACKING_WORKERS_RESET_V2', 'true');
        }
    } catch (e) {}

    const DEFAULT_WORKERS = [];

    function getWorkers() {
        try {
            const stored = localStorage.getItem('PACKING_WORKERS');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [];
    }

    function saveWorkers(list) {
        localStorage.setItem('PACKING_WORKERS', JSON.stringify(list));
    }

    function getActiveUser() {
        try {
            const u = localStorage.getItem('PACKING_ACTIVE_USER');
            if (u) {
                const parsed = JSON.parse(u);
                if (parsed && parsed.name) return parsed;
            }
        } catch (e) {}
        return null;
    }

    function setActiveUser(userObj) {
        if (userObj) {
            localStorage.setItem('PACKING_ACTIVE_USER', JSON.stringify(userObj));
        } else {
            localStorage.removeItem('PACKING_ACTIVE_USER');
        }
        updateNavAuthBadge();
        updateWorkerSelectDropdown();
    }

    function isAdminLoggedIn() {
        return sessionStorage.getItem('PACKING_ADMIN_AUTH') === 'true' || localStorage.getItem('PACKING_ADMIN_AUTH') === 'true';
    }

    function setAdminLoggedIn(status) {
        if (status) {
            sessionStorage.setItem('PACKING_ADMIN_AUTH', 'true');
            localStorage.setItem('PACKING_ADMIN_AUTH', 'true');
        } else {
            sessionStorage.removeItem('PACKING_ADMIN_AUTH');
            localStorage.removeItem('PACKING_ADMIN_AUTH');
        }
        updateNavAuthBadge();
    }

    function getPackingLogs() {
        try {
            const stored = localStorage.getItem('PACKING_LOGS');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [];
    }

    function savePackingLogs(logs) {
        if (logs.length > 3000) logs.length = 3000;
        localStorage.setItem('PACKING_LOGS', JSON.stringify(logs));
    }

    // Auto-record submission into Central Log
    function logCurrentReportSubmission() {
        const user = getActiveUser();
        const workerName = user ? user.name : 'General Worker';
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        const logs = getPackingLogs();
        let loggedCount = 0;

        if (reportMode === 'bulk') {
            const rawInput = inputBulkJobs ? inputBulkJobs.value.trim() : '';
            if (rawInput) {
                const tokens = [...new Set(rawInput.split(/[\r\n,;\t ]+/).map(t => t.trim().toUpperCase()).filter(t => t.length > 0))];
                tokens.forEach(tok => {
                    const cleanTok = tok.replace(/^J/i, '');
                    const found = jobsDataset.find(item => {
                        const j = String(item.job || '').toUpperCase();
                        return j === tok || j.replace(/^J/i, '') === cleanTok;
                    });
                    const auditStatus = getJobAuditStatus(found || tok);
                    const userRem = (inputBulkRemarks && inputBulkRemarks.value.trim()) ? inputBulkRemarks.value.trim() : '';
                    const finalRemarks = userRem || 'Ready For Audit';

                    if (found) {
                        logs.unshift({
                            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                            timestamp: now.toISOString(),
                            date: dateStr,
                            time: timeStr,
                            worker: workerName,
                            job: found.job,
                            po: found.po || '',
                            style: found.style || '',
                            finish: found.finish || '',
                            qty: Number(found.qty || 0),
                            customer: found.customer || '',
                            audit_status: auditStatus,
                            remarks: finalRemarks
                        });
                        loggedCount++;
                    }
                });
            }
        } else if (reportMode === 'multi' && multiQueue.length > 0) {
            multiQueue.forEach(item => {
                const auditStatus = item.audit_status || getJobAuditStatus(item);
                const auditor = item.auditor || getJobAuditor(item);
                logs.unshift({
                    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    timestamp: now.toISOString(),
                    date: dateStr,
                    time: timeStr,
                    worker: workerName,
                    job: item.job,
                    po: item.po || '',
                    style: item.style || '',
                    finish: item.finish || '',
                    qty: Number(item.qty || 0),
                    customer: item.customer || '',
                    auditor: auditor,
                    audit_status: auditStatus,
                    remarks: item.remarks || auditStatus
                });
                loggedCount++;
            });
        } else if (currentJob) {
            const auditStatus = getJobAuditStatus(currentJob);
            const auditor = getJobAuditor(currentJob);
            const userRem = inputRemarks.value.trim();
            const finalRemarks = userRem || 'Ready For Audit';

            logs.unshift({
                id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                timestamp: now.toISOString(),
                date: dateStr,
                time: timeStr,
                worker: workerName,
                job: currentJob.job,
                po: currentJob.po || '',
                style: currentJob.style || '',
                finish: currentJob.finish || '',
                qty: Number(currentJob.qty || 0),
                customer: currentJob.customer || '',
                auditor: auditor,
                audit_status: auditStatus,
                remarks: finalRemarks
            });
            loggedCount++;
        }

        if (loggedCount > 0) {
            savePackingLogs(logs);
            showToast(`✅ Saved ${loggedCount} job(s) under "${workerName}" in Central DB!`);
        }
    }

    // --- Auth & Admin Portal Logic ---

    let currentLogDateFilter = 'today'; // 'today', 'yesterday', 'week', 'all'

    // Update Nav Button State (Admin vs Worker badges)
    function updateNavAuthBadge() {
        if (labelNavAdmin) {
            if (isAdminLoggedIn()) {
                labelNavAdmin.textContent = 'Admin (Shoaib)';
                if (btnNavAdmin) {
                    btnNavAdmin.className = 'tap-active text-xs bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition cursor-pointer select-none shrink-0 ring-2 ring-amber-300';
                }
            } else {
                labelNavAdmin.textContent = 'Admin';
                if (btnNavAdmin) {
                    btnNavAdmin.className = 'tap-active text-xs bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition cursor-pointer select-none shrink-0';
                }
            }
        }

        if (labelNavWorker) {
            const user = getActiveUser();
            labelNavWorker.textContent = user ? user.name : 'Worker';
        }

        if (window.lucide) lucide.createIcons();
    }

    // Populate Worker Dropdown
    function updateWorkerSelectDropdown() {
        if (!selectWorkerList) return;
        const workers = getWorkers();
        const active = getActiveUser();

        if (workers.length === 0) {
            selectWorkerList.innerHTML = `<option value="">-- Koi Worker Mojood Nahi Hai --</option>`;
            if (btnSetActiveWorker) btnSetActiveWorker.disabled = true;
            if (btnDeleteWorker) btnDeleteWorker.disabled = true;
        } else {
            selectWorkerList.innerHTML = workers.map(w => `
                <option value="${w.name}" ${active && active.name === w.name ? 'selected' : ''}>
                    ${w.name} ${w.dept ? '(' + w.dept + ')' : ''}
                </option>
            `).join('');
            if (btnSetActiveWorker) btnSetActiveWorker.disabled = false;
            if (btnDeleteWorker) btnDeleteWorker.disabled = false;
        }

        if (authActiveUserDisplay) {
            authActiveUserDisplay.textContent = active ? `${active.name} ${active.dept ? '(' + active.dept + ')' : ''}` : 'Koi Worker Active Nahi Hai';
        }

        // Also update filterLogWorker dropdown in admin dashboard
        if (filterLogWorker) {
            const currentVal = filterLogWorker.value;
            filterLogWorker.innerHTML = `<option value="all">All Workers (Sb Workers)</option>` +
                workers.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
            if (currentVal) filterLogWorker.value = currentVal;
        }
    }

    // Worker Selection Click
    if (btnSetActiveWorker && selectWorkerList) {
        btnSetActiveWorker.addEventListener('click', () => {
            const chosenName = selectWorkerList.value;
            if (!chosenName) return;
            const workers = getWorkers();
            const found = workers.find(w => w.name === chosenName) || { name: chosenName, dept: 'Packaging Line 1' };
            setActiveUser(found);
            updateNavAuthBadge();
            hideModal(modalWorkerSelect);
            showToast(`👤 Active Worker: ${found.name}`);
        });
    }

    // Delete Selected Worker
    if (btnDeleteWorker && selectWorkerList) {
        btnDeleteWorker.addEventListener('click', () => {
            const chosenName = selectWorkerList.value;
            if (!chosenName) return;
            if (!confirm(`Kya aap "${chosenName}" worker ko delete karna chahte hain?`)) return;
            let workers = getWorkers().filter(w => w.name !== chosenName);
            saveWorkers(workers);
            const active = getActiveUser();
            if (active && active.name === chosenName) {
                setActiveUser(workers.length > 0 ? workers[0] : null);
            }
            updateWorkerSelectDropdown();
            updateNavAuthBadge();
            showToast(`🗑️ Worker "${chosenName}" delete ho gaya!`);
        });
    }

    // Delete All Workers
    if (btnDeleteAllWorkers) {
        btnDeleteAllWorkers.addEventListener('click', () => {
            if (!confirm('Kya aap waqai tamam workers ko delete karna chahte hain?')) return;
            saveWorkers([]);
            setActiveUser(null);
            updateWorkerSelectDropdown();
            updateNavAuthBadge();
            showToast('🗑️ Tamam workers delete ho gaye!');
        });
    }

    // Create New Worker Click
    if (btnCreateWorker) {
        btnCreateWorker.addEventListener('click', () => {
            const name = inputNewWorkerName ? inputNewWorkerName.value.trim() : '';
            const dept = inputNewWorkerDept ? inputNewWorkerDept.value.trim() : 'Packaging Line 1';

            if (!name) {
                showToast('⚠️ Worker ka naam likhein!', false);
                return;
            }

            const workers = getWorkers();
            const exists = workers.some(w => w.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                showToast(`⚠️ Worker "${name}" pehle se mojood hai!`, false);
                return;
            }

            const newWorker = {
                id: 'w_' + Date.now(),
                name: name,
                dept: dept || 'Packaging Line 1'
            };

            workers.push(newWorker);
            saveWorkers(workers);
            setActiveUser(newWorker);

            if (inputNewWorkerName) inputNewWorkerName.value = '';
            if (inputNewWorkerDept) inputNewWorkerDept.value = '';
            
            updateWorkerSelectDropdown();
            updateNavAuthBadge();
            hideModal(modalWorkerSelect);

            showToast(`🎉 Naya worker "${name}" add aur active ho gaya!`);
        });
    }

    // Admin Login (admin / shoaib65)
    if (btnLoginAdmin) {
        btnLoginAdmin.addEventListener('click', () => {
            const user = inputAdminUsername ? inputAdminUsername.value.trim().toLowerCase() : '';
            const pass = inputAdminPassword ? inputAdminPassword.value.trim() : '';

            if (user === 'admin' && pass === 'shoaib65') {
                setAdminLoggedIn(true);
                hideModal(modalAdminLogin);
                updateNavAuthBadge();
                openAdminDashboard();
                showToast('👑 Welcome Admin Shoaib!');
            } else {
                showToast('❌ Ghalat Credentials! User: admin | Pass: shoaib65', false);
            }
        });
    }

    // Open Admin Dashboard & Render Data
    function openAdminDashboard() {
        if (!modalAdminDashboard) return;
        renderAdminDashboard();
        showModal(modalAdminDashboard);
    }

    // Admin Dashboard Render Logic
    function renderAdminDashboard() {
        const logs = getPackingLogs();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Filter by Date
        let filtered = logs.filter(log => {
            if (currentLogDateFilter === 'today') return log.date === todayStr;
            if (currentLogDateFilter === 'yesterday') return log.date === yesterdayStr;
            if (currentLogDateFilter === 'week') return new Date(log.date) >= weekAgo;
            return true; // 'all'
        });

        // Filter by Worker
        const chosenWorker = filterLogWorker ? filterLogWorker.value : 'all';
        if (chosenWorker && chosenWorker !== 'all') {
            filtered = filtered.filter(log => log.worker === chosenWorker);
        }

        // Filter by Search Input
        const searchQuery = inputSearchLogs ? inputSearchLogs.value.trim().toLowerCase() : '';
        if (searchQuery) {
            filtered = filtered.filter(log => {
                return String(log.job || '').toLowerCase().includes(searchQuery) ||
                       String(log.po || '').toLowerCase().includes(searchQuery) ||
                       String(log.style || '').toLowerCase().includes(searchQuery) ||
                       String(log.remarks || '').toLowerCase().includes(searchQuery) ||
                       String(log.worker || '').toLowerCase().includes(searchQuery);
            });
        }

        // Calculate KPIs
        const todayLogs = logs.filter(l => l.date === todayStr);
        let todayJobsCount = todayLogs.length;
        let todayQtySum = todayLogs.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
        let activeWorkersToday = new Set(todayLogs.map(l => l.worker)).size;

        if (kpiTodayJobs) kpiTodayJobs.textContent = todayJobsCount.toLocaleString();
        if (kpiTodayQty) kpiTodayQty.textContent = todayQtySum.toLocaleString() + ' pcs';
        if (kpiActiveWorkers) kpiActiveWorkers.textContent = activeWorkersToday.toString();
        if (kpiTotalLogs) kpiTotalLogs.textContent = logs.length.toLocaleString();
        if (logRecordsCount) logRecordsCount.textContent = filtered.length.toLocaleString();

        // Populate Table
        if (adminLogsTbody) {
            if (filtered.length === 0) {
                adminLogsTbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="p-6 text-center text-slate-400 text-xs">
                            Koi record nahi mila. Worker report generate karega to yahan automatic show hoga.
                        </td>
                    </tr>
                `;
            } else {
                adminLogsTbody.innerHTML = filtered.map(item => `
                    <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0">
                        <td class="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            <span class="block font-bold text-slate-700">${item.date}</span>
                            <span class="text-[10px] text-slate-400">${item.time}</span>
                        </td>
                        <td class="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px]">
                                ${item.worker || 'Worker'}
                            </span>
                        </td>
                        <td class="p-2.5 font-mono font-black text-emerald-800 text-xs whitespace-nowrap">
                            Job #${item.job}
                        </td>
                        <td class="p-2.5 text-slate-600 text-[11px]">
                            <div><strong>PO:</strong> ${item.po || '-'}</div>
                            <div class="text-[10px] text-slate-400"><strong>Style:</strong> ${item.style || '-'}</div>
                        </td>
                        <td class="p-2.5 font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                            ${Number(item.qty || 0).toLocaleString()} pcs
                        </td>
                        <td class="p-2.5 text-slate-700 text-[11px]">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${getAuditBadgeStyle(item.audit_status || item.remarks).badgeClass}">
                                ${item.audit_status || 'Not Audited'}
                            </span>
                            ${item.remarks && item.remarks !== item.audit_status ? `<span class="block text-[10px] text-slate-500 mt-0.5">${item.remarks}</span>` : ''}
                        </td>
                    </tr>
                `).join('');
            }
        }
    }

    // Date Filter Pills Click
    btnLogDateFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            btnLogDateFilters.forEach(p => {
                p.className = 'btn-log-date-filter px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 tap-active';
            });
            pill.className = 'btn-log-date-filter px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-xs tap-active';
            currentLogDateFilter = pill.getAttribute('data-log-date');
            renderAdminDashboard();
        });
    });

    if (filterLogWorker) {
        filterLogWorker.addEventListener('change', renderAdminDashboard);
    }
    if (inputSearchLogs) {
        inputSearchLogs.addEventListener('input', renderAdminDashboard);
    }

    // Export to Excel (.xlsx) using SheetJS
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            const logs = getPackingLogs();
            if (logs.length === 0) {
                showToast('⚠️ Koi records mojood nahi hain!', false);
                return;
            }

            if (typeof XLSX === 'undefined') {
                showToast('❌ SheetJS library load nahi hui.', false);
                return;
            }

            const excelRows = logs.map((row, idx) => ({
                "Sr #": idx + 1,
                "Date": row.date,
                "Time": row.time,
                "Worker / Operator": row.worker,
                "Job #": row.job,
                "PO #": row.po,
                "Style #": row.style,
                "Finish Name": row.finish,
                "Order QTY": row.qty,
                "Buyer": row.customer,
                "Auditor": row.auditor || getJobAuditor(row.job),
                "Audit Status": row.audit_status || getJobAuditStatus(row.job),
                "Remarks": row.remarks
            }));

            const ws = XLSX.utils.json_to_sheet(excelRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Daily_Packing_Log");
            const todayStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Packing_Report_Log_${todayStr}.xlsx`);
            showToast('📥 Excel file downloaded successfully!');
        });
    }

    // Clear Logs
    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            if (confirm('Kya aap waqai tamam packing logs clear karna chahte hain?')) {
                localStorage.removeItem('PACKING_LOGS');
                renderAdminDashboard();
                showToast('🗑️ Logs cleared!');
            }
        });
    }

    // Admin Logout
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', () => {
            setAdminLoggedIn(false);
            hideModal(modalAdminDashboard);
            showToast('Admin Logged out');
        });
    }

    // Header Action: Admin Button
    if (btnNavAdmin) {
        btnNavAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdminLoggedIn()) {
                openAdminDashboard();
            } else {
                showModal(modalAdminLogin);
            }
        });
    }

    // Header Action: Worker Button
    if (btnNavWorker) {
        btnNavWorker.addEventListener('click', (e) => {
            e.preventDefault();
            updateWorkerSelectDropdown();
            showModal(modalWorkerSelect);
        });
    }

    // Modal Close Buttons
    if (modalAdminLoginClose && modalAdminLogin) {
        modalAdminLoginClose.addEventListener('click', () => hideModal(modalAdminLogin));
    }
    if (modalWorkerClose && modalWorkerSelect) {
        modalWorkerClose.addEventListener('click', () => hideModal(modalWorkerSelect));
    }
    if (modalAdminClose && modalAdminDashboard) {
        modalAdminClose.addEventListener('click', () => hideModal(modalAdminDashboard));
    }

    // Outside Backdrop Click Dismissal
    [modalAdminLogin, modalWorkerSelect, modalAdminDashboard, modalQr].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal);
            }
        });
    });

    // Initialize Auth & Dropdown States
    updateWorkerSelectDropdown();
    updateNavAuthBadge();

    // Initial message preview setup
    updatePreview();
});
