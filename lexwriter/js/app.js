// ============================================================================
// app.js - Core Application Logic & UI Management
// ============================================================================

// Cache DOM Elements for performance - used by all modules
const DOM = {};

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Main initialization function.
 */
function initializeApp() {
    cacheDOMElements();
    setupEventListeners();
    initializeSpeech(); // This function is in speech.js
    handleAnalysis();   // Initial analysis for placeholder text
}

/**
 * Caches all necessary DOM elements into the global DOM object.
 */
function cacheDOMElements() {
    // Main Editor
    DOM.textInput = document.getElementById('text-input');
    // Dashboard Stats
    DOM.wordCount = document.getElementById('word-count');
    DOM.charCount = document.getElementById('char-count');
    DOM.sentenceCount = document.getElementById('sentence-count');
    DOM.paragraphCount = document.getElementById('paragraph-count');
    DOM.readingTime = document.getElementById('reading-time');
    DOM.readabilityScore = document.getElementById('readability-score');
    DOM.longestWord = document.getElementById('longest-word');
    DOM.uniqueWordCount = document.getElementById('unique-word-count');
    DOM.vocabVarietyScore = document.getElementById('vocab-variety-score');
    DOM.avgWordLength = document.getElementById('avg-word-length');
    DOM.avgSentenceLength = document.getElementById('avg-sentence-length');
    DOM.insightText = document.getElementById('insight-text');
    // Definition Modal
    DOM.definitionModal = document.getElementById('definition-modal');
    DOM.modalWord = document.getElementById('modal-word');
    DOM.modalBody = document.getElementById('modal-body');
    DOM.modalCloseBtn = document.getElementById('modal-close-btn');
    // Case Conversion Buttons
    DOM.btnUppercase = document.getElementById('btn-uppercase');
    DOM.btnLowercase = document.getElementById('btn-lowercase');
    DOM.btnSentenceCase = document.getElementById('btn-sentencecase');
    DOM.btnTitleCase = document.getElementById('btn-titlecase');
    // Speech Controls
    DOM.btnReadAloud = document.getElementById('btn-read-aloud');
    DOM.readAloudText = document.getElementById('read-aloud-text');
    DOM.currentVoiceSpan = document.getElementById('current-voice');
    DOM.btnVoiceSettings = document.getElementById('btn-voice-settings');
    // Voice Modal
    DOM.voiceModalOverlay = document.getElementById('voice-modal-overlay');
    DOM.voiceModalClose = document.getElementById('voice-modal-close');
    DOM.voiceList = document.getElementById('voice-list');
}

/**
 * Sets up all the primary event listeners for the application.
 */
function setupEventListeners() {
    DOM.textInput.addEventListener('input', handleAnalysis);
    DOM.textInput.addEventListener('mouseup', handleTextSelection); // In dictionary.js

    DOM.btnUppercase.addEventListener('click', () => convertCase('upper'));
    DOM.btnLowercase.addEventListener('click', () => convertCase('lower'));
    DOM.btnSentenceCase.addEventListener('click', () => convertCase('sentence'));
    DOM.btnTitleCase.addEventListener('click', () => convertCase('title'));

    DOM.btnReadAloud.addEventListener('click', toggleReadAloud); // In speech.js
    DOM.btnVoiceSettings.addEventListener('click', () => toggleModal(DOM.voiceModalOverlay, true));
    DOM.voiceModalClose.addEventListener('click', () => toggleModal(DOM.voiceModalOverlay, false));
    DOM.voiceModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.voiceModalOverlay) toggleModal(DOM.voiceModalOverlay, false);
    });
    DOM.voiceList.addEventListener('click', handleVoiceSelection); // In speech.js

    DOM.modalCloseBtn.addEventListener('click', () => toggleModal(DOM.definitionModal, false));
    DOM.definitionModal.addEventListener('click', (e) => {
        if (e.target === DOM.definitionModal) toggleModal(DOM.definitionModal, false);
    });
    
    DOM.modalBody.addEventListener('change', event => {
        if (event.target.id === 'language-select') {
            handleTranslate(event); // In dictionary.js
        }
    });
}


// ============================================================================
// TEXT ANALYSIS & UI UPDATES
// ============================================================================

