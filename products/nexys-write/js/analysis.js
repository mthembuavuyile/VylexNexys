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
    
    updateAnalysisUI(stats, readability);
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

function updateAnalysisUI(stats, readability) {
    document.getElementById('word-count').textContent = stats.wordCount;
    document.getElementById('char-count').textContent = stats.charCount;
    document.getElementById('sentence-count').textContent = stats.sentenceCount;
    document.getElementById('paragraph-count').textContent = stats.paragraphCount;
    document.getElementById('reading-time').textContent = `~${stats.readingTime}s`;
    
    const readabilityEl = document.getElementById('readability-score');
    readabilityEl.textContent = `${readability.score} (${readability.level})`;
    
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
    document.getElementById('unique-word-count').textContent = '0';
    document.getElementById('vocab-variety-score').textContent = '0%';
    document.getElementById('avg-word-length').textContent = '0';
    document.getElementById('avg-sentence-length').textContent = '0';
}
