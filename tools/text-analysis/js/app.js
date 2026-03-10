// ── State ──
let isSidebarOpen = window.innerWidth > 768;

// ── DOM refs ──
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const overlay = document.getElementById('overlay');
const toggleBtn = document.getElementById('sidebarToggle');
const themeToggle = document.getElementById('themeToggle');

// ── Sidebar ──
function updateSidebar(open) {
    isSidebarOpen = open;
    sidebar.classList.toggle('closed', !open);
    toggleBtn.classList.toggle('open', open);
    if (window.innerWidth > 768) {
        mainContent.style.marginLeft = open ? 'var(--sidebar-w)' : '0';
    } else {
        mainContent.style.marginLeft = '0';
        overlay.classList.toggle('active', open);
    }
}
toggleBtn.addEventListener('click', () => updateSidebar(!isSidebarOpen));
overlay.addEventListener('click', () => updateSidebar(false));
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isSidebarOpen && window.innerWidth <= 768) updateSidebar(false);
});
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        updateSidebar(true);
        overlay.classList.remove('active');
    } else {
        updateSidebar(false);
    }
});

// ── Theme ──
let isDark = false;
themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
});

// ── Tool switching ──
function showTool(id, el) {
    document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
    if (window.innerWidth <= 768) updateSidebar(false);
}

// ── Toast ──
function showToast(msg = '✓ Copied to clipboard') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Copy ──
function copyText(elId) {
    const el = document.getElementById(elId);
    const text = el.textContent || el.innerText;
    navigator.clipboard.writeText(text).then(() => showToast('✓ Copied!')).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        showToast('✓ Copied!');
    });
}

// ═══════════════════════════════
// 1. Word Counter
// ═══════════════════════════════
function countWordsAndChars() {
    const text = document.getElementById('countText').value;
    const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0) : [];
    const charCount = text.length;
    const charNoSp = text.replace(/\s/g, '').length;
    const unique = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))).size;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // bar
    const MAX = 5000;
    const pct = Math.min((charCount / MAX) * 100, 100);
    document.getElementById('charBarFill').style.width = pct + '%';
    document.getElementById('charBarFill').style.background = pct > 90 ? '#e03e1a' : 'var(--accent)';
    document.getElementById('charBarLabel').textContent = charCount + ' characters';
    document.getElementById('charBarPct').textContent = charCount > 0 ? Math.round(pct) + '% of 5k' : '';

    document.getElementById('countResults').innerHTML = [
        { label: 'Words', value: words.length },
        { label: 'Characters', value: charCount },
        { label: 'No Spaces', value: charNoSp },
        { label: 'Unique Words', value: unique },
        { label: 'Sentences', value: sentences },
        { label: 'Read Time', value: Math.ceil(words.length / 200) + ' min' }
    ].map(r => `
        <div class="result-card">
            <div class="result-label">${r.label}</div>
            <div class="result-value">${r.value}</div>
        </div>
    `).join('');
}

// ═══════════════════════════════
// 2. Case Converter
// ═══════════════════════════════
function convertCase(type) {
    const text = document.getElementById('caseText').value;
    if (!text.trim()) { showToast('⚠ No text entered'); return; }
    let result = '';
    switch (type) {
        case 'upper':    result = text.toUpperCase(); break;
        case 'lower':    result = text.toLowerCase(); break;
        case 'title':    result = text.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase()); break;
        case 'sentence': result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase()); break;
        case 'camel':
            result = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()); break;
        case 'snake':
            result = text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); break;
    }
    document.getElementById('caseResult').textContent = result;
    document.getElementById('caseOutput').style.display = 'block';
}

// ═══════════════════════════════
// 3. Text Analyzer
// ═══════════════════════════════
function analyzeText() {
    const text = document.getElementById('statsText').value;
    const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0) : [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / (words.length || 1);
    const avgSentLen = words.length / (sentences.length || 1);
    const longest = words.length ? words.reduce((a, b) => a.length > b.length ? a : b) : '—';

    const rows = [
        ['Sentences', sentences.length],
        ['Paragraphs', paragraphs.length],
        ['Avg word length', avgWordLen.toFixed(1) + ' chars'],
        ['Avg sentence length', avgSentLen.toFixed(1) + ' words'],
        ['Longest word', longest],
        ['Reading time', Math.ceil(words.length / 200) + ' minute(s)'],
        ['Speaking time', Math.ceil(words.length / 130) + ' minute(s)'],
    ];

    document.getElementById('statsResults').innerHTML = rows.map(([l, v]) => `
        <div class="result-row">
            <span class="result-row-label">${l}</span>
            <span class="result-row-val">${v}</span>
        </div>
    `).join('');

    // Word frequency
    if (words.length > 0) {
        const freq = {};
        const stopWords = new Set(['the','and','for','that','this','with','are','was','were','have','from','they','been','has','but','not','what','all','when','can','her','him','his','she','you','your','will','one','our','out','who','its','their','said','also','into','than','then','there','these','those','just','more','some','over','such','very','like','even']);
        words.forEach(w => {
            const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (clean.length > 2 && !stopWords.has(clean)) {
                freq[clean] = (freq[clean] || 0) + 1;
            }
        });
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const maxF = sorted[0]?.[1] || 1;

        if (sorted.length > 0) {
            document.getElementById('freqSection').style.display = 'block';
            document.getElementById('freqTable').innerHTML = `
                <thead><tr><th>Word</th><th>Count</th><th style="width:120px">Freq</th></tr></thead>
                <tbody>${sorted.map(([w, c]) => `
                    <tr>
                        <td>${w}</td>
                        <td>${c}</td>
                        <td><div class="freq-bar" style="width:${Math.round(c/maxF*100)}%"></div></td>
                    </tr>
                `).join('')}</tbody>
            `;
        }
    } else {
        document.getElementById('freqSection').style.display = 'none';
    }
}

