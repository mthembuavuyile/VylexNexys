// ============================================================================
// analysis.js - Live Text Analysis and Readability
// ============================================================================

function handleAnalysis() {
    const editorEl = document.getElementById('editor');
    if(!editorEl) return;
    
    // We get innerText to exclude HTML tags for stats
    const text = editorEl.innerText || '';
    
    // Quick Stats Top Bar
    const wordCountQuick = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charCountQuick = text.length;
    document.getElementById('quickStats').textContent = `${wordCountQuick} words, ${charCountQuick} characters`;

    if (text.trim() === '') {
        resetAnalysisUI();
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
    
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    stats.uniqueWordCount = uniqueWords.size;
    stats.vocabVariety = stats.wordCount > 0 ? (stats.uniqueWordCount / stats.wordCount * 100).toFixed(1) : 0;
    
    const totalWordLength = words.reduce((acc, word) => acc + word.length, 0);
    stats.avgWordLength = stats.wordCount > 0 ? (totalWordLength / stats.wordCount).toFixed(1) : 0;
    stats.avgSentenceLength = stats.sentenceCount > 0 ? (stats.wordCount / stats.sentenceCount).toFixed(1) : 0;
    
    const readability = calculateReadability(words, stats.wordCount, stats.sentenceCount);
    const tone = calculateTone(words, text);
    const grammar = calculateGrammar(text);
    
    updateAnalysisUI(stats, readability, tone, grammar);
}

function calculateTone(words, text) {
    if (!words || words.length < 3) return 'N/A';

    const lowerText = text.toLowerCase();
    
    // First-person indicators
    const firstPersonMatches = lowerText.match(/\b(i|me|my|mine|we|us|our|ours)\b/g) || [];
    const firstPersonRatio = firstPersonMatches.length / words.length;

    // Academic / Formal indicators
    const academicWords = lowerText.match(/\b(therefore|thus|however|consequently|furthermore|analysis|research|data|results|indicates|demonstrates|significant|methodology|hypothesis|objective|impact|transition|integration|renewable|framework|structure|evidence)\b/g) || [];
    const longWords = words.filter(w => w.length >= 7);
    const longWordRatio = longWords.length / words.length;

    // Informal indicators
    const informalMatches = lowerText.match(/\b(awesome|cool|yeah|gonna|wanna|stuff|guy|guys|kind of|sort of|lol|omg)\b/g) || [];
    const exclamationCount = (text.match(/!/g) || []).length;

    if (informalMatches.length > 0 || exclamationCount > 2) {
        return 'Informal / Casual';
    } else if (firstPersonRatio > 0.05) {
        return 'Personal / Reflective';
    } else if (academicWords.length > 0 || longWordRatio > 0.18) {
        return 'Academic / Objective';
    } else {
        return 'Standard / Neutral';
    }
}

function calculateGrammar(text) {
    if (!window.nlp || !text || text.trim() === '') return 'N/A';
    
    try {
        const doc = window.nlp(text);
        const adverbs = doc.adverbs().out('array');
        const passiveMatches = doc.match('(is|are|was|were|been|be) #PastTense').out('array');
        const termsCount = doc.terms().length;
        
        const feedback = [];
        if (termsCount > 0 && adverbs.length > (termsCount * 0.08)) {
            feedback.push(`High adverb use (${adverbs.length}).`);
        }
        if (passiveMatches.length > 0) {
            feedback.push(`Passive voice used (${passiveMatches.length}x).`);
        }
        
        if (feedback.length === 0) return 'Looks good!';
        return feedback.join(' ');
    } catch (e) {
        console.error(e);
        return 'Analysis error';
    }
}

function calculateReadability(words, wordCount, sentenceCount) {
    if (wordCount === 0 || sentenceCount === 0) return { score: 'N/A', level: 'N/A', gradeLevel: 'N/A' };

    const countSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? syllables.length : 1;
    };

    let syllableCount = 0;
    let complexWords = 0;
    words.forEach(word => {
        const syllables = countSyllables(word);
        syllableCount += syllables;
        if (syllables >= 3) complexWords++;
    });

    const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
    const fleschScore = Math.max(0, Math.min(100, parseFloat(score.toFixed(1))));

    // Composite Grade Level Calculation
    const avgSentenceLength = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / wordCount;
    const percentComplex = (complexWords / wordCount) * 100;

    const fkGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
    const gunningFog = 0.4 * (avgSentenceLength + percentComplex);
    const smog = 1.0430 * Math.sqrt(complexWords * (30 / sentenceCount)) + 3;
    
    let compositeGrade = ((fkGrade + gunningFog + smog) / 3).toFixed(1);
    if (compositeGrade < 1) compositeGrade = 1;

    let level;
    if (fleschScore >= 80) level = 'Easy';
    else if (fleschScore >= 60) level = 'Standard';
    else if (fleschScore >= 40) level = 'Difficult';
    else level = 'Very Difficult';

    return { score: fleschScore, level, gradeLevel: `Grade ${compositeGrade}` };
}

function updateAnalysisUI(stats, readability, tone, grammar) {
    document.getElementById('word-count').textContent = stats.wordCount;
    document.getElementById('char-count').textContent = stats.charCount;
    document.getElementById('sentence-count').textContent = stats.sentenceCount;
    document.getElementById('paragraph-count').textContent = stats.paragraphCount;
    document.getElementById('reading-time').textContent = `~${stats.readingTime}s`;
    
    const readabilityEl = document.getElementById('readability-score');
    if (readability.score === 'N/A') {
        readabilityEl.textContent = 'N/A';
    } else {
        readabilityEl.textContent = `${readability.score}/100 (${readability.gradeLevel})`;
    }

    const toneEl = document.getElementById('tone-analysis');
    if (toneEl) toneEl.textContent = tone;

    const grammarEl = document.getElementById('grammar-feedback');
    if (grammarEl) grammarEl.textContent = grammar || 'N/A';
    
    document.getElementById('unique-word-count').textContent = stats.uniqueWordCount;
    document.getElementById('vocab-variety-score').textContent = `${stats.vocabVariety}%`;
    document.getElementById('avg-word-length').textContent = stats.avgWordLength;
    document.getElementById('avg-sentence-length').textContent = stats.avgSentenceLength;
}

function resetAnalysisUI() {
    document.getElementById('word-count').textContent = '0';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('sentence-count').textContent = '0';
    document.getElementById('paragraph-count').textContent = '0';
    document.getElementById('reading-time').textContent = '0s';
    document.getElementById('readability-score').textContent = 'N/A';
    const toneEl = document.getElementById('tone-analysis');
    if (toneEl) toneEl.textContent = 'N/A';
    const grammarEl = document.getElementById('grammar-feedback');
    if (grammarEl) grammarEl.textContent = 'N/A';
    document.getElementById('unique-word-count').textContent = '0';
    document.getElementById('vocab-variety-score').textContent = '0%';
    document.getElementById('avg-word-length').textContent = '0';
    document.getElementById('avg-sentence-length').textContent = '0';
}
