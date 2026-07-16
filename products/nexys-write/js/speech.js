// ============================================================================
// speech.js - Speech Synthesis Service
// ============================================================================

const SPEECH_STATE = {
    voices: [],
    selectedVoice: null
};

function initializeSpeech() {
    const btnReadAloud = document.getElementById('btn-read-aloud');
    const btnVoiceSettings = document.getElementById('btn-voice-settings');
    const currentVoiceSpan = document.getElementById('current-voice');
    
    if (!('speechSynthesis' in window)) {
        console.warn("Speech Synthesis not supported.");
        if(btnReadAloud) btnReadAloud.disabled = true;
        if(btnVoiceSettings) btnVoiceSettings.disabled = true;
        if(currentVoiceSpan) currentVoiceSpan.textContent = "Not supported";
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

    // Events
    if(btnReadAloud) btnReadAloud.addEventListener('click', toggleReadAloud);
    if(btnVoiceSettings) {
        btnVoiceSettings.addEventListener('click', () => {
            const overlay = document.getElementById('voice-modal-overlay');
            if(overlay) toggleModal(overlay, true);
        });
    }

    const voiceList = document.getElementById('voice-list');
    if(voiceList) {
        voiceList.addEventListener('click', handleVoiceSelection);
    }
}

function populateVoiceList() {
    const voiceList = document.getElementById('voice-list');
    if(!voiceList) return;
    
    voiceList.innerHTML = '';
    SPEECH_STATE.voices.forEach(voice => {
        const voiceItem = document.createElement('div');
        voiceItem.className = 'voice-item';
        voiceItem.dataset.name = voice.name;
        voiceItem.innerHTML = `${voice.name} <span class="voice-item-lang">(${voice.lang})</span>`;
        voiceList.appendChild(voiceItem);
    });
}

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

function handleVoiceSelection(e) {
    const clickedItem = e.target.closest('.voice-item');
    if (!clickedItem) return;

    SPEECH_STATE.selectedVoice = SPEECH_STATE.voices.find(voice => voice.name === clickedItem.dataset.name);
    updateSelectedVoiceUI();
    
    const overlay = document.getElementById('voice-modal-overlay');
    if(overlay) toggleModal(overlay, false);
}

function updateSelectedVoiceUI() {
    const currentVoiceSpan = document.getElementById('current-voice');
    const voiceList = document.getElementById('voice-list');
    
    if (!SPEECH_STATE.selectedVoice) {
        if(currentVoiceSpan) currentVoiceSpan.textContent = "No Voice";
        return;
    }
    
    if(currentVoiceSpan) currentVoiceSpan.textContent = SPEECH_STATE.selectedVoice.name;
    
    if(voiceList) {
        voiceList.querySelectorAll('.voice-item').forEach(item => {
            item.classList.toggle('active', item.dataset.name === SPEECH_STATE.selectedVoice.name);
        });
    }
}

function toggleReadAloud() {
    const btnReadAloud = document.getElementById('btn-read-aloud');
    const readAloudText = document.getElementById('read-aloud-text');
    const editor = document.getElementById('editor');
    
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        return;
    }

    const text = editor ? editor.innerText.trim() : '';
    if (!text || !SPEECH_STATE.selectedVoice) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = SPEECH_STATE.selectedVoice;
    utterance.onstart = () => {
        if(readAloudText) readAloudText.textContent = 'Stop';
        if(btnReadAloud) btnReadAloud.classList.add('active');
    };
    utterance.onend = () => {
        if(readAloudText) readAloudText.textContent = 'Read';
        if(btnReadAloud) btnReadAloud.classList.remove('active');
    };
    utterance.onerror = (e) => {
        console.error("SpeechSynthesisUtterance.onerror", e);
        if(readAloudText) readAloudText.textContent = 'Read';
        if(btnReadAloud) btnReadAloud.classList.remove('active');
    };

    speechSynthesis.speak(utterance);
}
