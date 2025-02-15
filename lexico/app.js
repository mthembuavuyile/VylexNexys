// Theme Management
const ThemeManager = {
    themes: {
        light: {
            background: '#f8fafc',
            text: '#1e293b',
            card: '#ffffff'
        },
        dark: {
            background: '#1a1a1a',
            text: '#ffffff',
            card: '#2d2d2d'
        }
    },

    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
    },

    toggleTheme() {
        const root = document.documentElement;
        const isDark = root.style.getPropertyValue('--background') === this.themes.dark.background;
        const newTheme = isDark ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    },

    applyTheme(theme) {
        const root = document.documentElement;
        const themeValues = this.themes[theme];
        Object.entries(themeValues).forEach(([property, value]) => {
            root.style.setProperty(`--${property}`, value);
        });
    }
};

// Navigation Management
const NavigationManager = {
    init() {
        this.setupEventListeners();
    },

    toggleMenu() {
        const nav = document.getElementById('nav');
        if (!nav) return;
        
        nav.classList.toggle('active');
        
        if (nav.classList.contains('active') && !document.querySelector('.close-menu')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-menu';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.onclick = () => this.toggleMenu();
            nav.appendChild(closeBtn);
        }
    },

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const nav = document.getElementById('nav');
            const hamburger = document.querySelector('.hamburger');
            
            if (nav?.classList.contains('active') && 
                !nav.contains(e.target) && 
                !hamburger?.contains(e.target)) {
                this.toggleMenu();
            }
        });
    }
};

