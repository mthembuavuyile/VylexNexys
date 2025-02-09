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
        // Load saved theme from localStorage
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
            
            if (nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !hamburger.contains(e.target)) {
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
    },

    async translateWord(word, targetLang) {
        try {
            const response = await axios.get(
                `https://api.mymemory.translated.net/get?q=${word}&langpair=en|${targetLang}`
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
            document.getElementById(id).innerHTML = '';
        });
        this.error.style.display = 'none';
    },

    async fetchWordData() {
        const word = document.getElementById('wordInput').value.toLowerCase().trim();
        
        this.resetResults();

        if (!word) {
            this.showError('Please enter a word to search');
            return;
        }

        this.loading.style.display = 'block';

        try {
            const response = await this.fetchFromWordsAPI(word);
            this.displayResults(response);
            await this.fetchAndDisplayRhymes(word);
        } catch (error) {
            this.showError('Word not found or error occurred');
            console.error('Error:', error);
        } finally {
            this.loading.style.display = 'none';
        }
    },

    async fetchFromWordsAPI(word) {
        const settings = {
            url: `https://wordsapiv1.p.rapidapi.com/words/${word}`,
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
                url: `https://wordsapiv1.p.rapidapi.com/words/${word}/rhymes`,
                method: 'GET',
                headers: {
                    'x-rapidapi-key': this.apiKey,
                    'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
                }
            });

            const rhymeList = document.getElementById('rhymeList');
            if (response.rhymes && response.rhymes.all) {
                // Filter out rhymes that are too dissimilar
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
        // Filter rhymes based on similarity to the original word
        return rhymes.filter(rhyme => {
            // Remove rhymes that are just the original word with a prefix
            if (rhyme.endsWith(originalWord)) return false;
            
            // Calculate the common ending length
            let commonEndingLength = 0;
            for (let i = 1; i <= Math.min(originalWord.length, rhyme.length); i++) {
                if (originalWord.slice(-i) === rhyme.slice(-i)) {
                    commonEndingLength = i;
                } else {
                    break;
                }
            }

            // Require at least 2 characters of common ending
            // and the rhyme should not be more than twice the length of the original word
            return commonEndingLength >= 2 && rhyme.length <= originalWord.length * 2;
        }).slice(0, 10); // Limit to 10 rhymes
    },

    displayResults(data) {
        // Display definitions
        const definitionList = document.getElementById('definitionList');
        if (data.results) {
            data.results.forEach(result => {
                if (result.definition) {
                    const li = document.createElement('li');
                    li.textContent = result.definition;
                    definitionList.appendChild(li);
                }
            });
        }

        // Display synonyms
        const synonymList = document.getElementById('synonymList');
        if (data.results) {
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

        // Display etymology
        const etymology = document.getElementById('etymology');
    if (data.etymology) {
        // Handle single etymology
        if (typeof data.etymology === 'string') {
            etymology.textContent = data.etymology;
        }
        // Handle multiple etymologies
        else if (Array.isArray(data.etymology)) {
            etymology.innerHTML = data.etymology
                .map(etym => `<p>${etym}</p>`)
                .join('');
        }
    } else {
        etymology.textContent = 'Etymology not available';
    }

        // Display examples
        const examples = document.getElementById('examples');
        if (data.results) {
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

        // Display pronunciation
        if (data.pronunciation) {
            document.getElementById('pronunciation').textContent = 
                typeof data.pronunciation === 'string' ? data.pronunciation : data.pronunciation.all;
        }

        // Display phonetic
        if (data.results) {
            const phonetic = document.getElementById('phonetic');
            data.results.forEach(result => {
                if (result.phonetic) {
                    phonetic.textContent = result.phonetic;
                }
            });
        }
    },

    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
    },

    setupEventListeners() {
        document.getElementById('wordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fetchWordData();
            }
        });
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
        voiceSelect.innerHTML = '';

        this.voices.forEach((voice, index) => {
            const option = new Option(`${voice.name} (${voice.lang})`, index);
            voiceSelect.options.add(option);
        });
    },

    playPronunciation() {
        const word = document.getElementById('wordInput').value;
        
        if (!word) {
            alert('Please enter a word');
            return;
        }

        const voiceIndex = document.getElementById('voiceSelect').value;
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
});
