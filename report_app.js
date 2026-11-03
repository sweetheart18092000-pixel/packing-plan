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

    // Remarks & Controls
    const inputRemarks = document.getElementById('input-remarks');
    const quickRemarkBtns = document.querySelectorAll('.quick-remark-btn');
    const btnResetForm = document.getElementById('btn-reset-form');
    const btnAddToMulti = document.getElementById('btn-add-to-multi');

    // Preview & Mode Switchers
    const btnFormatSingle = document.getElementById('btn-format-single');
    const btnFormatMulti = document.getElementById('btn-format-multi');
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

        // 1. Try local server API
        try {
            const res = await fetch('/api/sync-dump');
            if (res.ok) {
                const result = await res.json();
                if (result && result.jobs && Array.isArray(result.jobs) && result.jobs.length > 0) {
                    jobsDataset = result.jobs;
                    synced = true;
                }
            }
        } catch (e) {}

        // 2. If API not available (e.g. on GitHub Pages Cloud), fetch fresh jobs_data.js with cache busting
        if (!synced) {
            try {
                const bustUrl = './jobs_data.js?_t=' + Date.now();
                const res = await fetch(bustUrl, { cache: 'no-store' });
                if (res.ok) {
                    const jsText = await res.text();
                    const jsonMatch = jsText.match(/window\.DUMP_JOBS\s*=\s*(\[.*?\])\s*;/s);
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

        if (synced) {
            window.DUMP_JOBS = jobsDataset;
            window.JOBS_DATA = jobsDataset;
            try {
                localStorage.setItem('PACKING_PLAN_CACHE', JSON.stringify(jobsDataset));
            } catch (e) {}
            if (dumpCountBadge) {
                dumpCountBadge.textContent = `${jobsDataset.length.toLocaleString()} Jobs`;
            }
            if (showNotice) {
                showToast(`✅ Dump Synced (${jobsDataset.length.toLocaleString()} Jobs)!`);
            }
        } else {
            if (showNotice) {
                showToast(`ℹ️ Running with ${jobsDataset.length.toLocaleString()} jobs.`);
            }
        }

        if (iconSync) {
            setTimeout(() => iconSync.classList.remove('animate-spin'), 600);
        }
    }

    // Auto-sync on page load
    syncSystemDump(false);

    // Bind Sync button clicks
    if (btnSyncDump) {
        btnSyncDump.addEventListener('click', () => syncSystemDump(true));
    }
    if (btnBadgeSync) {
        btnBadgeSync.addEventListener('click', () => syncSystemDump(true));
    }

    // --- Format Report Text ---
    let bulkGeneratedText = '';

    function generateReportText() {
        if (reportMode === 'bulk' && bulkGeneratedText) {
            return bulkGeneratedText;
        }

        if (reportMode === 'multi') {
            if (multiQueue.length === 0) {
                return `*📦 CLOSED PACKING LISTS UPDATE*\n` +
                       `-------------------------------------\n` +
                       `⚠️ _Koi jobs queue me add nahi kiye gaye._\n` +
                       `_Job search karein aur 'Add to Multi-Job Queue' dabayein._\n` +
                       `-------------------------------------`;
            }

            let text = `*📦 CLOSED PACKING LISTS UPDATE (${multiQueue.length} JOBS)*\n`;
            text += `-------------------------------------\n`;
            let totalQty = 0;
            multiQueue.forEach((item, idx) => {
                const q = item.qty ? Number(item.qty) : 0;
                totalQty += q;
                text += `*#${idx + 1}. Job:* ${item.job}\n`;
                text += `   *PO:* ${item.po || '---'}\n`;
                text += `   *Style:* ${item.style || '---'}\n`;
                text += `   *Finish Name:* ${item.finish || '---'}\n`;
                text += `   *QTY:* ${q ? q.toLocaleString() : '---'}\n`;
                if (item.customer) text += `   *Buyer:* ${item.customer}\n`;
                text += `   *Remarks:* ${item.remarks || '---'}\n`;
                text += `-------------------------------------\n`;
            });
            text += `*Total Jobs:* ${multiQueue.length} | *Total QTY:* ${totalQty.toLocaleString()} pcs`;
            return text;
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
                   `*REMARKS:* Hum khud dalenge\n` +
                   `-------------------------------------\n` +
                   `_Job number search karein ya type karein._`;
        }

        const remarksText = inputRemarks.value.trim() || 'Hum khud dalenge';
        const formattedQty = currentJob.qty ? Number(currentJob.qty).toLocaleString() : '---';

        return `*📦 CLOSED PACKING LISTS UPDATE*\n` +
               `-------------------------------------\n` +
               `*Job:* ${currentJob.job}\n` +
               `*Po:* ${currentJob.po || '---'}\n` +
               `*Style:* ${currentJob.style || '---'}\n` +
               `*Finish Name:* ${currentJob.finish || '---'}\n` +
               `*QTY:* ${formattedQty}\n` +
               `*REMARKS:* ${remarksText}\n` +
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

        if (activeJobIndicator) {
            activeJobIndicator.textContent = `Job #${jobItem.job}`;
            activeJobIndicator.className = 'text-[10px] font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-xs';
        }

        inputJobSearch.value = jobItem.job;
        suggestionsBox.classList.add('hidden');

        updatePreview();
        showToast(`✅ Job #${jobItem.job} Loaded!`);

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

    // --- Mode Switcher (Single vs Bulk Tab) ---
    const tabBtnSingle = document.getElementById('tab-btn-single');
    const tabBtnBulk = document.getElementById('tab-btn-bulk');
    const sectionSingleMode = document.getElementById('section-single-mode');
    const sectionBulkMode = document.getElementById('section-bulk-mode');

    // Bulk Elements
    const inputBulkJobs = document.getElementById('input-bulk-jobs');
    const inputBulkRemarks = document.getElementById('input-bulk-remarks');
    const btnGenerateBulk = document.getElementById('btn-generate-bulk');
    const btnClearBulkText = document.getElementById('btn-clear-bulk-text');
    const bulkStatusBox = document.getElementById('bulk-status-box');
    const bulkRemarkChips = document.querySelectorAll('.bulk-remark-chip');

    if (tabBtnSingle && tabBtnBulk && sectionSingleMode && sectionBulkMode) {
        tabBtnSingle.addEventListener('click', () => {
            tabBtnSingle.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 bg-white text-emerald-950 shadow-sm tap-active';
            tabBtnBulk.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-extrabold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 tap-active';
            sectionSingleMode.classList.remove('hidden');
            sectionBulkMode.classList.add('hidden');
            reportMode = 'single';
            updatePreview();
        });

        tabBtnBulk.addEventListener('click', () => {
            tabBtnBulk.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 bg-white text-emerald-950 shadow-sm tap-active';
            tabBtnSingle.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-extrabold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 tap-active';
            sectionBulkMode.classList.remove('hidden');
            sectionSingleMode.classList.add('hidden');
            if (bulkGeneratedText) {
                reportMode = 'bulk';
                updatePreview();
            }
        });
    }

    // Bulk Quick Chips
    bulkRemarkChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const current = inputBulkRemarks.value.trim();
            const val = chip.textContent.trim();
            inputBulkRemarks.value = current ? `${current}, ${val}` : val;
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
            if (reportMode === 'bulk') {
                reportMode = 'single';
                updatePreview();
            }
            showToast('Bulk inputs cleared!');
        });
    }

    // Generate Combined Message from Bulk Input
    if (btnGenerateBulk) {
        btnGenerateBulk.addEventListener('click', () => {
            const rawInput = inputBulkJobs ? inputBulkJobs.value.trim() : '';
            if (!rawInput) {
                showToast('⚠️ Pehle jobs numbers list enter karein!', false);
                if (inputBulkJobs) inputBulkJobs.focus();
                return;
            }

            // Split by newlines, commas, semicolons, tabs, spaces
            const tokens = rawInput
                .split(/[\r\n,;\t ]+/)
                .map(t => t.trim().toUpperCase())
                .filter(t => t.length > 0);

            if (tokens.length === 0) {
                showToast('⚠️ Koi valid job number nahi mila!', false);
                return;
            }

            // Remove duplicate tokens while preserving order
            const uniqueTokens = [...new Set(tokens)];

            const matchedJobs = [];
            const notFoundTokens = [];

            uniqueTokens.forEach(tok => {
                const cleanTok = tok.replace(/^J/i, '');
                const found = jobsDataset.find(item => {
                    const j = String(item.job || '').toUpperCase();
                    const cleanJ = j.replace(/^J/i, '');
                    return j === tok || cleanJ === cleanTok;
                });

                if (found) {
                    matchedJobs.push(found);
                } else {
                    notFoundTokens.push(tok);
                }
            });

            if (matchedJobs.length === 0) {
                showToast(`❌ Enter kiye gaye ${tokens.length} jobs me se koi bhi Dump me nahi mila!`, false);
                if (bulkStatusBox) {
                    bulkStatusBox.className = 'p-2.5 rounded-xl text-xs space-y-1 bg-rose-50 border border-rose-200 text-rose-800';
                    bulkStatusBox.innerHTML = `<strong>❌ No Jobs Found:</strong> Check karein ke job numbers theek hain.`;
                    bulkStatusBox.classList.remove('hidden');
                }
                return;
            }

            // Build Combined Message
            const commonRemarks = (inputBulkRemarks && inputBulkRemarks.value.trim()) ? inputBulkRemarks.value.trim() : 'Packed & Closed';
            let combinedMsg = `*📦 CLOSED PACKING LISTS UPDATE (${matchedJobs.length} JOBS)*\n`;
            combinedMsg += `-------------------------------------\n`;
            let totalQty = 0;

            matchedJobs.forEach((jobItem, idx) => {
                const q = jobItem.qty ? Number(jobItem.qty) : 0;
                totalQty += q;
                combinedMsg += `*#${idx + 1}. Job:* ${jobItem.job}\n`;
                combinedMsg += `   *PO:* ${jobItem.po || '---'}\n`;
                combinedMsg += `   *Style:* ${jobItem.style || '---'}\n`;
                combinedMsg += `   *Finish Name:* ${jobItem.finish || '---'}\n`;
                combinedMsg += `   *QTY:* ${q ? q.toLocaleString() : '0'}\n`;
                if (jobItem.customer) combinedMsg += `   *Buyer:* ${jobItem.customer}\n`;
                combinedMsg += `   *Remarks:* ${commonRemarks}\n`;
                combinedMsg += `-------------------------------------\n`;
            });

            combinedMsg += `*Total Jobs:* ${matchedJobs.length} | *Total QTY:* ${totalQty.toLocaleString()} pcs`;

            bulkGeneratedText = combinedMsg;
            reportMode = 'bulk';
            updatePreview();

            // Status feedback
            if (bulkStatusBox) {
                bulkStatusBox.className = 'p-2.5 rounded-xl text-xs space-y-1 bg-emerald-50 border border-emerald-200 text-emerald-900';
                let statusHtml = `
                    <div class="flex items-center justify-between font-bold">
                        <span>✅ ${matchedJobs.length} Jobs Matched!</span>
                        <span>Total QTY: ${totalQty.toLocaleString()} pcs</span>
                    </div>
                `;
                if (notFoundTokens.length > 0) {
                    statusHtml += `<div class="text-[10px] text-amber-700 font-semibold pt-1 border-t border-emerald-200/60">
                        ⚠️ Not Found in Dump (${notFoundTokens.length}): ${notFoundTokens.join(', ')}
                    </div>`;
                }
                bulkStatusBox.innerHTML = statusHtml;
                bulkStatusBox.classList.remove('hidden');
            }

            showToast(`✅ ${matchedJobs.length} Jobs ka Single WhatsApp Message ban gaya!`);
            if (navigator.vibrate) navigator.vibrate([20, 40]);

            // Scroll to preview if on mobile
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
            inputRemarks.value = '';
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

            const itemToQueue = {
                job: currentJob.job,
                po: currentJob.po,
                style: currentJob.style,
                finish: currentJob.finish,
                qty: currentJob.qty,
                customer: currentJob.customer,
                remarks: inputRemarks.value.trim() || 'Packing in progress'
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
            queueItemsList.innerHTML = multiQueue.map((item, idx) => `
                <div class="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div class="truncate pr-2">
                        <span class="font-bold text-slate-900 font-mono">#${idx + 1} Job ${item.job}</span> &bull; 
                        <span class="text-slate-600">PO: ${item.po || '-'}</span> &bull; 
                        <span class="font-semibold text-emerald-700">${item.qty ? Number(item.qty).toLocaleString() : '0'} pcs</span>
                    </div>
                    <button class="btn-remove-queue-item text-rose-500 hover:text-rose-700 p-1 font-bold tap-active" data-index="${idx}">
                        ✕
                    </button>
                </div>
            `).join('');

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

    // Mode Switcher Buttons
    if (btnFormatSingle) {
        btnFormatSingle.addEventListener('click', () => {
            reportMode = 'single';
            btnFormatSingle.classList.add('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
            btnFormatSingle.classList.remove('text-slate-600');
            btnFormatMulti.classList.remove('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
            btnFormatMulti.classList.add('text-slate-600');
            updatePreview();
        });
    }

    if (btnFormatMulti) {
        btnFormatMulti.addEventListener('click', () => {
            reportMode = 'multi';
            btnFormatMulti.classList.add('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
            btnFormatMulti.classList.remove('text-slate-600');
            btnFormatSingle.classList.remove('font-bold', 'text-emerald-800', 'bg-white', 'shadow-xs');
            btnFormatSingle.classList.add('text-slate-600');
            updatePreview();
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

    if (btnShowQr && modalQr) {
        btnShowQr.addEventListener('click', () => {
            modalQr.classList.remove('hidden');
        });
    }

    if (modalQrClose && modalQr) {
        modalQrClose.addEventListener('click', () => {
            modalQr.classList.add('hidden');
        });
    }

    if (modalQr) {
        modalQr.addEventListener('click', (e) => {
            if (e.target === modalQr) {
                modalQr.classList.add('hidden');
            }
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
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (rows && rows.length > 0) {
                        const newJobs = [];
                        rows.forEach(r => {
                            const jobVal = r['JOB #'] || r['JOB'] || r['Job'] || r['job'];
                            if (!jobVal) return;
                            newJobs.push({
                                job: String(jobVal).trim(),
                                po: String(r['PONO'] || r['PO'] || r['po'] || '').trim(),
                                style: String(r['STYLE #'] || r['STYLE'] || r['style'] || '').trim(),
                                finish: String(r['FINISH'] || r['Finish Name'] || r['finish'] || '').trim(),
                                qty: Number(r['QTY'] || r['Qty'] || r['qty'] || 0),
                                customer: String(r['CUSTOMER'] || r['Customer'] || '').trim(),
                                status: String(r['STATUS'] || r['Status'] || '').trim(),
                                audit: String(r['AUDIT CONFIRM'] || r['Audit'] || '').trim()
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

    // Initial message preview setup
    updatePreview();
});
