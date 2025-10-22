// ============================================================================
// dictionary.js - Definition Lookup & Translation Service
// ============================================================================

const API_CONFIG = {
    // A free API, good as a primary source.
    DICTIONARY_API: {
        BASE_URL: 'https://api.dictionaryapi.dev/api/v2/entries/en/'
    },
    // RapidAPI key is required, used as a premium fallback.
    WORDS_API: {
        KEY: 'f5078a0212mshb1fa8580c4e1506p1b5d08jsn8fde9b6fb27a', // Replace with your key if needed
        BASE_URL: 'https://wordsapiv1.p.rapidapi.com/words',
        HEADERS: {
            'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
        }
    },
    // For etymology and supplemental info.
    WIKTIONARY: {
        BASE_URL: 'https://en.wiktionary.org/w/api.php'
    },
    // For free translations.
    MYMEMORY: {
        BASE_URL: 'https://api.mymemory.translated.net/get'
    }
};

/**
 * Handles the lookup of a selected word.
 */
async function handleTextSelection() {
    const selectedText = window.getSelection().toString().trim().toLowerCase();
    if (selectedText.length < 2 || selectedText.length > 25 || /\s/.test(selectedText)) return;

    toggleModal(DOM.definitionModal, true); // Uses shared helper from app.js
    DOM.modalWord.textContent = selectedText;
    DOM.modalBody.innerHTML = '<div class="loader"></div>';

    try {
        const data = await fetchAndConsolidateWordData(selectedText);
        const html = buildDefinitionHtml(data);
        DOM.modalBody.innerHTML = html;
    } catch (error) {
        console.error('Error fetching word data:', error);
        DOM.modalBody.innerHTML = `<p>Sorry, could not find a definition for "<strong>${selectedText}</strong>". Please check the spelling.</p>`;
    }
}

/**
 * Fetches data from multiple APIs and combines it into one object.
 * @param {string} word The word to look up.
 * @returns {object} A consolidated data object.
 */
async function fetchAndConsolidateWordData(word) {
    const promises = [
        fetchFromApi(API_CONFIG.DICTIONARY_API.BASE_URL + word),
        fetchFromApi(`${API_CONFIG.WORDS_API.BASE_URL}/${word}`, {
            headers: { ...API_CONFIG.WORDS_API.HEADERS, 'x-rapidapi-key': API_CONFIG.WORDS_API.KEY }
        }),
        fetchFromApi(`${API_CONFIG.WIKTIONARY.BASE_URL}?action=query&prop=extracts&format=json&exintro=&titles=${encodeURIComponent(word)}&origin=*`)
    ];

    const [dictApiResult, wordsApiResult, wiktionaryResult] = await Promise.allSettled(promises);

    const consolidated = { word, phoneticText: null, audioUrl: null, meanings: {}, synonyms: new Set(), etymology: null };

    // Process DictionaryAPI (Primary)
    if (dictApiResult.status === 'fulfilled' && dictApiResult.value) {
        const data = dictApiResult.value[0];
        consolidated.word = data.word;
        const phonetic = data.phonetics?.find(p => p.text && p.audio) || data.phonetics?.find(p => p.text);
        if (phonetic) {
            consolidated.phoneticText = phonetic.text;
            consolidated.audioUrl = phonetic.audio;
        }
        data.meanings.forEach(meaning => {
            const pos = meaning.partOfSpeech;
            if (!consolidated.meanings[pos]) consolidated.meanings[pos] = new Set();
            meaning.definitions.forEach(def => consolidated.meanings[pos].add(def.definition));
            meaning.synonyms.forEach(syn => consolidated.synonyms.add(syn));
        });
    }

    // Process WordsAPI (Fallback/Supplement)
    if (wordsApiResult.status === 'fulfilled' && wordsApiResult.value) {
        const data = wordsApiResult.value;
        if (!consolidated.phoneticText && data.pronunciation) {
            consolidated.phoneticText = `/${typeof data.pronunciation === 'object' ? data.pronunciation.all : data.pronunciation}/`;
        }
        data.results?.forEach(result => {
            const pos = result.partOfSpeech;
            if (!consolidated.meanings[pos]) consolidated.meanings[pos] = new Set();
            consolidated.meanings[pos].add(result.definition);
            result.synonyms?.forEach(syn => consolidated.synonyms.add(syn));
        });
    }
    
    // Process Wiktionary for etymology
    if (wiktionaryResult.status === 'fulfilled' && wiktionaryResult.value) {
        const page = Object.values(wiktionaryResult.value.query.pages)[0];
        if (page.extract) {
            consolidated.etymology = page.extract.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
        }
    }

    if (Object.keys(consolidated.meanings).length === 0) {
        throw new Error(`No definitions found for "${word}"`);
    }

    return consolidated;
}

/**
 * Builds the HTML content for the definition modal body.
 * @param {object} data The consolidated word data.
 * @returns {string} The HTML string.
 */
function buildDefinitionHtml(data) {
    let html = `<div id="phonetic-display">`;
    if (data.phoneticText) html += `<span>${data.phoneticText}</span>`;
    if (data.audioUrl) html += `<button onclick="playAudio('${data.audioUrl}')" title="Listen">🔊</button>`; // Uses global helper
    html += `</div>`;

    for (const partOfSpeech in data.meanings) {
        html += `<h3>${partOfSpeech}</h3><ol>`;
        data.meanings[partOfSpeech].forEach(definition => { html += `<li>${definition}</li>`; });
        html += `</ol>`;
    }

    if (data.synonyms.size > 0) {
        html += `<h3>Synonyms</h3><div id="synonyms-list">`;
        data.synonyms.forEach(syn => { html += `<span>${syn}</span>`; });
        html += `</div>`;
    }
    
    if (data.etymology) {
        html += `<h3>Etymology (from Wiktionary)</h3><p id="etymology-content">${data.etymology}</p>`;
    }

    html += `<h3>Translate</h3>
        <div id="translation-section">
            <select id="language-select">
                <option value="">Select Language...</option>
                <option value="af">Afrikaans</option><option value="zu">isiZulu</option><option value="xh">isiXhosa</option>
                <option value="st">Sesotho</option><option value="tn">Setswana</option><option value="nso">Sepedi</option>
                <option value="ve">Tshivenda</option><option value="ts">Xitsonga</option><option value="es">Spanish</option>
                <option value="fr">French</option><option value="de">German</option><option value="it">Italian</option>
            </select>
            <span id="translation-result"></span>
        </div>`;
    return html;
}

/**
 * Handles the translation of the current word in the modal.
 * @param {Event} event The change event from the language select dropdown.
 */
async function handleTranslate(event) {
    const targetLang = event.target.value;
    const word = DOM.modalWord.textContent;
    const resultSpan = document.getElementById('translation-result');
    
    if (!targetLang || !word) {
        resultSpan.textContent = '';
        return;
    }

    resultSpan.textContent = 'Translating...';
    try {
        const url = `${API_CONFIG.MYMEMORY.BASE_URL}?q=${encodeURIComponent(word)}&langpair=en|${targetLang}`;
        const data = await fetchFromApi(url);
        if (data.responseData && data.responseStatus === 200) {
            resultSpan.textContent = data.responseData.translatedText;
        } else {
            throw new Error('Translation failed.');
        }
    } catch (error) {
        console.error('Translation error:', error);
        resultSpan.textContent = `Error`;
    }
}


/**
 * A generic helper to fetch JSON data from an API.
 * @param {string} url The URL to fetch.
 * @param {object} options Optional fetch options.
 * @returns {Promise<object>} The JSON response.
 */
async function fetchFromApi(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