// ═══════════════════════════════
// 4. Readability
// ═══════════════════════════════
function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word.length) return 0;
    word = word.replace(/e$/, '');
    const matches = word.match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
}

function scoreReadability() {
    const text = document.getElementById('readText').value.trim();
    if (!text) { document.getElementById('readResults').innerHTML = ''; return; }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);
    if (!words.length || !sentences.length) return;

    const syllableCount = words.reduce((s, w) => s + countSyllables(w), 0);
    const wps = words.length / sentences.length;
    const spw = syllableCount / words.length;

    // Flesch Reading Ease
    const ease = 206.835 - 1.015 * wps - 84.6 * spw;
    // Flesch-Kincaid Grade
    const grade = 0.39 * wps + 11.8 * spw - 15.59;

    let level, badgeClass, desc;
    if (ease >= 70) { level = 'Easy'; badgeClass = 'badge-easy'; desc = 'Easy to read. Suitable for most audiences.'; }
    else if (ease >= 50) { level = 'Medium'; badgeClass = 'badge-medium'; desc = 'Moderately complex. Good for informed readers.'; }
    else { level = 'Difficult'; badgeClass = 'badge-hard'; desc = 'Complex text. Best for academic or expert audiences.'; }

    document.getElementById('readResults').innerHTML = `
        <div class="results-grid" style="margin-bottom:16px;">
            <div class="result-card">
                <div class="result-label">Reading Ease</div>
                <div class="result-value">${Math.max(0, ease).toFixed(1)}</div>
            </div>
            <div class="result-card">
                <div class="result-label">Grade Level</div>
                <div class="result-value">${Math.max(0, grade).toFixed(1)}</div>
            </div>
            <div class="result-card">
                <div class="result-label">Syllables/Word</div>
                <div class="result-value">${spw.toFixed(2)}</div>
            </div>
            <div class="result-card">
                <div class="result-label">Words/Sentence</div>
                <div class="result-value">${wps.toFixed(1)}</div>
            </div>
        </div>
        <div class="result-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
            <span class="readability-badge ${badgeClass}">${level}</span>
            <span style="font-size:14px;color:var(--text-muted);">${desc}</span>
        </div>
    `;
}

// ═══════════════════════════════
// 5. Find & Replace
// ═══════════════════════════════
let frOriginal = '';

function updateFRPreview() {
    const text = document.getElementById('frText').value;
    const find = document.getElementById('findInput').value;
    const cs = document.getElementById('caseSensitive').checked;
    const matchEl = document.getElementById('matchCount');

    if (!find || !text) {
        matchEl.textContent = '';
        document.getElementById('frOutputWrap').style.display = 'none';
        return;
    }

    const flags = cs ? 'g' : 'gi';
    const regex = new RegExp(escapeRegex(find), flags);
    const matches = text.match(regex);
    matchEl.textContent = matches ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} found` : 'No matches found';
}

function applyReplace() {
    const text = document.getElementById('frText').value;
    const find = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    const cs = document.getElementById('caseSensitive').checked;

    if (!text) { showToast('⚠ No text entered'); return; }
    if (!find)  { showToast('⚠ No search term'); return; }

    const flags = cs ? 'g' : 'gi';
    const regex = new RegExp(escapeRegex(find), flags);
    const result = text.replace(regex, replace);

    document.getElementById('frResult').textContent = result;
    document.getElementById('frOutputWrap').style.display = 'block';
    showToast('✓ Replacement applied');
}

function resetFR() {
    document.getElementById('frText').value = '';
    document.getElementById('findInput').value = '';
    document.getElementById('replaceInput').value = '';
    document.getElementById('matchCount').textContent = '';
    document.getElementById('frOutputWrap').style.display = 'none';
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════
// 6. Text Cleaner
// ═══════════════════════════════
function clean(type) {
    let text = document.getElementById('cleanText').value;
    if (!text.trim()) { showToast('⚠ No text to clean'); return; }

    switch (type) {
        case 'extraSpaces':    text = text.replace(/[ \t]+/g, ' ').trim(); break;
        case 'duplicateLines':
            const seen = new Set();
            text = text.split('\n').filter(l => {
                const t = l.trim();
                if (seen.has(t)) return false;
                seen.add(t); return true;
            }).join('\n');
            break;
        case 'emptyLines':   text = text.replace(/^\s*[\r\n]/gm, '').trim(); break;
        case 'lineBreaks':   text = text.replace(/[\r\n]+/g, ' ').trim(); break;
        case 'numbers':      text = text.replace(/\d+/g, ''); break;
        case 'punctuation':  text = text.replace(/[^\w\s]/g, ''); break;
        case 'html':         text = text.replace(/<[^>]+>/g, ''); break;
        case 'trim':         text = text.split('\n').map(l => l.trim()).join('\n'); break;
    }

    document.getElementById('cleanText').value = text;
    document.getElementById('cleanResult').textContent = text;
    document.getElementById('cleanOutputWrap').style.display = 'block';
    showToast('✓ Text cleaned');
}

// ── Init ──
updateSidebar(window.innerWidth > 768);
