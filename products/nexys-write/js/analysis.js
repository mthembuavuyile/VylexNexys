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
    
    updateAnalysisUI(stats, readability, tone);
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

function calculateReadability(words, wordCount, sentenceCount) {
    if (wordCount === 0 || sentenceCount === 0) return { score: 'N/A', level: 'N/A', gradeLevel: 'N/A' };

    const countSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? syllables.length : 1;
    };

    const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
    const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
    const fleschScore = Math.max(0, Math.min(100, parseFloat(score.toFixed(1))));

    let level;
    let gradeLevel;
    if (fleschScore >= 90) { level = 'Very Easy'; gradeLevel = 'Grade 5'; }
    else if (fleschScore >= 80) { level = 'Easy'; gradeLevel = 'Grade 6-7'; }
    else if (fleschScore >= 70) { level = 'Fairly Easy'; gradeLevel = 'Grade 8-9'; }
    else if (fleschScore >= 60) { level = 'Standard'; gradeLevel = 'Grade 10-12'; }
    else if (fleschScore >= 50) { level = 'Fairly Difficult'; gradeLevel = 'Undergrad'; }
    else if (fleschScore >= 30) { level = 'Difficult'; gradeLevel = 'College Grad'; }
    else { level = 'Very Difficult'; gradeLevel = 'Professional'; }

    return { score: fleschScore, level, gradeLevel };
}

function updateAnalysisUI(stats, readability, tone) {
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
    document.getElementById('unique-word-count').textContent = '0';
    document.getElementById('vocab-variety-score').textContent = '0%';
    document.getElementById('avg-word-length').textContent = '0';
    document.getElementById('avg-sentence-length').textContent = '0';
}