function handleAnalysis() {
    const text = DOM.textInput.value;
    if (text.trim() === '') {
        resetUI();
        return;
    }

    const words = text.match(/\b[\w'-]+\b/g) || [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const stats = {
        wordCount: words.length,
        charCount: text.length,
        sentenceCount: sentences.length,
        paragraphCount: text.split(/\n+/).filter(p => p.trim() !== '').length,
    };
    
    stats.readingTime = Math.round(stats.wordCount / 200 * 60);
    stats.longestWord = words.reduce((longest, current) => current.length > longest.length ? current : longest, '');
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    stats.uniqueWordCount = uniqueWords.size;
    stats.vocabVariety = stats.wordCount > 0 ? (stats.uniqueWordCount / stats.wordCount * 100).toFixed(1) : 0;
    const totalWordLength = words.reduce((acc, word) => acc + word.length, 0);
    stats.avgWordLength = stats.wordCount > 0 ? (totalWordLength / stats.wordCount).toFixed(1) : 0;
    stats.avgSentenceLength = stats.sentenceCount > 0 ? (stats.wordCount / stats.sentenceCount).toFixed(1) : 0;
    
    const readability = calculateReadability(words, stats.wordCount, stats.sentenceCount);
    
    updateDashboardUI(stats, readability);
    updateInsights(stats, readability);
}

function calculateReadability(words, wordCount, sentenceCount) {
    if (wordCount === 0 || sentenceCount === 0) return { score: 'N/A', level: 'N/A' };

    const countSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? syllables.length : 1;
    };

    const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
    const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
    const fleschScore = Math.max(0, Math.min(100, score.toFixed(1)));

    let level;
    if (fleschScore >= 90) level = 'Very Easy';
    else if (fleschScore >= 80) level = 'Easy';
    else if (fleschScore >= 70) level = 'Fairly Easy';
    else if (fleschScore >= 60) level = 'Standard';
    else if (fleschScore >= 50) level = 'Fairly Difficult';
    else if (fleschScore >= 30) level = 'Difficult';
    else level = 'Very Difficult';

    return { score: fleschScore, level };
}

function updateDashboardUI(stats, readability) {
    DOM.wordCount.textContent = stats.wordCount;
    DOM.charCount.textContent = stats.charCount;
    DOM.sentenceCount.textContent = stats.sentenceCount;
    DOM.paragraphCount.textContent = stats.paragraphCount;
    DOM.readingTime.textContent = `~${stats.readingTime}s`;
    DOM.readabilityScore.textContent = `${readability.score} (${readability.level})`;
    DOM.longestWord.textContent = stats.longestWord || '-';
    DOM.uniqueWordCount.textContent = stats.uniqueWordCount;
    DOM.vocabVarietyScore.textContent = `${stats.vocabVariety}%`;
    DOM.avgWordLength.textContent = stats.avgWordLength;
    DOM.avgSentenceLength.textContent = `${stats.avgSentenceLength} words`;
}

function resetUI() {
    updateDashboardUI({
        wordCount: 0, charCount: 0, sentenceCount: 0, paragraphCount: 0,
        readingTime: 0, longestWord: '-', uniqueWordCount: 0,
        vocabVariety: 0, avgWordLength: 0, avgSentenceLength: 0
    }, { score: 'N/A', level: 'N/A' });
    DOM.insightText.textContent = 'Start writing to get feedback!';
}

function updateInsights(stats, readability) {
    if (stats.avgSentenceLength > 25) DOM.insightText.textContent = "Your sentences are quite long. Consider breaking them up for better readability.";
    else if (stats.avgSentenceLength < 8 && stats.avgSentenceLength > 0) DOM.insightText.textContent = "Your sentences are very short. Varying sentence length can make your writing more engaging.";
    else if (readability.score < 30) DOM.insightText.textContent = "This text may be hard to read. Try using simpler words and shorter sentences.";
    else if (readability.score > 90) DOM.insightText.textContent = "This text is very easy to read. Great for a broad audience!";
    else DOM.insightText.textContent = "Your writing stats look good. Keep it up!";
}

// ============================================================================
// TEXT TRANSFORMATION
// ============================================================================

function convertCase(type) {
    let text = DOM.textInput.value;
    switch (type) {
        case 'upper': text = text.toUpperCase(); break;
        case 'lower': text = text.toLowerCase(); break;
        case 'sentence': text = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); break;
        case 'title': text = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
    }
    DOM.textInput.value = text;
    handleAnalysis();
}

// ============================================================================
// SHARED HELPER FUNCTIONS
// ============================================================================

/**
 * Shows or hides a modal element.
 * @param {HTMLElement} modalElement The modal to toggle.
 * @param {boolean} show True to show, false to hide.
 */
function toggleModal(modalElement, show) {
    modalElement.classList.toggle('hidden', !show);
}

/**
 * Plays an audio file from a URL. Must be global for onclick attribute.
 * @param {string} url The URL of the audio file.
 */
function playAudio(url) {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Error playing audio:", e));
}
