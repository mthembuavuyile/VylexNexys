// ============================================================================
// speech.js - Speech Synthesis Service
// ============================================================================

// State for Speech Synthesis
const SPEECH_STATE = {
    voices: [],
    selectedVoice: null
};

/**
 * Initializes the Speech Synthesis API and loads available voices.
 */
function initializeSpeech() {
    if (!('speechSynthesis' in window)) {
        console.warn("Speech Synthesis not supported.");
        [DOM.btnReadAloud, DOM.btnVoiceSettings].forEach(btn => btn.disabled = true);
        DOM.currentVoiceSpan.textContent = "Not supported";
        return;
    }

    const loadVoices = () => {
        SPEECH_STATE.voices = speechSynthesis.getVoices();
        if (SPEECH_STATE.voices.length > 0) {
            populateVoiceList();
            setDefaultVoice();
        }
    };

    if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
    } else {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

/**
 * Populates the voice selection list in the modal.
 */
function populateVoiceList() {
    DOM.voiceList.innerHTML = '';
    SPEECH_STATE.voices.forEach(voice => {
        const voiceItem = document.createElement('div');
        voiceItem.className = 'voice-item';
        voiceItem.dataset.name = voice.name;
        voiceItem.innerHTML = `${voice.name} <span class="voice-item-lang">(${voice.lang})</span>`;
        DOM.voiceList.appendChild(voiceItem);
    });
}

/**
 * Sets a default voice, preferring common high-quality English voices.
 */
function setDefaultVoice() {
    const preferredVoices = [
        'Google UK English Female', 'Microsoft Zira - English (United States)', 'Google US English', 
        'Microsoft Hazel - English (Great Britain)'
    ];
    SPEECH_STATE.selectedVoice = SPEECH_STATE.voices.find(v => preferredVoices.includes(v.name)) ||
                                SPEECH_STATE.voices.find(v => v.lang.startsWith('en')) ||
                                SPEECH_STATE.voices[0];
    updateSelectedVoiceUI();
}

/**
 * Handles the user clicking on a voice in the selection modal.
 * @param {Event} e The click event.
 */
function handleVoiceSelection(e) {
    const clickedItem = e.target.closest('.voice-item');
    if (!clickedItem) return;

    SPEECH_STATE.selectedVoice = SPEECH_STATE.voices.find(voice => voice.name === clickedItem.dataset.name);
    updateSelectedVoiceUI();
    toggleModal(DOM.voiceModalOverlay, false); // Uses shared helper from app.js
}

/**
 * Updates the UI to reflect the currently selected voice.
 */
function updateSelectedVoiceUI() {
    if (!SPEECH_STATE.selectedVoice) {
        DOM.currentVoiceSpan.textContent = "No Voice";
        return;
    }
    DOM.currentVoiceSpan.textContent = SPEECH_STATE.selectedVoice.name;
    DOM.voiceList.querySelectorAll('.voice-item').forEach(item => {
        item.classList.toggle('active', item.dataset.name === SPEECH_STATE.selectedVoice.name);
    });
}

/**
 * Toggles the text-to-speech function on or off.
 */
function toggleReadAloud() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        return;
    }

    const text = DOM.textInput.value.trim();
    if (!text || !SPEECH_STATE.selectedVoice) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = SPEECH_STATE.selectedVoice;
    utterance.onstart = () => {
        DOM.readAloudText.textContent = 'Stop Reading';
        DOM.btnReadAloud.classList.add('active');
    };
    utterance.onend = () => {
        DOM.readAloudText.textContent = 'Read Aloud';
        DOM.btnReadAloud.classList.remove('active');
    };
    utterance.onerror = (e) => {
        console.error("SpeechSynthesisUtterance.onerror", e);
        DOM.readAloudText.textContent = 'Read Aloud';
        DOM.btnReadAloud.classList.remove('active');
    };

    speechSynthesis.speak(utterance);
}
