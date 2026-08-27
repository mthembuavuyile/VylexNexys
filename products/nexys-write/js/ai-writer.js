// ============================================================================
// ai-writer.js - Nexys Write AI Studio Controller
// ============================================================================

(function() {
    'use strict';

    let chatHistory = [];
    let lastGeneratedResult = '';
    let selectedRange = null;

    document.addEventListener('DOMContentLoaded', initializeAIStudio);

    function initializeAIStudio() {
        if (!window.NexysAI) {
            console.error('[AI Studio] NexysAI SDK not loaded.');
            return;
        }

        setupModelSelector();
        setupQuickActions();
        setupCopilotChat();
        setupAISettings();
        setupSelectionTracker();
        setupQuickFloatingAI();
        setupHeaderBadge();
        updateAIStatusBadge('Ready');
    }

    // ── Helper: Get current text / selection from editor ──
    function getEditorContext() {
        const editor = document.getElementById('editor');
        if (!editor) return { fullText: '', selectedText: '', hasSelection: false };

        const selection = window.getSelection();
        let selectedText = '';

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (editor.contains(range.commonAncestorContainer)) {
                selectedText = selection.toString().trim();
                // Store range for later insertion
                if (selectedText.length > 0) {
                    selectedRange = range.cloneRange();
                }
            }
        }

        const fullText = editor.innerText.trim();
        return {
            fullText,
            selectedText,
            hasSelection: selectedText.length > 0,
            textToProcess: selectedText.length > 0 ? selectedText : fullText
        };
    }

    // ── Helper: Insert or replace text in editor ──
    function insertTextIntoEditor(text, mode = 'append') {
        const editor = document.getElementById('editor');
        if (!editor) return;

        editor.focus();

        if (mode === 'replace_selection' && selectedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(selectedRange);
            document.execCommand('insertHTML', false, formatForEditor(text));
            selectedRange = null;
        } else if (mode === 'replace_all') {
            editor.innerHTML = formatForEditor(text);
        } else if (mode === 'append') {
            const newContent = editor.innerHTML + '<p>' + formatForEditor(text) + '</p>';
            editor.innerHTML = newContent;
        } else if (mode === 'cursor') {
            document.execCommand('insertHTML', false, formatForEditor(text));
        }

        // Trigger analysis update and save
        if (typeof handleAnalysis === 'function') handleAnalysis();
        if (typeof persistNotes === 'function') {
            const activeNote = typeof getActiveNote === 'function' ? getActiveNote() : null;
            if (activeNote) {
                activeNote.content = editor.innerHTML;
                persistNotes();
            }
        }
        showToast('✓ Content applied to document');
    }

    function formatForEditor(text) {
        if (!text) return '';
        // If text contains HTML tags already, return cleaned HTML
        if (text.includes('<p>') || text.includes('<h1>') || text.includes('<ul>') || text.includes('<table>')) {
            return text;
        }
        return renderMarkdown(text);
    }

    function renderMarkdown(text) {
        if (!text) return '';
        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            try {
                return marked.parse(text, { breaks: true, gfm: true });
            } catch (e) {
                console.warn('[Markdown] marked.parse fallback:', e);
            }
        }
        return customMarkdownParser(text);
    }

    function customMarkdownParser(text) {
        if (!text) return '';

        let src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Extract and protect code blocks
        src = src.replace(/```([\s\S]*?)```/g, (match, p1) => {
            return `<pre class="ai-code-block"><code>${escapeHtml(p1.trim())}</code></pre>`;
        });

        const lines = src.split('\n');
        let out = [];
        let inUl = false;
        let inOl = false;
        let tableRows = [];

        function flushList() {
            if (inUl) { out.push('</ul>'); inUl = false; }
            if (inOl) { out.push('</ol>'); inOl = false; }
        }

        function flushTable() {
            if (tableRows.length === 0) return;
            let html = '<div class="ai-table-wrapper"><table class="ai-markdown-table">';
            let headerRow = null;
            let bodyRows = [];

            tableRows.forEach(rowStr => {
                const rawCells = rowStr.split('|').map(c => c.trim());
                // Remove leading/trailing empty cells from border pipes
                if (rawCells.length > 0 && rawCells[0] === '') rawCells.shift();
                if (rawCells.length > 0 && rawCells[rawCells.length - 1] === '') rawCells.pop();

                const isDelimiter = rawCells.every(c => /^:?-+:?$/.test(c));
                if (isDelimiter) return;

                if (headerRow === null) {
                    headerRow = rawCells;
                } else {
                    bodyRows.push(rawCells);
                }
            });

            if (headerRow && headerRow.length > 0) {
                html += '<thead><tr>';
                headerRow.forEach(h => {
                    html += `<th>${inlineFormat(h)}</th>`;
                });
                html += '</tr></thead>';
            }

            if (bodyRows.length > 0) {
                html += '<tbody>';
                bodyRows.forEach(row => {
                    html += '<tr>';
                    row.forEach(cell => {
                        html += `<td>${inlineFormat(cell)}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</tbody>';
            }

            html += '</table></div>';
            out.push(html);
            tableRows = [];
        }

        lines.forEach(line => {
            const trimmed = line.trim();

            // Table row detection
            if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
                flushList();
                tableRows.push(trimmed);
                return;
            } else if (tableRows.length > 0) {
                flushTable();
            }

            // Blank line
            if (!trimmed) {
                flushList();
                return;
            }

            // Horizontal rule / Divider
            if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
                flushList();
                out.push('<hr class="ai-divider">');
                return;
            }

            // Headings
            if (trimmed.startsWith('#### ')) {
                flushList();
                out.push(`<h4>${inlineFormat(trimmed.substring(5))}</h4>`);
                return;
            }
            if (trimmed.startsWith('### ')) {
                flushList();
                out.push(`<h3>${inlineFormat(trimmed.substring(4))}</h3>`);
                return;
            }
            if (trimmed.startsWith('## ')) {
                flushList();
                out.push(`<h2>${inlineFormat(trimmed.substring(3))}</h2>`);
                return;
            }
            if (trimmed.startsWith('# ')) {
                flushList();
                out.push(`<h1>${inlineFormat(trimmed.substring(2))}</h1>`);
                return;
            }

            // Blockquote
            if (trimmed.startsWith('> ')) {
                flushList();
                out.push(`<blockquote>${inlineFormat(trimmed.substring(2))}</blockquote>`);
                return;
            }

            // Unordered list (*, -, +, •)
            if (/^[-*+•]\s+/.test(trimmed)) {
                if (inOl) { out.push('</ol>'); inOl = false; }
                if (!inUl) { out.push('<ul>'); inUl = true; }
                const itemText = trimmed.replace(/^[-*+•]\s+/, '');
                out.push(`<li>${inlineFormat(itemText)}</li>`);
                return;
            }

            // Ordered list (1., 2., etc.)
            if (/^\d+\.\s+/.test(trimmed)) {
                if (inUl) { out.push('</ul>'); inUl = false; }
                if (!inOl) { out.push('<ol>'); inOl = true; }
                const itemText = trimmed.replace(/^\d+\.\s+/, '');
                out.push(`<li>${inlineFormat(itemText)}</li>`);
                return;
            }

            // Regular paragraph
            flushList();
            out.push(`<p>${inlineFormat(trimmed)}</p>`);
        });

        flushList();
        flushTable();

        return out.join('');
    }

    function inlineFormat(text) {
        if (!text) return '';
        let res = escapeHtml(text);
        // Bold + Italic
        res = res.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        res = res.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
        // Bold
        res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        res = res.replace(/__(.*?)__/g, '<strong>$1</strong>');
        // Italic
        res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
        res = res.replace(/_([^_]+)_/g, '<em>$1</em>');
        // Inline code
        res = res.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');
        return res;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ── UI Status & Loading State ──
    function setAILoading(isLoading, statusText = 'Processing...') {
        const loadingIndicator = document.getElementById('ai-loading-indicator');
        const aiStatusPill = document.getElementById('ai-status-pill');
        const aiGenerateBtns = document.querySelectorAll('.ai-action-btn');

        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'flex' : 'none';
            const statusLabel = document.getElementById('ai-loading-text');
            if (statusLabel) statusLabel.textContent = statusText;
        }

        aiGenerateBtns.forEach(btn => {
            btn.disabled = isLoading;
            if (isLoading) btn.classList.add('loading');
            else btn.classList.remove('loading');
        });

        updateAIStatusBadge(isLoading ? 'Thinking...' : 'Ready');
    }

    function updateAIStatusBadge(status) {
        const badge = document.getElementById('header-ai-badge');
        if (badge) {
            if (status === 'Thinking...') {
                badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>AI Thinking</span>';
                badge.className = 'ai-badge thinking';
            } else if (status === 'Error') {
                badge.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>AI Issue</span>';
                badge.className = 'ai-badge error';
            } else {
                badge.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> <span>AI Active</span>';
                badge.className = 'ai-badge ready';
            }
        }
    }

    // ── Quick AI Actions ──
    function setupQuickActions() {
        // Improve Writing Action
        const improveBtn = document.getElementById('ai-improve-btn');
        if (improveBtn) {
            improveBtn.addEventListener('click', async () => {
                const ctx = getEditorContext();
                if (!ctx.textToProcess) {
                    showToast('Please type or highlight some text to improve.');
                    return;
                }

                const toneSelect = document.getElementById('ai-tone-select');
                const tone = toneSelect ? toneSelect.value : 'academic';
                const customInstructions = document.getElementById('ai-custom-guidelines')?.value || '';

                try {
                    setAILoading(true, `Refining text in ${tone} tone...`);
                    const res = await window.NexysAI.improveWriting(ctx.textToProcess, {
                        tone,
                        instructions: customInstructions
                    });
                    displayAIResult(res.content, {
                        title: `Improved Writing (${tone})`,
                        hasSelection: ctx.hasSelection,
                        modelUsed: res.modelUsed
                    });
                } catch (err) {
                    handleAIError(err);
                } finally {
                    setAILoading(false);
                }
            });
        }

        // Summarize Action
        const summarizeBtn = document.getElementById('ai-summarize-btn');
        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', async () => {
                const ctx = getEditorContext();
                if (!ctx.textToProcess) {
                    showToast('Please type or highlight some text to summarize.');
                    return;
                }

                const formatSelect = document.getElementById('ai-summary-format');
                const format = formatSelect ? formatSelect.value : 'bullets';

                try {
                    setAILoading(true, 'Generating smart summary...');
                    const res = await window.NexysAI.summarize(ctx.textToProcess, { format });
                    displayAIResult(res.content, {
                        title: `Summary (${format})`,
                        hasSelection: ctx.hasSelection,
                        modelUsed: res.modelUsed
                    });
                } catch (err) {
                    handleAIError(err);
                } finally {
                    setAILoading(false);
                }
            });
        }

        // Continue Writing Action
        const continueBtn = document.getElementById('ai-continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', async () => {
                const ctx = getEditorContext();
                if (!ctx.textToProcess) {
                    showToast('Please write some initial thoughts or outline for AI to continue.');
                    return;
                }

                const promptInput = document.getElementById('ai-continue-prompt');
                const instructions = promptInput ? promptInput.value : '';

                try {
                    setAILoading(true, 'Continuing your writing...');
                    const res = await window.NexysAI.continueWriting(ctx.textToProcess, { instructions });
                    displayAIResult(res.content, {
                        title: 'Generated Continuation',
                        hasSelection: ctx.hasSelection,
                        modelUsed: res.modelUsed,
                        defaultAction: 'append'
                    });
                } catch (err) {
                    handleAIError(err);
                } finally {
                    setAILoading(false);
                }
            });
        }

        // Academic Critique Action
        const critiqueBtn = document.getElementById('ai-critique-btn');
        if (critiqueBtn) {
            critiqueBtn.addEventListener('click', async () => {
                const ctx = getEditorContext();
                if (!ctx.textToProcess) {
                    showToast('Please write or highlight text to critique.');
                    return;
                }

                try {
                    setAILoading(true, 'Conducting academic critique...');
                    const res = await window.NexysAI.academicCritique(ctx.textToProcess);
                    displayAIResult(res.content, {
                        title: 'Academic Peer Review',
                        hasSelection: ctx.hasSelection,
                        modelUsed: res.modelUsed,
                        isCritique: true
                    });
                } catch (err) {
                    handleAIError(err);
                } finally {
                    setAILoading(false);
                }
            });
        }

        // Outline Generator Action
        const outlineBtn = document.getElementById('ai-outline-btn');
        if (outlineBtn) {
            outlineBtn.addEventListener('click', async () => {
                const topicInput = document.getElementById('ai-outline-topic');
                const topic = topicInput?.value.trim() || getEditorContext().textToProcess;

                if (!topic) {
                    showToast('Please enter a topic or topic keywords.');
                    return;
                }

                const depthSelect = document.getElementById('ai-outline-depth');
                const depth = depthSelect ? depthSelect.value : 'detailed';

                try {
                    setAILoading(true, 'Generating structured outline...');
                    const res = await window.NexysAI.generateOutline(topic, { depth });
                    displayAIResult(res.content, {
                        title: `Document Outline (${depth})`,
                        hasSelection: false,
                        modelUsed: res.modelUsed
                    });
                } catch (err) {
                    handleAIError(err);
                } finally {
                    setAILoading(false);
                }
            });
        }
    }

    // ── Result Display Container ──
    function displayAIResult(content, meta = {}) {
        lastGeneratedResult = content;
        const resultContainer = document.getElementById('ai-result-card');
        const resultContent = document.getElementById('ai-result-text');
        const resultTitle = document.getElementById('ai-result-title');
        const resultModel = document.getElementById('ai-result-model');
        const replaceBtn = document.getElementById('ai-apply-replace-btn');

        if (!resultContainer || !resultContent) return;

        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (resultTitle) resultTitle.textContent = meta.title || 'AI Result';
        const modelLabel = window.NexysAI && typeof window.NexysAI.getModelDisplayName === 'function'
            ? window.NexysAI.getModelDisplayName(meta.modelUsed)
            : (meta.modelUsed || 'AI Model');
        if (resultModel) resultModel.textContent = `Generated with ${modelLabel}`;

        resultContent.innerHTML = formatMarkdownDisplay(content);

        if (replaceBtn) {
            replaceBtn.textContent = meta.hasSelection ? 'Replace Selected' : 'Replace All Content';
        }

        // Setup Result Action Buttons
        setupResultActionButtons(meta);
    }

    function formatMarkdownDisplay(text) {
        return renderMarkdown(text);
    }

    function setupResultActionButtons(meta) {
        const replaceBtn = document.getElementById('ai-apply-replace-btn');
        const insertBtn = document.getElementById('ai-apply-insert-btn');
        const copyBtn = document.getElementById('ai-apply-copy-btn');
        const discardBtn = document.getElementById('ai-apply-discard-btn');

        if (replaceBtn) {
            replaceBtn.onclick = () => {
                if (meta.hasSelection && selectedRange) {
                    insertTextIntoEditor(lastGeneratedResult, 'replace_selection');
                } else {
                    insertTextIntoEditor(lastGeneratedResult, 'replace_all');
                }
            };
        }

        if (insertBtn) {
            insertBtn.onclick = () => {
                insertTextIntoEditor(lastGeneratedResult, 'append');
            };
        }

        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(lastGeneratedResult).then(() => {
                    showToast('✓ Copied to clipboard');
                }).catch(() => {
                    showToast('Failed to copy');
                });
            };
        }

        if (discardBtn) {
            discardBtn.onclick = () => {
                document.getElementById('ai-result-card')?.classList.add('hidden');
            };
        }
    }

    // ── Interactive Copilot Chat ──
    function setupCopilotChat() {
        const chatInput = document.getElementById('ai-chat-input');
        const chatSendBtn = document.getElementById('ai-chat-send-btn');
        const chatMessages = document.getElementById('ai-chat-messages');
        const chatChips = document.querySelectorAll('.ai-prompt-chip');

        if (!chatSendBtn || !chatInput) return;

        const sendChatMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            chatInput.value = '';
            appendChatMessage('user', message);

            const editorCtx = getEditorContext();
            chatHistory.push({ role: 'user', content: message });

            try {
                setAILoading(true, 'Copilot is writing...');
                const response = await window.NexysAI.chat(chatHistory, {
                    documentContext: editorCtx.fullText
                });

                chatHistory.push({ role: 'assistant', content: response.content });
                appendChatMessage('assistant', response.content, response.modelUsed);
            } catch (err) {
                appendChatMessage('system', `Error: ${err.message}`);
                handleAIError(err);
            } finally {
                setAILoading(false);
            }
        };

        chatSendBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        // Quick prompt chips
        chatChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                if (prompt && chatInput) {
                    chatInput.value = prompt;
                    chatInput.focus();
                }
            });
        });
    }

    function appendChatMessage(role, text, modelUsed = '') {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-chat-msg msg-${role}`;

        let headerHtml = '';
        if (role === 'assistant') {
            const modelLabel = modelUsed && window.NexysAI && typeof window.NexysAI.getModelDisplayName === 'function'
                ? window.NexysAI.getModelDisplayName(modelUsed)
                : (modelUsed ? (modelUsed.split('/')[1] || modelUsed).replace(':free', '') : '');
            headerHtml = `
                <div class="msg-header">
                    <span class="msg-author"><i class="fas fa-wand-magic-sparkles"></i> Nexys Copilot</span>
                    ${modelLabel ? `<span class="msg-model">${escapeHtml(modelLabel)}</span>` : ''}
                </div>
            `;
        } else if (role === 'user') {
            headerHtml = `
                <div class="msg-header">
                    <span class="msg-author"><i class="fas fa-user"></i> You</span>
                </div>
            `;
        }

        let bodyHtml = `<div class="msg-body">${formatMarkdownDisplay(text)}</div>`;

        let actionsHtml = '';
        if (role === 'assistant') {
            actionsHtml = `
                <div class="msg-actions">
                    <button class="msg-action-btn insert-btn" title="Insert into Editor"><i class="fas fa-arrow-down"></i> Insert</button>
                    <button class="msg-action-btn copy-btn" title="Copy"><i class="fas fa-copy"></i> Copy</button>
                </div>
            `;
        }

        msgDiv.innerHTML = `${headerHtml}${bodyHtml}${actionsHtml}`;

        if (role === 'assistant') {
            const insBtn = msgDiv.querySelector('.insert-btn');
            const cpBtn = msgDiv.querySelector('.copy-btn');

            if (insBtn) {
                insBtn.onclick = () => insertTextIntoEditor(text, 'append');
            }
            if (cpBtn) {
                cpBtn.onclick = () => {
                    navigator.clipboard.writeText(text).then(() => showToast('✓ Copied response'));
                };
            }
        }

        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    // ── AI Model & Settings Drawer ──
    function setupModelSelector() {
        const selector = document.getElementById('ai-engine-select');
        if (!selector) return;

        const models = window.NexysAI.getAvailableModels();
        const currentModel = window.NexysAI.getModel();

        selector.innerHTML = '';
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.name} (${m.badge})`;
            if (m.id === currentModel) opt.selected = true;
            selector.appendChild(opt);
        });

        selector.addEventListener('change', () => {
            window.NexysAI.setModel(selector.value);
            showToast(`✓ Model switched to ${selector.options[selector.selectedIndex].text}`);
        });
    }

    function setupAISettings() {
        const apiKeyInput = document.getElementById('ai-settings-apikey');
        const saveKeyBtn = document.getElementById('ai-save-key-btn');
        const testConnBtn = document.getElementById('ai-test-conn-btn');
        const connStatus = document.getElementById('ai-conn-status');
        const tempSlider = document.getElementById('ai-settings-temp');
        const tempValue = document.getElementById('ai-temp-val');
        const backendUrlInput = document.getElementById('ai-settings-backend');

        // Populate initial values
        if (apiKeyInput) apiKeyInput.value = window.NexysAI.getApiKey();
        if (tempSlider) {
            tempSlider.value = window.NexysAI.config.temperature || 0.7;
            if (tempValue) tempValue.textContent = tempSlider.value;
        }
        if (backendUrlInput) backendUrlInput.value = window.NexysAI.config.backendUrl || '';

        // Save Key
        if (saveKeyBtn && apiKeyInput) {
            saveKeyBtn.addEventListener('click', () => {
                const key = apiKeyInput.value.trim();
                window.NexysAI.setApiKey(key);
                showToast('✓ AI API Key saved');
            });
        }

        // Temperature Slider
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', () => {
                tempValue.textContent = tempSlider.value;
                window.NexysAI.saveConfig({ temperature: parseFloat(tempSlider.value) });
            });
        }

        // Backend URL
        if (backendUrlInput) {
            backendUrlInput.addEventListener('change', () => {
                window.NexysAI.saveConfig({ backendUrl: backendUrlInput.value.trim() });
                showToast('✓ Backend Proxy URL updated');
            });
        }

        // Test Connection
        if (testConnBtn) {
            testConnBtn.addEventListener('click', async () => {
                if (connStatus) {
                    connStatus.textContent = 'Testing connection...';
                    connStatus.className = 'status-testing';
                }

                try {
                    const keyToTest = apiKeyInput ? apiKeyInput.value.trim() : null;
                    const res = await window.NexysAI.testConnection(keyToTest);
                    if (connStatus) {
                        connStatus.textContent = `✓ Connected (${res.modelUsed})`;
                        connStatus.className = 'status-success';
                    }
                    showToast('✓ OpenRouter Connection Verified');
                } catch (err) {
                    if (connStatus) {
                        connStatus.textContent = `✕ Failed: ${err.message}`;
                        connStatus.className = 'status-error';
                    }
                    showToast('Connection failed: ' + err.message);
                }
            });
        }
    }

    // ── Selection Tracker & Quick Floating AI ──
    function setupSelectionTracker() {
        const editor = document.getElementById('editor');
        if (!editor) return;

        editor.addEventListener('mouseup', () => {
            const ctx = getEditorContext();
            const floatingBtn = document.getElementById('ai-floating-trigger');
            if (floatingBtn) {
                if (ctx.hasSelection && ctx.selectedText.length > 5) {
                    floatingBtn.classList.remove('hidden');
                } else {
                    floatingBtn.classList.add('hidden');
                }
            }
        });
    }

    function setupQuickFloatingAI() {
        const floatingBtn = document.getElementById('ai-floating-trigger');
        if (!floatingBtn) return;

        floatingBtn.addEventListener('click', () => {
            // Open sidebar AI panel
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('collapsed');

            const aiTabBtn = document.querySelector('.sidebar-tab[data-target="ai-panel"]');
            if (aiTabBtn) aiTabBtn.click();
        });
    }

    function setupHeaderBadge() {
        const headerBadge = document.getElementById('header-ai-badge');
        if (!headerBadge) return;

        headerBadge.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('collapsed');

            const aiTabBtn = document.querySelector('.sidebar-tab[data-target="ai-panel"]');
            if (aiTabBtn) aiTabBtn.click();
        });
    }

    // ── Error Handler ──
    function handleAIError(err) {
        console.error('[AI Studio Error]:', err);
        updateAIStatusBadge('Error');
        showToast(`AI Error: ${err.message}`);

        const resultCard = document.getElementById('ai-result-card');
        const resultContent = document.getElementById('ai-result-text');
        if (resultCard && resultContent) {
            resultCard.classList.remove('hidden');
            resultContent.innerHTML = `<div class="ai-error-box"><i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong> ${escapeHtml(err.message)}</div>`;
        }
    }

})();
