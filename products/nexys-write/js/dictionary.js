// ============================================================================
// dictionary.js - Definition Lookup & Translation Service
// ============================================================================

const DICT_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    if (editor) {
        // Desktop double click
        editor.addEventListener('dblclick', handleDoubleClick);

        // Mobile double tap
        let lastTapTime = 0;
        editor.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            
            if (tapLength < 400 && tapLength > 0) {
                // Double tap detected
                // Slight delay to allow the browser to complete the text selection
                setTimeout(() => {
                    handleDoubleClick(e);
                }, 100);
            }
            lastTapTime = currentTime;
        });
    }
    
    // Close modal via close button handled in app.js
});

async function handleDoubleClick(e) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    let word = selection.toString().trim();
    // Clean up punctuation attached to the word
    word = word.replace(/[^\w'-]/g, '');

    if (word.length < 2 || word.length > 30 || /\s/.test(word)) return;

    // Show modal immediately with loading state
    const modal = document.getElementById('definition-modal');
    const modalWord = document.getElementById('modal-word');
    const modalBody = document.getElementById('modal-body');
    
    modalWord.textContent = word;
    modalBody.innerHTML = '<div class="loader"></div>';
    
    if (typeof toggleModal === 'function') toggleModal(modal, true);
    else modal.classList.remove('hidden');

    try {
        const response = await fetch(DICT_API_URL + encodeURIComponent(word));
        if (!response.ok) throw new Error('Not found');
        
        const data = await response.json();
        renderDefinition(data[0]);
    } catch (error) {
        modalBody.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">No definition found for "<strong>${word}</strong>".</p>`;
    }
}

function renderDefinition(data) {
    const modalBody = document.getElementById('modal-body');
    let html = '';

    // Phonetics and Audio
    const phonetic = data.phonetics?.find(p => p.text && p.audio) || data.phonetics?.find(p => p.text) || {};
    
    html += `<div id="phonetic-display" style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">`;
    if (phonetic.text) {
        html += `<span style="color: var(--text-muted); font-family: var(--font-mono);">${phonetic.text}</span>`;
    }
    if (phonetic.audio) {
        html += `<button onclick="playAudio('${phonetic.audio}')" style="background: var(--toolbar-hover); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; color: var(--accent); display: flex; align-items: center; justify-content: center;" title="Listen"><i class="fas fa-volume-up"></i></button>`;
    }
    html += `</div>`;

    // Meanings
    data.meanings.forEach(meaning => {
        html += `<h3 style="color: var(--accent); font-size: 14px; margin-top: 16px; margin-bottom: 8px; text-transform: capitalize;">${meaning.partOfSpeech}</h3>`;
        html += `<ol style="margin-left: 20px; font-size: 14px; margin-bottom: 12px; color: var(--text-main);">`;
        meaning.definitions.slice(0, 3).forEach(def => { // Limit to 3 definitions per part of speech
            html += `<li style="margin-bottom: 6px;">${def.definition}</li>`;
            if (def.example) {
                html += `<div style="color: var(--text-muted); font-style: italic; font-size: 13px; margin-bottom: 6px;">"${def.example}"</div>`;
            }
        });
        html += `</ol>`;
        
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            html += `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">`;
            html += `<span style="font-size: 12px; color: var(--text-muted);">Synonyms:</span>`;
            meaning.synonyms.slice(0, 5).forEach(syn => {
                html += `<span style="background: var(--bg-main); border: 1px solid var(--border); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${syn}</span>`;
            });
            html += `</div>`;
        }
    });

    modalBody.innerHTML = html;
}
