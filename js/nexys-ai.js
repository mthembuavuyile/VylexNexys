/**
 * ============================================================================
 * Nexys AI - Universal Client SDK
 * ============================================================================
 * Modular, resilient AI client for Vylex Nexys applications.
 * Supports direct OpenRouter API calls with multi-model failover,
 * localStorage key persistence, and seamless proxy routing for future backend migration.
 */

(function(global) {
    'use strict';

    // Default configuration
    const DEFAULT_CONFIG = {
        apiKey: '', // Safe default; user sets key via AI Settings UI or environment proxy
        backendUrl: '', // When populated (e.g. '/api/chat'), calls will route through backend proxy
        defaultModel: 'openrouter/free',
        appName: 'Vylex Nexys AI Studio',
        siteUrl: (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://vylexnexys.co.za',
        temperature: 0.7,
        maxTokens: 2048
    };

    // Storage Keys
    const STORAGE_KEY_API = 'NexysAI_ApiKey';
    const STORAGE_KEY_MODEL = 'NexysAI_SelectedModel';
    const STORAGE_KEY_BACKEND = 'NexysAI_BackendUrl';
    const STORAGE_KEY_TEMP = 'NexysAI_Temperature';

    // Free Model Pool with real, active OpenRouter models and transparent names
    const FREE_MODELS_POOL = [
        { id: 'openrouter/free', name: 'OpenRouter Auto (Best Available)', badge: 'AUTO', desc: 'Automatically routes to the highest-performing available free model' },
        { id: 'google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B', badge: '262K', desc: 'Google frontier instruction and academic writing model' },
        { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B', badge: '262K', desc: 'Fast, high-precision instruction following and editing' },
        { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA Nemotron 3 Ultra 550B', badge: '1M', desc: 'Deep research, complex analysis, and long-context synthesis' },
        { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning', badge: '1M', desc: 'Ultra-fast inference and high-throughput content drafting' },
        { id: 'minimax/minimax-m3:free', name: 'MiniMax M3', badge: '1M', desc: 'High-context general purpose academic model' },
        { id: 'thinkingmachines/inkling:free', name: 'Thinking Machines Inkling', badge: '1M', desc: 'Structured academic writing, argumentation, and outlining' },
        { id: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code', badge: '256K', desc: 'Technical drafting, structured text, and analytical writing' },
        { id: 'z-ai/glm-5.2:free', name: 'Z.ai GLM 5.2', badge: '256K', desc: 'Rigorous factual verification and comprehensive review' },
        { id: 'poolside/laguna-s-2.1:free', name: 'Poolside Laguna S 2.1', badge: '262K', desc: 'Document structuring and precision revision' }
    ];

    class NexysAIService {
        constructor() {
            this.config = { ...DEFAULT_CONFIG };
            this.loadStoredConfig();
            this.listeners = new Set();
        }

        loadStoredConfig() {
            try {
                if (typeof localStorage !== 'undefined') {
                    const storedKey = localStorage.getItem(STORAGE_KEY_API);
                    if (storedKey) this.config.apiKey = storedKey;

                    const storedModel = localStorage.getItem(STORAGE_KEY_MODEL);
                    if (storedModel) this.config.defaultModel = storedModel;

                    const storedBackend = localStorage.getItem(STORAGE_KEY_BACKEND);
                    if (storedBackend) this.config.backendUrl = storedBackend;

                    const storedTemp = localStorage.getItem(STORAGE_KEY_TEMP);
                    if (storedTemp) this.config.temperature = parseFloat(storedTemp) || 0.7;
                }
            } catch (e) {
                console.warn('[NexysAI] Unable to access localStorage:', e);
            }
        }

        saveConfig(updates = {}) {
            Object.assign(this.config, updates);
            try {
                if (typeof localStorage !== 'undefined') {
                    if (updates.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API, this.config.apiKey);
                    if (updates.defaultModel !== undefined) localStorage.setItem(STORAGE_KEY_MODEL, this.config.defaultModel);
                    if (updates.backendUrl !== undefined) localStorage.setItem(STORAGE_KEY_BACKEND, this.config.backendUrl);
                    if (updates.temperature !== undefined) localStorage.setItem(STORAGE_KEY_TEMP, this.config.temperature.toString());
                }
            } catch (e) {
                console.warn('[NexysAI] Error saving config to localStorage:', e);
            }
            this.emitChange();
        }

        getApiKey() {
            return this.config.apiKey || DEFAULT_CONFIG.apiKey;
        }

        setApiKey(key) {
            this.saveConfig({ apiKey: key ? key.trim() : '' });
        }

        getModel() {
            return this.config.defaultModel;
        }

        setModel(modelId) {
            this.saveConfig({ defaultModel: modelId });
        }

        getAvailableModels() {
            return [...FREE_MODELS_POOL];
        }

        getModelDisplayName(modelId) {
            const found = FREE_MODELS_POOL.find(m => m.id === modelId);
            if (found) return found.name;
            if (!modelId) return 'AI Assistant';
            const cleanId = modelId.replace(':free', '').split('/').pop() || modelId;
            return cleanId;
        }

        onConfigChange(callback) {
            this.listeners.add(callback);
            return () => this.listeners.delete(callback);
        }

        emitChange() {
            for (const cb of this.listeners) {
                try { cb(this.config); } catch (err) { console.error(err); }
            }
        }

        /**
         * Core completion method with automatic model failover
         */
        async complete(messages, options = {}) {
            const requestedModel = options.model || this.config.defaultModel;
            const temperature = options.temperature !== undefined ? options.temperature : this.config.temperature;
            const maxTokens = options.maxTokens || this.config.maxTokens;

            // If backend proxy URL is configured, route through backend
            if (this.config.backendUrl) {
                return this.callBackendProxy(messages, { model: requestedModel, temperature, maxTokens });
            }

            // Build model candidates: user's requested model first, followed by remaining pool
            const modelQueue = [requestedModel, ...FREE_MODELS_POOL.map(m => m.id).filter(id => id !== requestedModel)];
            
            return this.executeWithFallback(messages, modelQueue, 0, { temperature, maxTokens });
        }

        async executeWithFallback(messages, modelQueue, index, options) {
            if (index >= modelQueue.length) {
                throw new Error('All AI models in the failover pool were rate-limited or unavailable. Please verify your OpenRouter connection.');
            }

            const currentModel = modelQueue[index];
            const apiKey = this.getApiKey();

            if (!apiKey) {
                throw new Error('OpenRouter API key is missing. Please set your key in AI Settings.');
            }

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': this.config.siteUrl,
                        'X-Title': this.config.appName,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages: messages,
                        temperature: options.temperature,
                        max_tokens: options.maxTokens
                    })
                });

                // Failover on rate-limiting or server errors
                if ([429, 500, 502, 503, 504].includes(response.status)) {
                    console.warn(`[NexysAI] Model '${currentModel}' returned status ${response.status}. Rotating to fallback (${modelQueue[index + 1] || 'none'})...`);
                    return this.executeWithFallback(messages, modelQueue, index + 1, options);
                }

                if (!response.ok) {
                    const errText = await response.text();
                    if (response.status === 401 || response.status === 403) {
                        throw new Error(`OpenRouter Authentication Failed: Please check your API key.`);
                    }
                    throw new Error(`OpenRouter Error (${response.status}): ${errText}`);
                }

                const data = await response.json();
                const choice = data.choices && data.choices[0];
                const content = choice?.message?.content || choice?.text || '';

                return {
                    content: content.trim(),
                    modelUsed: currentModel,
                    usage: data.usage || null,
                    raw: data
                };
            } catch (err) {
                if (err.name === 'TypeError' || err.message.includes('fetch')) {
                    if (index + 1 < modelQueue.length) {
                        console.warn(`[NexysAI] Network failure on ${currentModel}. Retrying fallback...`);
                        return this.executeWithFallback(messages, modelQueue, index + 1, options);
                    }
                }
                throw err;
            }
        }

        async callBackendProxy(messages, options) {
            const res = await fetch(this.config.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    model: options.model,
                    temperature: options.temperature,
                    maxTokens: options.maxTokens
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Backend Proxy Error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            return {
                content: (data.choices?.[0]?.message?.content || data.content || '').trim(),
                modelUsed: data.modelUsed || options.model,
                usage: data.usage || null,
                raw: data
            };
        }

        /**
         * Test API Key Connection
         */
        async testConnection(customKey = null) {
            const keyToTest = customKey || this.getApiKey();
            if (!keyToTest) throw new Error('No API key provided.');

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${keyToTest}`,
                    'HTTP-Referer': this.config.siteUrl,
                    'X-Title': this.config.appName,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openrouter/free',
                    messages: [{ role: 'user', content: 'Respond with "ONLINE" if you can hear me.' }],
                    max_tokens: 10
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Connection Test Failed (${res.status}): ${errText}`);
            }

            const data = await res.json();
            return {
                success: true,
                message: data.choices?.[0]?.message?.content?.trim() || 'Connected',
                modelUsed: data.model || 'openrouter/free'
            };
        }

        // ====================================================================
        // High-Level AI Pipelines (Reusable across all Nexys Apps)
        // ====================================================================

        /**
         * Writing Improvement & Tone Transformation
         */
        async improveWriting(text, options = {}) {
            const tone = options.tone || 'academic'; // academic | concise | professional | simplify | fix_grammar | creative | persuasive
            
            const tonePrompts = {
                academic: 'Rewrite and elevate the following text to maintain high academic rigor, scholarly precision, active voice, and formal diction while preserving the exact core meaning.',
                concise: 'Make the following text as crisp, clear, and concise as possible. Eliminate fluff, redundancy, and passive phrasing.',
                professional: 'Rewrite this text into polished, professional business writing that is clear, persuasive, and authoritative.',
                simplify: 'Explain and rewrite this text in clear, simple, and accessible plain English without losing crucial nuance.',
                fix_grammar: 'Correct all grammar, spelling, punctuation, and phrasing errors in this text while keeping the author’s original voice and style intact.',
                creative: 'Enhance this writing with vivid sensory details, engaging rhythm, and captivating literary flair.',
                persuasive: 'Strengthen the rhetorical impact and persuasiveness of this text with compelling transitions and strong arguments.'
            };

            const instruction = tonePrompts[tone] || tonePrompts.academic;
            const extraInstructions = options.instructions ? `\nAdditional user guidelines: ${options.instructions}` : '';

            const systemPrompt = `You are Nexys AI, an expert academic editor and writing consultant. 
Return ONLY the revised text. Do not include markdown code block backticks, preamble greetings, or meta commentary unless explicitly requested.`;

            const userPrompt = `${instruction}${extraInstructions}\n\n[TEXT TO REVISE]:\n${text}`;

            return this.complete([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], options);
        }

        /**
         * Smart Summarization
         */
        async summarize(text, options = {}) {
            const format = options.format || 'bullets'; // bullets | executive | tldr | abstract | key_arguments
            
            const formatInstructions = {
                bullets: 'Provide 3 to 6 high-impact, analytical bullet points capturing the core insights and takeaways.',
                executive: 'Write a comprehensive, professional executive summary with clear subheadings.',
                tldr: 'Provide an ultra-concise 2-sentence summary capturing the essential thesis and conclusion.',
                abstract: 'Draft a formal academic abstract (Background, Methods/Arguments, Results/Findings, Significance).',
                key_arguments: 'Extract and analyze the primary claims, evidence, and underlying assumptions in this text.'
            };

            const instruction = formatInstructions[format] || formatInstructions.bullets;

            const systemPrompt = `You are Nexys AI, a high-level academic research summarizer. Deliver an accurate, insightful, and structured summary. Avoid filler text.`;
            const userPrompt = `${instruction}\n\n[SOURCE TEXT]:\n${text}`;

            return this.complete([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], options);
        }

        /**
         * Continue Writing & Content Expansion
         */
        async continueWriting(contextText, options = {}) {
            const instructions = options.instructions || 'Continue developing the next logical arguments or narrative progression seamlessly from where this text left off.';

            const systemPrompt = `You are Nexys AI Copilot. Seamlessly continue writing the text provided by the user. Match the existing tone, terminology, formatting, and pacing exactly. Do not repeat what was already written. Output only the continuation.`;
            const userPrompt = `Context so far:\n${contextText}\n\nInstructions: ${instructions}`;

            return this.complete([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], options);
        }

        /**
         * Academic Critique & Deep Rubric Review
         */
        async academicCritique(text, options = {}) {
            const systemPrompt = `You are a distinguished university professor and academic reviewer for Nexys AI. 
Evaluate the provided writing according to a structured rubric:
1. Thesis & Argument Strength (Score out of 10 & feedback)
2. Structural Flow & Transitions (Score out of 10 & feedback)
3. Vocabulary & Academic Diction (Score out of 10 & feedback)
4. Clarity & Precision (Score out of 10 & feedback)
5. Top 3 Actionable Suggestions to elevate the writing.

Format your review with clear markdown headings, bullet points, and high readability.`;

            const userPrompt = `Please critique the following piece of writing:\n\n${text}`;

            return this.complete([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], { ...options, temperature: 0.5 });
        }

        /**
         * Outline & Structure Generator
         */
        async generateOutline(topicOrText, options = {}) {
            const depth = options.depth || 'detailed'; // brief | detailed | essay | research_paper
            const depthGuide = {
                brief: 'Generate a clean 4-section outline with main bullet points.',
                detailed: 'Generate a comprehensive, hierarchical outline with Roman numerals (I, II, III), capital letters (A, B, C), and detailed sub-points.',
                essay: 'Generate a complete 5-paragraph academic essay structure with thesis statement, hook, evidence points, counterarguments, and conclusion.',
                research_paper: 'Generate a formal research paper framework: Abstract, Introduction, Literature Review, Methodology, Analysis, Discussion, and Conclusion.'
            };

            const systemPrompt = `You are Nexys AI, an expert academic architect. Create an exceptionally structured, logical, and actionable outline.`;
            const userPrompt = `${depthGuide[depth] || depthGuide.detailed}\n\nTopic / Seed Material:\n${topicOrText}`;

            return this.complete([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], options);
        }

        /**
         * Interactive Chat / Copilot Assistant
         */
        async chat(messages, options = {}) {
            const context = options.documentContext ? `\n\n[CURRENT DOCUMENT CONTEXT]:\n${options.documentContext.slice(0, 8000)}` : '';
            const systemPrompt = options.systemPrompt || `You are Nexys AI, an intelligent writing copilot and research assistant for Vylex Nexys. You help users brainstorm, draft, edit, research, and format high quality academic and professional documents. Be concise, insightful, and proactive.${context}`;

            const formattedMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];

            return this.complete(formattedMessages, options);
        }
    }

    // Export Singleton to global window
    global.NexysAI = new NexysAIService();

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
