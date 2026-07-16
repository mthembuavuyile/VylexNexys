// ============================================================================
// editor.js - Core Editor, Formatting, Tabs & Export Logic
// ============================================================================

const EDITOR_STATE = {
    notes: [],
    activeId: null,
    editorEl: null,
    tabBarEl: null,
    addTabBtn: null,
    NOTES_KEY: 'WritingSuiteNotes',
    ACTIVE_KEY: 'WritingSuiteActive'
};

function initializeEditor() {
    EDITOR_STATE.editorEl = document.getElementById('editor');
    EDITOR_STATE.tabBarEl = document.getElementById('tabBar');
    EDITOR_STATE.addTabBtn = document.getElementById('addTabBtn');

    loadNotes();
    setupEditorEvents();
    setupFormatting();
    setupExport();
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function persistNotes() {
    localStorage.setItem(EDITOR_STATE.NOTES_KEY, JSON.stringify(EDITOR_STATE.notes));
    localStorage.setItem(EDITOR_STATE.ACTIVE_KEY, EDITOR_STATE.activeId);
}

function getActiveNote() {
    return EDITOR_STATE.notes.find(n => n.id === EDITOR_STATE.activeId);
}

function loadNotes() {
    const savedNotes = localStorage.getItem(EDITOR_STATE.NOTES_KEY);
    const savedActive = localStorage.getItem(EDITOR_STATE.ACTIVE_KEY);

    if (savedNotes) {
        try {
            EDITOR_STATE.notes = JSON.parse(savedNotes);
        } catch (e) {
            EDITOR_STATE.notes = [];
        }
    }

    if (EDITOR_STATE.notes.length === 0) {
        // Fallback: Check if they had WriterContent from old app
        const legacyContent = localStorage.getItem('WriterContent') || localStorage.getItem('WriterNotes') || '';
        let content = '';
        if(legacyContent && legacyContent.includes('content')) {
            try { content = JSON.parse(legacyContent)[0].content; } catch(e) {}
        }

        EDITOR_STATE.notes = [{
            id: uid(),
            title: 'My Note',
            content: content || ''
        }];
    }

    if (savedActive && EDITOR_STATE.notes.find(n => n.id === savedActive)) {
        EDITOR_STATE.activeId = savedActive;
    } else {
        EDITOR_STATE.activeId = EDITOR_STATE.notes[0].id;
    }

    const active = getActiveNote();
    if (active) {
        EDITOR_STATE.editorEl.innerHTML = active.content;
    }

    persistNotes();
    renderTabs();
}

function renderTabs() {
    // Remove existing tabs except add button
    EDITOR_STATE.tabBarEl.querySelectorAll('.tab').forEach(t => t.remove());

    EDITOR_STATE.notes.forEach(note => {
        const tab = document.createElement('div');
        tab.className = 'tab' + (note.id === EDITOR_STATE.activeId ? ' active' : '');
        tab.dataset.id = note.id;

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = note.title;
        title.title = 'Double-click to rename';

        title.addEventListener('click', () => switchTab(note.id));
        title.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startRename(note.id, title);
        });

        tab.appendChild(title);

        if (EDITOR_STATE.notes.length > 1) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tab-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.title = 'Close note';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(note.id);
            });
            tab.appendChild(closeBtn);
        }

        EDITOR_STATE.tabBarEl.insertBefore(tab, EDITOR_STATE.addTabBtn);
    });
}

function switchTab(id) {
    const current = getActiveNote();
    if (current) {
        current.content = EDITOR_STATE.editorEl.innerHTML;
    }

    EDITOR_STATE.activeId = id;
    const note = getActiveNote();
    if (note) {
        EDITOR_STATE.editorEl.innerHTML = note.content;
    }

    persistNotes();
    renderTabs();
    if (typeof handleAnalysis === 'function') handleAnalysis();
}

function addTab() {
    const current = getActiveNote();
    if (current) {
        current.content = EDITOR_STATE.editorEl.innerHTML;
    }

    const note = {
        id: uid(),
        title: 'Untitled ' + (EDITOR_STATE.notes.length + 1),
        content: ''
    };
    EDITOR_STATE.notes.push(note);
    EDITOR_STATE.activeId = note.id;
    EDITOR_STATE.editorEl.innerHTML = '';

    persistNotes();
    renderTabs();
    if (typeof handleAnalysis === 'function') handleAnalysis();
    EDITOR_STATE.editorEl.focus();
}

function closeTab(id) {
    if (EDITOR_STATE.notes.length <= 1) return;

    const idx = EDITOR_STATE.notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    EDITOR_STATE.notes.splice(idx, 1);

    if (EDITOR_STATE.activeId === id) {
        const newIdx = Math.min(idx, EDITOR_STATE.notes.length - 1);
        EDITOR_STATE.activeId = EDITOR_STATE.notes[newIdx].id;
        const note = getActiveNote();
        EDITOR_STATE.editorEl.innerHTML = note ? note.content : '';
    }

    persistNotes();
    renderTabs();
    if (typeof handleAnalysis === 'function') handleAnalysis();
}