// Word Data Management
const WordDataManager = {
    apiKey: 'f5078a0212mshb1fa8580c4e1506p1b5d08jsn8fde9b6fb27a',
    loading: null,
    error: null,

    init() {
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.setupEventListeners();
        this.initializeHistory();
    },

    initializeHistory() {
        if (!localStorage.getItem('lexicoSearchHistory')) {
            localStorage.setItem('lexicoSearchHistory', JSON.stringify([]));
        }
    },

    async translateWord(word, targetLang) {
        try {
            const response = await axios.get(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${encodeURIComponent(targetLang)}`
            );
            return response.data.responseData.translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return 'Translation failed';
        }
    },

    resetResults() {
        const elements = [
            'definitionList', 'synonymList', 'rhymeList', 'etymology',
            'examples', 'pronunciation', 'phonetic'
        ];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = '';
        });
        if (this.error) this.error.style.display = 'none';
    },

    async fetchWordData() {
        const wordInput = document.getElementById('wordInput');
        if (!wordInput) return;

        const word = wordInput.value.toLowerCase().trim();
        
        this.resetResults();

        if (!word) {
            this.showError('Please enter a word to search');
            return;
        }

        if (this.loading) this.loading.style.display = 'block';

        try {
            const response = await this.fetchFromWordsAPI(word);
            this.saveToHistory(word);
            this.displayResults(response);
            await this.fetchAndDisplayRhymes(word);
        } catch (error) {
            this.showError('Word not found or error occurred');
            console.error('Error:', error);
        } finally {
            if (this.loading) this.loading.style.display = 'none';
        }
    },

    async fetchFromWordsAPI(word) {
        const settings = {
            url: `https://wordsapiv1.p.rapidapi.com/words/${encodeURIComponent(word)}`,
            method: 'GET',
            headers: {
                'x-rapidapi-key': this.apiKey,
                'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
            }
        };

        return $.ajax(settings);
    },

    async fetchAndDisplayRhymes(word) {
        try {
            const response = await $.ajax({
                url: `https://wordsapiv1.p.rapidapi.com/words/${encodeURIComponent(word)}/rhymes`,
                method: 'GET',
                headers: {
                    'x-rapidapi-key': this.apiKey,
                    'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
                }
            });

            const rhymeList = document.getElementById('rhymeList');
            if (rhymeList && response.rhymes?.all) {
                const relevantRhymes = this.filterRelevantRhymes(word, response.rhymes.all);
                relevantRhymes.forEach(rhyme => {
                    const li = document.createElement('li');
                    li.textContent = rhyme;
                    rhymeList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Error fetching rhymes:', error);
        }
    },

    filterRelevantRhymes(originalWord, rhymes) {
        return rhymes.filter(rhyme => {
            if (rhyme.endsWith(originalWord)) return false;
            
            let commonEndingLength = 0;
            for (let i = 1; i <= Math.min(originalWord.length, rhyme.length); i++) {
                if (originalWord.slice(-i) === rhyme.slice(-i)) {
                    commonEndingLength = i;
                } else {
                    break;
                }
            }

            return commonEndingLength >= 2 && rhyme.length <= originalWord.length * 2;
        }).slice(0, 10);
    },

    displayResults(data) {
        this.displayDefinitions(data);
        this.displaySynonyms(data);
        this.displayEtymology(data);
        this.displayExamples(data);
        this.displayPronunciation(data);
        this.displayPhonetic(data);
    },

    displayDefinitions(data) {
        const definitionList = document.getElementById('definitionList');
        if (definitionList && data.results) {
            data.results.forEach(result => {
                if (result.definition) {
                    const li = document.createElement('li');
                    li.textContent = result.definition;
                    definitionList.appendChild(li);
                }
            });
        }
    },

    displaySynonyms(data) {
        const synonymList = document.getElementById('synonymList');
        if (synonymList && data.results) {
            const synonyms = new Set();
            data.results.forEach(result => {
                if (result.synonyms) {
                    result.synonyms.forEach(synonym => synonyms.add(synonym));
                }
            });
            synonyms.forEach(synonym => {
                const li = document.createElement('li');
                li.textContent = synonym;
                synonymList.appendChild(li);
            });
        }
    },

    displayEtymology(data) {
        const etymology = document.getElementById('etymology');
        if (!etymology) return;

        if (data.etymology) {
            if (typeof data.etymology === 'string') {
                etymology.textContent = data.etymology;
            } else if (Array.isArray(data.etymology)) {
                etymology.innerHTML = data.etymology
                    .map(etym => `<p>${etym}</p>`)
                    .join('');
            }
        } else {
            etymology.textContent = 'Etymology not available';
        }
    },

    displayExamples(data) {
        const examples = document.getElementById('examples');
        if (examples && data.results) {
            data.results.forEach(result => {
                if (result.examples) {
                    result.examples.forEach(example => {
                        const exampleDiv = document.createElement('div');
                        exampleDiv.className = 'example-card';
                        exampleDiv.textContent = `"${example}"`;
                        examples.appendChild(exampleDiv);
                    });
                }
            });
        }
    },

    displayPronunciation(data) {
        const pronunciation = document.getElementById('pronunciation');
        if (pronunciation && data.pronunciation) {
            pronunciation.textContent = typeof data.pronunciation === 'string' 
                ? data.pronunciation 
                : data.pronunciation.all;
        }
    },

    displayPhonetic(data) {
        const phonetic = document.getElementById('phonetic');
        if (phonetic && data.results) {
            data.results.forEach(result => {
                if (result.phonetic) {
                    phonetic.textContent = result.phonetic;
                }
            });
        }
    },

    showError(message) {
        if (this.error) {
            this.error.textContent = message;
            this.error.style.display = 'block';
        }
    },

    saveToHistory(word) {
        let history = JSON.parse(localStorage.getItem('lexicoSearchHistory'));
        
        const newSearch = {
            word: word,
            timestamp: new Date().toLocaleString()
        };
        
        history = history.filter(item => item.word.toLowerCase() !== word.toLowerCase());
        history.unshift(newSearch);
        
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('lexicoSearchHistory', JSON.stringify(history));
    },

    setupEventListeners() {
        const wordInput = document.getElementById('wordInput');
        if (wordInput) {
            wordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.fetchWordData();
                }
            });
        }
    }
};

// Speech Synthesis Management
const SpeechManager = {
    voices: [],

    init() {
        this.populateVoiceList();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.populateVoiceList();
        }
    },

    populateVoiceList() {
        this.voices = window.speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;

        voiceSelect.innerHTML = '';
        this.voices.forEach((voice, index) => {
            const option = new Option(`${voice.name} (${voice.lang})`, index);
            voiceSelect.options.add(option);
        });
    },

    playPronunciation() {
        const wordInput = document.getElementById('wordInput');
        if (!wordInput) return;

        const word = wordInput.value;
        
        if (!word) {
            alert('Please enter a word');
            return;
        }

        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;

        const voiceIndex = voiceSelect.value;
        const utterance = new SpeechSynthesisUtterance(word);
        
        if (this.voices[voiceIndex]) {
            utterance.voice = this.voices[voiceIndex];
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
};

function openSearchHistory() {
    const historyWindow = window.open('', 'Lexico Search History', 'width=500,height=600');
    const history = JSON.parse(localStorage.getItem('lexicoSearchHistory'));
    
    const historyContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Lexico - Search History</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: var(--bg-color, #ffffff);
                    color: var(--text-color, #333333);
                }
                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .clear-btn {
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .history-list {
                    list-style: none;
                    padding: 0;
                }
                .history-item {
                    padding: 15px;
                    border-bottom: 1px solid #ddd;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .history-item:hover {
                    background-color: #f5f5f5;
                }
                .word {
                    font-weight: bold;
                    color: #2c3e50;
                }
                .timestamp {
                    color: #666;
                    font-size: 0.8em;
                    margin-top: 5px;
                }
                .no-history {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <div class="history-header">
                <h2><i class="fas fa-history"></i> Search History</h2>
                <button class="clear-btn" onclick="clearHistory()">
                    <i class="fas fa-trash"></i> Clear History
                </button>
            </div>
            ${history.length > 0 ? `
                <ul class="history-list">
                    ${history.map(item => `
                        <li class="history-item" onclick="searchWord('${item.word}')">
                            <div class="word">${item.word}</div>
                            <div class="timestamp">${item.timestamp}</div>
                        </li>
                    `).join('')}
                </ul>
            ` : `
                <div class="no-history">
                    <i class="fas fa-search"></i>
                    <p>No search history yet</p>
                </div>
            `}
            <script>
                function clearHistory() {
                    if (confirm('Are you sure you want to clear all search history?')) {
                        window.opener.localStorage.setItem('lexicoSearchHistory', JSON.stringify([]));
                        window.location.reload();
                    }
                }
                
                function searchWord(word) {
                    window.opener.document.getElementById('wordInput').value = word;
                    window.opener.fetchWordData();
                }
            </script>
        </body>
        </html>
    `;
    
    historyWindow.document.write(historyContent);
    historyWindow.document.close();
}

// Initialize everything when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    NavigationManager.init();
    WordDataManager.init();
    SpeechManager.init();

    // Set up global functions for HTML onclick attributes
    window.toggleTheme = () => ThemeManager.toggleTheme();
    window.toggleMenu = () => NavigationManager.toggleMenu();
    window.fetchWordData = () => WordDataManager.fetchWordData();
    window.playPronunciation = () => SpeechManager.playPronunciation();
    window.openSearchHistory = openSearchHistory;
});