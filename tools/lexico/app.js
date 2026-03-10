/**
 * Lexico – Integrated Application
 * Word Dictionary (WordsAPI + Wiktionary fallback) + Text-to-Speech
 * © 2024 Vylex Nexys
 */

'use strict';

const API_CONFIG = {
    WORDS_API: {
        BASE_URL: 'https://wordsapiv1.p.rapidapi.com/words',
        HEADERS: {
            'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
            'x-rapidapi-key': 'f5078a0212mshb1fa8580c4e1506p1b5d08jsn8fde9b6fb27a'
        }
    },
    WIKTIONARY: {
        BASE_URL: 'https://en.wiktionary.org/w/api.php'
    }
};

const App = {
    state: {
        voices: [],
        isPlaying: false,
        autoSpeak: false,
        searchHistory: [],
        ttsHistory: [],
        autoSpeakTimeout: null
    },

    elements: {},

    // ─── INITIALISATION ───────────────────────────────────────────────────────

    init() {
        this.cacheElements();
        this.loadTheme();
        this.loadHistory();
        this.bindEvents();
        this.initTTS();
    },

    cacheElements() {
        const ids = [
            'theme-toggle', 'nav', 'hamburger', 'history-btn', 'historyModal', 'clearHistoryBtn',
            'wordInput', 'searchBtn', 'clearSearchBtn', 'loading', 'error', 'resultsContainer',
            'wordHeader', 'definitionList', 'synonymList', 'rhymeList', 'etymologyContent',
            'ttsText', 'voiceSelect', 'speechRate', 'speechPitch', 'rateValue', 'pitchValue',
            'autoSpeakToggle', 'ttsSpeakBtn', 'ttsClearBtn', 'visualizer', 'ttsHistorySection',
            'ttsHistoryList', 'modalHistoryList'
        ];
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
        this.elements.tabBtns   = document.querySelectorAll('.tab-button');
        this.elements.contents  = document.querySelectorAll('.content-section');
        this.elements.closeModals = document.querySelectorAll('.close-modal');
    },

    // ─── EVENT BINDING ────────────────────────────────────────────────────────

    bindEvents() {
        // Theme & hamburger nav
        this.elements['theme-toggle'].addEventListener('click', () => this.toggleTheme());
        this.elements.hamburger.addEventListener('click', () =>
            this.elements.nav.classList.toggle('active'));

        // Tab switching
        this.elements.tabBtns.forEach(btn =>
            btn.addEventListener('click', e => this.switchTab(e.currentTarget.dataset.tab)));

        // Dictionary search
        this.elements.searchBtn.addEventListener('click', () => this.searchWord());
        this.elements.wordInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.searchWord();
        });
        this.elements.wordInput.addEventListener('input', () => {
            this.elements.clearSearchBtn.classList.toggle('hidden', !this.elements.wordInput.value);
        });
        this.elements.clearSearchBtn.addEventListener('click', () => {
            this.elements.wordInput.value = '';
            this.elements.clearSearchBtn.classList.add('hidden');
            this.elements.resultsContainer.classList.add('hidden');
            this.elements.error.classList.add('hidden');
            this.elements.wordInput.focus();
        });

        // History modal
        this.elements['history-btn'].addEventListener('click', () => this.openHistoryModal());
        this.elements.closeModals.forEach(btn =>
            btn.addEventListener('click', () => this.elements.historyModal.classList.add('hidden')));
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Close modal on backdrop click
        this.elements.historyModal.addEventListener('click', e => {
            if (e.target === this.elements.historyModal)
                this.elements.historyModal.classList.add('hidden');
        });

        // TTS controls
        this.elements.speechRate.addEventListener('input', e =>
            this.elements.rateValue.textContent = parseFloat(e.target.value).toFixed(1));
        this.elements.speechPitch.addEventListener('input', e =>
            this.elements.pitchValue.textContent = parseFloat(e.target.value).toFixed(1));
        this.elements.ttsSpeakBtn.addEventListener('click', () => this.speakCustomText());
        this.elements.ttsClearBtn.addEventListener('click', () => {
            this.elements.ttsText.value = '';
            window.speechSynthesis.cancel();
            this.stopVisualizer();
        });
        this.elements.autoSpeakToggle.addEventListener('click', () => this.toggleAutoSpeak());
        this.elements.ttsText.addEventListener('input', () => {
            if (this.state.autoSpeak) {
                clearTimeout(this.state.autoSpeakTimeout);
                this.state.autoSpeakTimeout = setTimeout(() => this.speakCustomText(), 1500);
            }
        });
    },

    // ─── THEME ────────────────────────────────────────────────────────────────

    loadTheme() {
        const saved = localStorage.getItem('lexicoTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateThemeBtnUI(saved);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('lexicoTheme', next);
        this.updateThemeBtnUI(next);
    },

    updateThemeBtnUI(theme) {
        this.elements['theme-toggle'].innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i> Light Mode'
            : '<i class="fas fa-moon"></i> Dark Mode';
    },

    // ─── TABS ─────────────────────────────────────────────────────────────────

    switchTab(tabId) {
        this.elements.tabBtns.forEach(btn =>
            btn.classList.toggle('active', btn.dataset.tab === tabId));
        this.elements.contents.forEach(content =>
            content.classList.toggle('hidden', content.id !== `${tabId}-content`));
    },

    // ─── DICTIONARY SEARCH ────────────────────────────────────────────────────

    async searchWord(query) {
        const word = (query || this.elements.wordInput.value).trim().toLowerCase();
        if (!word) return this.showError('Please enter a word to search.');

        this.elements.wordInput.value = word;
        this.elements.clearSearchBtn.classList.remove('hidden');
        this.showLoading(true);
        this.elements.resultsContainer.classList.add('hidden');
        this.elements.error.classList.add('hidden');

        try {
            const data = await this.fetchWordData(word);
            this.renderWordData(word, data);
            this.saveToHistory(word, 'searchHistory');
            this.elements.resultsContainer.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            this.showError(`No definition found for "${word}". Try another word.`);
        } finally {
            this.showLoading(false);
        }
    },

    async fetchWordData(word) {
        const result = {
            definitions: [],
            synonyms: [],
            rhymes: [],
            etymology: [],
            pronunciation: null,
            syllables: null
        };

        // 1. Primary – WordsAPI full word endpoint
        try {
            const res = await fetch(
                `${API_CONFIG.WORDS_API.BASE_URL}/${encodeURIComponent(word)}`,
                { headers: API_CONFIG.WORDS_API.HEADERS }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.pronunciation)
                    result.pronunciation = typeof data.pronunciation === 'string'
                        ? data.pronunciation
                        : data.pronunciation.all;
                if (data.syllables)
                    result.syllables = data.syllables.list.join('-');

                if (data.results) {
                    data.results.forEach(item => {
                        result.definitions.push({
                            def: item.definition,
                            pos: item.partOfSpeech || '',
                            examples: item.examples || []
                        });
                        if (item.synonyms) result.synonyms.push(...item.synonyms);
                    });
                }
            }
        } catch (e) {
            console.warn('WordsAPI primary fetch failed:', e);
        }

        // 2. Secondary – dedicated WordsAPI sub-endpoints for richer data
        try {
            const [synRes, rhymeRes, etyRes] = await Promise.all([
                fetch(`${API_CONFIG.WORDS_API.BASE_URL}/${word}/synonyms`,  { headers: API_CONFIG.WORDS_API.HEADERS }).catch(() => null),
                fetch(`${API_CONFIG.WORDS_API.BASE_URL}/${word}/rhymes`,    { headers: API_CONFIG.WORDS_API.HEADERS }).catch(() => null),
                fetch(`${API_CONFIG.WORDS_API.BASE_URL}/${word}/etymology`, { headers: API_CONFIG.WORDS_API.HEADERS }).catch(() => null)
            ]);

            if (synRes?.ok) {
                const d = await synRes.json();
                if (d.synonyms) result.synonyms.push(...d.synonyms);
            }
            if (rhymeRes?.ok) {
                const d = await rhymeRes.json();
                if (d.rhymes?.all) result.rhymes.push(...d.rhymes.all);
            }
            if (etyRes?.ok) {
                const d = await etyRes.json();
                if (d.etymology)
                    result.etymology.push(...(Array.isArray(d.etymology) ? d.etymology : [d.etymology]));
            }
        } catch (e) {
            console.warn('Secondary fetch failed:', e);
        }

        // 3. Fallback – Wiktionary if still no definitions
        if (result.definitions.length === 0) {
            const url = `${API_CONFIG.WIKTIONARY.BASE_URL}?action=query&format=json&prop=extracts`
                + `&titles=${encodeURIComponent(word)}&exintro&explaintext&origin=*`;
            const wikRes  = await fetch(url);
            const wikData = await wikRes.json();
            const pages   = wikData.query.pages;
            const pageId  = Object.keys(pages)[0];

            if (pageId !== '-1' && pages[pageId].extract) {
                pages[pageId].extract
                    .split('\n')
                    .filter(line => line.length > 10)
                    .forEach(ext =>
                        result.definitions.push({ def: ext, pos: 'Wiktionary', examples: [] }));
            } else {
                throw new Error('Word not found.');
            }
        }

        // Deduplicate lists
        result.synonyms = [...new Set(result.synonyms)].slice(0, 15);
        result.rhymes   = [...new Set(result.rhymes)].slice(0, 15);

        return result;
    },

    // ─── RENDER DICTIONARY RESULTS ────────────────────────────────────────────

    renderWordData(word, data) {
        // Header
        let headerHTML = `<h2>${word}</h2>`;
        if (data.pronunciation) headerHTML += `<p>/${data.pronunciation}/</p>`;
        if (data.syllables)     headerHTML += `<p>Syllables: ${data.syllables}</p>`;
        headerHTML += `<button class="btn primary play-pronunciation"
            onclick="App.speak('${word.replace(/'/g, "\\'")}')">
            <i class="fas fa-volume-up"></i> Listen
        </button>`;
        this.elements.wordHeader.innerHTML = headerHTML;

        // Definitions
        this.elements.definitionList.innerHTML = data.definitions.map(d => `
            <li>
                ${d.pos ? `<strong style="color:var(--accent);text-transform:capitalize;">${d.pos}</strong><br>` : ''}
                ${this.escapeHTML(d.def)}
                ${d.examples.length
                    ? `<br><em style="color:var(--text-muted);font-size:0.9em;">Ex: "${this.escapeHTML(d.examples[0])}"</em>`
                    : ''}
            </li>
        `).join('');

        // Synonyms & Rhymes (interactive chips)
        this.renderInteractiveList(data.synonyms, this.elements.synonymList);
        this.renderInteractiveList(data.rhymes,   this.elements.rhymeList);

        // Etymology
        const etySection = this.elements.etymologyContent.parentElement;
        if (data.etymology.length) {
            this.elements.etymologyContent.innerHTML =
                `<ul style="list-style-position:inside;">${data.etymology.map(e =>
                    `<li>${this.escapeHTML(e)}</li>`).join('')}</ul>`;
            etySection.classList.remove('hidden');
        } else {
            etySection.classList.add('hidden');
        }
    },

    renderInteractiveList(items, el) {
        if (!items.length) {
            el.innerHTML = '<li style="background:transparent;border:none;cursor:default;">None found</li>';
            return;
        }
        el.innerHTML = items.map(item => `<li>${this.escapeHTML(item)}</li>`).join('');
        el.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.switchTab('dictionary');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.searchWord(li.textContent.trim());
            });
        });
    },

    // ─── UI STATE ─────────────────────────────────────────────────────────────

    showLoading(show) {
        this.elements.loading.classList.toggle('hidden', !show);
        if (show) this.elements.error.classList.add('hidden');
    },

    showError(msg) {
        this.elements.error.textContent = msg;
        this.elements.error.classList.remove('hidden');
        this.elements.loading.classList.add('hidden');
    },

    // ─── HISTORY ──────────────────────────────────────────────────────────────

    loadHistory() {
        this.state.searchHistory = JSON.parse(localStorage.getItem('lexicoSearchHistory')) || [];
        this.state.ttsHistory    = JSON.parse(localStorage.getItem('lexicoTTSHistory'))    || [];
        this.renderTTSHistory();
    },

    saveToHistory(item, listName) {
        let history = this.state[listName];
        history = history.filter(i => i.toLowerCase() !== item.toLowerCase());
        history.unshift(item);
        if (history.length > 20) history.pop();
        this.state[listName] = history;

        const storageKey = listName === 'searchHistory' ? 'lexicoSearchHistory' : 'lexicoTTSHistory';
        localStorage.setItem(storageKey, JSON.stringify(history));

        if (listName === 'ttsHistory') this.renderTTSHistory();
    },

    openHistoryModal() {
        const list = this.elements.modalHistoryList;
        if (this.state.searchHistory.length) {
            list.innerHTML = this.state.searchHistory
                .map(item => `<li>${this.escapeHTML(item)}</li>`).join('');
            list.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', () => {
                    this.elements.historyModal.classList.add('hidden');
                    this.switchTab('dictionary');
                    this.searchWord(li.textContent.trim());
                });
            });
        } else {
            list.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No search history yet.</p>';
        }
        this.elements.historyModal.classList.remove('hidden');
    },

    clearHistory() {
        this.state.searchHistory = [];
        this.state.ttsHistory    = [];
        localStorage.removeItem('lexicoSearchHistory');
        localStorage.removeItem('lexicoTTSHistory');
        this.elements.modalHistoryList.innerHTML =
            '<p style="text-align:center;color:var(--text-muted);">History cleared.</p>';
        this.renderTTSHistory();
    },

    // ─── TEXT-TO-SPEECH ───────────────────────────────────────────────────────

    initTTS() {
        const loadVoices = () => {
            this.state.voices = window.speechSynthesis.getVoices();
            const select = this.elements.voiceSelect;
            select.innerHTML = '';

            if (!this.state.voices.length) {
                select.innerHTML = '<option value="">No voices available</option>';
                return;
            }

            // Group by language
            const groups = {};
            this.state.voices.forEach((v, i) => {
                const lang = v.lang.split('-')[0].toUpperCase();
                if (!groups[lang]) groups[lang] = [];
                groups[lang].push({ voice: v, index: i });
            });

            Object.entries(groups)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([lang, entries]) => {
                    const og = document.createElement('optgroup');
                    og.label = lang;
                    entries.forEach(({ voice, index }) => {
                        const opt = document.createElement('option');
                        opt.value  = index;
                        opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' ★' : ''}`;
                        if (voice.default) opt.selected = true;
                        og.appendChild(opt);
                    });
                    select.appendChild(og);
                });
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    },

    speak(text) {
        if (!text || !text.trim()) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voiceIndex = parseInt(this.elements.voiceSelect.value, 10);

        if (!isNaN(voiceIndex) && this.state.voices[voiceIndex])
            utterance.voice = this.state.voices[voiceIndex];

        utterance.rate  = parseFloat(this.elements.speechRate.value)  || 1.0;
        utterance.pitch = parseFloat(this.elements.speechPitch.value) || 1.0;

        utterance.onstart = () => {
            this.state.isPlaying = true;
            this.startVisualizer();
        };
        utterance.onend = () => {
            this.state.isPlaying = false;
            this.stopVisualizer();
        };
        utterance.onerror = () => {
            this.state.isPlaying = false;
            this.stopVisualizer();
        };

        window.speechSynthesis.speak(utterance);
    },

    speakCustomText() {
        const text = this.elements.ttsText.value.trim();
        if (!text) return;
        this.speak(text);
        this.saveToHistory(text.slice(0, 60) + (text.length > 60 ? '…' : ''), 'ttsHistory');
    },

    toggleAutoSpeak() {
        this.state.autoSpeak = !this.state.autoSpeak;
        this.elements.autoSpeakToggle.textContent =
            `Auto-Speak: ${this.state.autoSpeak ? 'ON' : 'OFF'}`;
        this.elements.autoSpeakToggle.classList.toggle('success', this.state.autoSpeak);
        this.elements.autoSpeakToggle.classList.toggle('outline', !this.state.autoSpeak);
    },

    // ─── VISUALIZER ───────────────────────────────────────────────────────────

    startVisualizer() {
        const viz = this.elements.visualizer;
        viz.classList.remove('hidden');
        viz.innerHTML = '';

        const count = 18;
        for (let i = 0; i < count; i++) {
            const bar = document.createElement('div');
            bar.className = 'visualizer-bar';
            bar.style.animationDelay = `${(i / count * 1).toFixed(2)}s`;
            bar.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
            viz.appendChild(bar);
        }
    },

    stopVisualizer() {
        this.elements.visualizer.classList.add('hidden');
        this.elements.visualizer.innerHTML = '';
    },

    // ─── TTS HISTORY RENDERING ────────────────────────────────────────────────

    renderTTSHistory() {
        const section = this.elements.ttsHistorySection;
        const list    = this.elements.ttsHistoryList;

        if (!this.state.ttsHistory.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        list.innerHTML = this.state.ttsHistory
            .map(item => `<li title="${this.escapeAttr(item)}">${this.escapeHTML(item)}</li>`)
            .join('');

        list.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.elements.ttsText.value = li.getAttribute('title');
                this.speakCustomText();
            });
        });
    },

    // ─── UTILITIES ────────────────────────────────────────────────────────────

    escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    escapeAttr(str) {
        return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
};

// Bootstrap
document.addEventListener('DOMContentLoaded', () => App.init());