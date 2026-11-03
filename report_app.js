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
    function showModal(modalEl) {
        if (!modalEl) return;
        modalEl.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modalEl) {
        if (!modalEl) return;
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

    // =========================================================================
    // USER AUTHENTICATION, CENTRAL DATABASE & ADMIN DASHBOARD ENGINE
    // Admin: admin / shoaib65 | Multi-worker logging & SheetJS Excel Export
    // =========================================================================

    const DEFAULT_WORKERS = [
        { id: 'w1', name: 'Usman', dept: 'Packaging Line 1' },
        { id: 'w2', name: 'Ali', dept: 'Packaging Line 2' },
        { id: 'w3', name: 'Tariq', dept: 'QC & Audit' },
        { id: 'w4', name: 'Farhan', dept: 'Finishing Section' },
        { id: 'w5', name: 'Shoaib', dept: 'Admin / Manager' }
    ];

    function getWorkers() {
        try {
            const stored = localStorage.getItem('PACKING_WORKERS');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        localStorage.setItem('PACKING_WORKERS', JSON.stringify(DEFAULT_WORKERS));
        return DEFAULT_WORKERS;
    }

    function saveWorkers(list) {
        localStorage.setItem('PACKING_WORKERS', JSON.stringify(list));
    }

    function getActiveUser() {
        try {
            const u = localStorage.getItem('PACKING_ACTIVE_USER');
            if (u) return JSON.parse(u);
        } catch (e) {}
        const def = { name: 'Usman', dept: 'Packaging Line 1' };
        localStorage.setItem('PACKING_ACTIVE_USER', JSON.stringify(def));
        return def;
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
        const workerName = user ? user.name : 'Usman';
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        const logs = getPackingLogs();
        let loggedCount = 0;

        if (reportMode === 'bulk') {
            // Find matched jobs from bulk
            const rawInput = inputBulkJobs ? inputBulkJobs.value.trim() : '';
            const commonRemarks = (inputBulkRemarks && inputBulkRemarks.value.trim()) ? inputBulkRemarks.value.trim() : 'Packed & Closed';
            if (rawInput) {
                const tokens = [...new Set(rawInput.split(/[\r\n,;\t ]+/).map(t => t.trim().toUpperCase()).filter(t => t.length > 0))];
                tokens.forEach(tok => {
                    const cleanTok = tok.replace(/^J/i, '');
                    const found = jobsDataset.find(item => {
                        const j = String(item.job || '').toUpperCase();
                        return j === tok || j.replace(/^J/i, '') === cleanTok;
                    });
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
                            remarks: commonRemarks
                        });
                        loggedCount++;
                    }
                });
            }
        } else if (reportMode === 'multi' && multiQueue.length > 0) {
            multiQueue.forEach(item => {
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
                    remarks: item.remarks || 'Ready'
                });
                loggedCount++;
            });
        } else if (currentJob) {
            const remarks = inputRemarks.value.trim() || 'Packed';
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
                remarks: remarks
            });
            loggedCount++;
        }

        if (loggedCount > 0) {
            savePackingLogs(logs);
            showToast(`✅ Saved ${loggedCount} job(s) under "${workerName}" in Central DB!`);
        }
    }

    // --- DOM Elements for Auth & Admin ---
    const btnUserAuth = document.getElementById('btn-user-auth');
    const labelUserNav = document.getElementById('label-user-nav');
    const iconUserNav = document.getElementById('icon-user-nav');
    const modalUserAuth = document.getElementById('modal-user-auth');
    const modalAuthClose = document.getElementById('modal-auth-close');
    const authTabWorker = document.getElementById('auth-tab-worker');
    const authTabAdmin = document.getElementById('auth-tab-admin');
    const authSectionWorker = document.getElementById('auth-section-worker');
    const authSectionAdmin = document.getElementById('auth-section-admin');
    const authActiveUserDisplay = document.getElementById('auth-active-user-display');
    const btnLogoutUser = document.getElementById('btn-logout-user');
    const selectWorkerList = document.getElementById('select-worker-list');
    const btnSetActiveWorker = document.getElementById('btn-set-active-worker');
    const inputNewWorkerName = document.getElementById('input-new-worker-name');
    const inputNewWorkerDept = document.getElementById('input-new-worker-dept');
    const btnCreateWorker = document.getElementById('btn-create-worker');

    // Admin Elements
    const inputAdminUsername = document.getElementById('input-admin-username');
    const inputAdminPassword = document.getElementById('input-admin-password');
    const btnLoginAdmin = document.getElementById('btn-login-admin');
    const modalAdminDashboard = document.getElementById('modal-admin-dashboard');
    const modalAdminClose = document.getElementById('modal-admin-close');
    const btnAdminLogout = document.getElementById('btn-admin-logout');

    // Admin Dashboard KPI & Controls
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

    let currentLogDateFilter = 'today'; // 'today', 'yesterday', 'week', 'all'

    // Update Nav Button State
    function updateNavAuthBadge() {
        if (!labelUserNav) return;
        if (isAdminLoggedIn()) {
            labelUserNav.textContent = 'Admin (Shoaib)';
            if (btnUserAuth) {
                btnUserAuth.className = 'tap-active text-xs bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition';
            }
        } else {
            const user = getActiveUser();
            if (user && user.name) {
                labelUserNav.textContent = user.name;
                if (btnUserAuth) {
                    btnUserAuth.className = 'tap-active text-xs bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition';
                }
            } else {
                labelUserNav.textContent = 'Login / User';
                if (btnUserAuth) {
                    btnUserAuth.className = 'tap-active text-xs bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition';
                }
            }
        }
        if (window.lucide) lucide.createIcons();
    }

    // Populate Worker Dropdown
    function updateWorkerSelectDropdown() {
        if (!selectWorkerList) return;
        const workers = getWorkers();
        const active = getActiveUser();

        selectWorkerList.innerHTML = workers.map(w => `
            <option value="${w.name}" ${active && active.name === w.name ? 'selected' : ''}>
                ${w.name} (${w.dept || 'Packaging'})
            </option>
        `).join('');

        if (authActiveUserDisplay) {
            authActiveUserDisplay.textContent = active ? `${active.name} (${active.dept || 'Packaging'})` : 'None Selected';
        }

        if (btnLogoutUser) {
            if (active) btnLogoutUser.classList.remove('hidden');
            else btnLogoutUser.classList.add('hidden');
        }

        // Also update filterLogWorker dropdown in admin dashboard
        if (filterLogWorker) {
            const currentVal = filterLogWorker.value;
            filterLogWorker.innerHTML = `<option value="all">All Workers (Sb Workers)</option>` +
                workers.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
            if (currentVal) filterLogWorker.value = currentVal;
        }
    }

    // Toggle Auth Tabs
    if (authTabWorker && authTabAdmin) {
        authTabWorker.addEventListener('click', () => {
            authTabWorker.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 bg-white text-emerald-950 shadow-xs tap-active';
            authTabAdmin.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 tap-active';
            authSectionWorker.classList.remove('hidden');
            authSectionAdmin.classList.add('hidden');
        });

        authTabAdmin.addEventListener('click', () => {
            authTabAdmin.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 bg-white text-emerald-950 shadow-xs tap-active';
            authTabWorker.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 tap-active';
            authSectionAdmin.classList.remove('hidden');
            authSectionWorker.classList.add('hidden');
        });
    }

    // Worker Selection
    if (btnSetActiveWorker && selectWorkerList) {
        btnSetActiveWorker.addEventListener('click', () => {
            const chosenName = selectWorkerList.value;
            const workers = getWorkers();
            const found = workers.find(w => w.name === chosenName) || { name: chosenName, dept: 'Packaging' };
            setActiveUser(found);
            hideModal(modalUserAuth);
            showToast(`👤 Active Worker set to: ${found.name}`);
        });
    }

    // Create New Worker
    if (btnCreateWorker) {
        btnCreateWorker.addEventListener('click', () => {
            const name = inputNewWorkerName ? inputNewWorkerName.value.trim() : '';
            const dept = inputNewWorkerDept ? inputNewWorkerDept.value.trim() : 'Packaging';

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
                dept: dept || 'Packaging'
            };

            workers.push(newWorker);
            saveWorkers(workers);
            setActiveUser(newWorker);

            if (inputNewWorkerName) inputNewWorkerName.value = '';
            if (inputNewWorkerDept) inputNewWorkerDept.value = '';
            hideModal(modalUserAuth);

            showToast(`🎉 Naya worker "${name}" add aur active ho gaya!`);
        });
    }

    // Logout Worker
    if (btnLogoutUser) {
        btnLogoutUser.addEventListener('click', () => {
            setActiveUser(null);
            showToast('Logged out of worker profile');
        });
    }

    // Admin Login (admin / shoaib65)
    if (btnLoginAdmin) {
        btnLoginAdmin.addEventListener('click', () => {
            const user = inputAdminUsername ? inputAdminUsername.value.trim().toLowerCase() : '';
            const pass = inputAdminPassword ? inputAdminPassword.value.trim() : '';

            if (user === 'admin' && pass === 'shoaib65') {
                setAdminLoggedIn(true);
                hideModal(modalUserAuth);
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
                            <span class="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">${item.remarks || '-'}</span>
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

    // Open User Auth Modal on Nav Button Click (Immediate touch + click)
    function handleUserAuthClick(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (isAdminLoggedIn()) {
            openAdminDashboard();
        } else {
            updateWorkerSelectDropdown();
            showModal(modalUserAuth);
        }
    }

    if (btnUserAuth) {
        let touchTriggered = false;
        btnUserAuth.addEventListener('touchend', (e) => {
            touchTriggered = true;
            handleUserAuthClick(e);
            setTimeout(() => { touchTriggered = false; }, 350);
        }, { passive: false });

        btnUserAuth.addEventListener('click', (e) => {
            if (touchTriggered) return;
            handleUserAuthClick(e);
        });
    }

    // Modal Close Handlers & Outside Backdrop Click
    if (modalAuthClose && modalUserAuth) {
        modalAuthClose.addEventListener('click', () => hideModal(modalUserAuth));
    }
    if (modalAdminClose && modalAdminDashboard) {
        modalAdminClose.addEventListener('click', () => hideModal(modalAdminDashboard));
    }

    if (modalUserAuth) {
        modalUserAuth.addEventListener('click', (e) => {
            if (e.target === modalUserAuth) hideModal(modalUserAuth);
        });
    }
    if (modalAdminDashboard) {
        modalAdminDashboard.addEventListener('click', (e) => {
            if (e.target === modalAdminDashboard) hideModal(modalAdminDashboard);
        });
    }

    // Initialize Auth & Dropdown States
    updateWorkerSelectDropdown();
    updateNavAuthBadge();

    // Initial message preview setup
    updatePreview();
});
