// ============================================================================
// tools.js - Find & Replace, Text Cleaner, Case Converter
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Find & Replace
    const applyReplaceBtn = document.getElementById('applyReplaceBtn');
    if(applyReplaceBtn) {
        applyReplaceBtn.addEventListener('click', applyReplace);
    }

    // Case Converter
    const caseButtons = {
        'btn-uppercase': 'upper',
        'btn-lowercase': 'lower',
        'btn-titlecase': 'title',
        'btn-sentencecase': 'sentence'
    };

    for (const [id, type] of Object.entries(caseButtons)) {
        const btn = document.getElementById(id);
        if(btn) {
            btn.addEventListener('click', () => convertCase(type));
        }
    }
});

function applyReplace() {
    const editorEl = document.getElementById('editor');
    if (!editorEl) return;

    const findStr = document.getElementById('findInput').value;
    const replaceStr = document.getElementById('replaceInput').value;
    const isCaseSensitive = document.getElementById('caseSensitive').checked;

    if (!findStr) {
        showToast('Please enter a search term');
        return;
    }

    let text = editorEl.innerHTML;
    // VERY Basic HTML find and replace that avoids replacing inside tags (heuristic approach)
    // A better approach would traverse text nodes, but for a simple tool, we use a regex that skips tags
    // Or we just replace innerText and rewrite, but that loses formatting.
    // For this simple suite, we'll traverse text nodes if we want to be safe.
    
    let matchCount = 0;
    const regex = new RegExp(escapeRegex(findStr), isCaseSensitive ? 'g' : 'gi');

    // Walk text nodes
    const walk = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let n;
    while(n = walk.nextNode()) textNodes.push(n);

    textNodes.forEach(node => {
        if (regex.test(node.nodeValue)) {
            const matches = node.nodeValue.match(regex);
            matchCount += matches ? matches.length : 0;
            node.nodeValue = node.nodeValue.replace(regex, replaceStr);
        }
    });

    if (matchCount > 0) {
        showToast(`Replaced ${matchCount} occurrence(s)`);
        // Trigger save and analysis
        editorEl.dispatchEvent(new Event('input'));
    } else {
        showToast('No matches found');
    }
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convertCase(type) {
    const editorEl = document.getElementById('editor');
    if (!editorEl) return;
    
    // We only convert selected text if there's a selection, else the whole text
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed && editorEl.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const text = range.toString();
        let result = text;
        
        switch (type) {
            case 'upper': result = text.toUpperCase(); break;
            case 'lower': result = text.toLowerCase(); break;
            case 'title': result = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
            case 'sentence': result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); break;
        }
        
        document.execCommand('insertText', false, result);
    } else {
        // Fallback: convert everything (loses formatting if we just replace innerHTML, so we'll walk text nodes)
        const walk = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let n;
        while(n = walk.nextNode()) textNodes.push(n);

        textNodes.forEach(node => {
            let text = node.nodeValue;
            switch (type) {
                case 'upper': text = text.toUpperCase(); break;
                case 'lower': text = text.toLowerCase(); break;
                case 'title': text = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
                case 'sentence': text = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); break;
            }
            node.nodeValue = text;
        });
        showToast('Applied case conversion');
    }
    editorEl.dispatchEvent(new Event('input'));
}

function cleanText(type) {
    const editorEl = document.getElementById('editor');
    if (!editorEl) return;

    let text = editorEl.innerHTML;
    let modified = false;

    if (type === 'html') {
        editorEl.innerHTML = editorEl.innerText; // Strip HTML by replacing with innerText
        modified = true;
    } else {
        // Walk text nodes for safe text modification
        const walk = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let n;
        while(n = walk.nextNode()) textNodes.push(n);

        textNodes.forEach(node => {
            let val = node.nodeValue;
            const oldVal = val;
            
            switch (type) {
                case 'extraSpaces': val = val.replace(/[ \t]+/g, ' '); break;
                case 'emptyLines': val = val.replace(/^\s*[\r\n]/gm, ''); break;
                case 'punctuation': val = val.replace(/[^\w\s]/g, ''); break;
            }
            
            if(val !== oldVal) {
                node.nodeValue = val;
                modified = true;
            }
        });
    }

    if (modified) {
        showToast('Text cleaned');
        editorEl.dispatchEvent(new Event('input'));
    }
}