function startRename(id, titleEl) {
    const note = EDITOR_STATE.notes.find(n => n.id === id);
    if (!note) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tab-rename-input';
    input.value = note.title;
    input.maxLength = 30;

    const finishRename = () => {
        const newTitle = input.value.trim() || 'Untitled';
        note.title = newTitle;
        persistNotes();
        renderTabs();
    };

    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = note.title; input.blur(); }
    });

    titleEl.replaceWith(input);
    input.focus();
    input.select();
}

function setupEditorEvents() {
    EDITOR_STATE.editorEl.addEventListener('paste', (e) => {
        const pastePlainBtn = document.getElementById('pastePlainBtn');
        if (pastePlainBtn && pastePlainBtn.classList.contains('active')) {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    });

    EDITOR_STATE.editorEl.addEventListener('input', () => {
        const note = getActiveNote();
        if (note) {
            note.content = EDITOR_STATE.editorEl.innerHTML;
        }
        persistNotes();
        if (typeof handleAnalysis === 'function') handleAnalysis();
    });

    EDITOR_STATE.addTabBtn.addEventListener('click', addTab);

    document.getElementById('saveBtn').addEventListener('click', () => {
        const note = getActiveNote();
        if (note) note.content = EDITOR_STATE.editorEl.innerHTML;
        persistNotes();
        showAlert('All notes saved to local storage.', 'success');
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault(); addTab();
        }
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault(); if (EDITOR_STATE.notes.length > 1) closeTab(EDITOR_STATE.activeId);
        }
        if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const idx = EDITOR_STATE.notes.findIndex(n => n.id === EDITOR_STATE.activeId);
            switchTab(EDITOR_STATE.notes[(idx + 1) % EDITOR_STATE.notes.length].id);
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
            e.preventDefault();
            const idx = EDITOR_STATE.notes.findIndex(n => n.id === EDITOR_STATE.activeId);
            switchTab(EDITOR_STATE.notes[(idx - 1 + EDITOR_STATE.notes.length) % EDITOR_STATE.notes.length].id);
        }
    });
}

function setupFormatting() {
    const commands = {
        'boldBtn': 'bold',
        'italicBtn': 'italic',
        'underlineBtn': 'underline',
        'strikeBtn': 'strikeThrough',
        'alignLeftBtn': 'justifyLeft',
        'alignCenterBtn': 'justifyCenter',
        'alignRightBtn': 'justifyRight',
        'listBtn': 'insertUnorderedList',
        'numberListBtn': 'insertOrderedList',
        'clearFormatBtn': 'removeFormat'
    };

    for (const [id, cmd] of Object.entries(commands)) {
        document.getElementById(id).addEventListener('click', () => {
            document.execCommand(cmd, false, null);
            EDITOR_STATE.editorEl.focus();
            updateFormatState();
        });
    }

    const pastePlainBtn = document.getElementById('pastePlainBtn');
    if (pastePlainBtn) {
        pastePlainBtn.addEventListener('click', () => {
            pastePlainBtn.classList.toggle('active');
        });
    }

    document.addEventListener('selectionchange', updateFormatState);
    EDITOR_STATE.editorEl.addEventListener('keyup', updateFormatState);
    EDITOR_STATE.editorEl.addEventListener('mouseup', updateFormatState);

    document.getElementById('linkBtn').addEventListener('click', () => {
        const url = prompt('Enter URL:', 'https://');
        if (url) {
            document.execCommand('createLink', false, url);
        }
        EDITOR_STATE.editorEl.focus();
    });

    document.getElementById('fontFamily').addEventListener('change', function () {
        if (this.value !== 'inherit') {
            EDITOR_STATE.editorEl.style.fontFamily = this.value;
            EDITOR_STATE.editorEl.focus();
        }
    });
}

function updateFormatState() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !EDITOR_STATE.editorEl.contains(sel.anchorNode)) return;
    
    const commands = {
        'boldBtn': 'bold',
        'italicBtn': 'italic',
        'underlineBtn': 'underline',
        'strikeBtn': 'strikeThrough',
        'alignLeftBtn': 'justifyLeft',
        'alignCenterBtn': 'justifyCenter',
        'alignRightBtn': 'justifyRight',
        'listBtn': 'insertUnorderedList',
        'numberListBtn': 'insertOrderedList'
    };
    
    for (const [id, cmd] of Object.entries(commands)) {
        const btn = document.getElementById(id);
        if (!btn) continue;
        if (document.queryCommandState(cmd)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

function setupExport() {
    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        const note = getActiveNote();
        const filename = note ? note.title.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'document' : 'document';
        const opt = {
            margin: [15, 15],
            filename: `${filename}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        const el = EDITOR_STATE.editorEl.cloneNode(true);
        // Force PDF color to dark text for legibility if needed, or keep as is.
        el.style.color = '#000';
        el.style.background = '#fff';

        html2pdf().from(el).set(opt).save()
            .then(() => showAlert('PDF exported successfully!', 'success'))
            .catch(err => {
                showAlert('Error exporting PDF.', 'error');
                console.error(err);
            });
    });
}
