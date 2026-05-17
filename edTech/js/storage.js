/**
 * VYLEX NEXYS EdTech — Storage Layer
 * DRY localStorage helpers for profile and progress management.
 */

const StorageKeys = {
    NAME:     'vylex_edtech_name',
    AVATAR:   'vylex_edtech_avatar',
    GRADE:    'vylex_edtech_grade',
    XP:       'vylex_edtech_xp',
    PROGRESS: 'vylex_edtech_progress'   // JSON object: { moduleId: percentage }
};

let userProfile = { name: null, avatar: null, grade: null, xp: 0 };

/** Load profile from localStorage. Returns true if a saved session exists. */
function loadProfile() {
    const n = localStorage.getItem(StorageKeys.NAME);
    const g = localStorage.getItem(StorageKeys.GRADE);
    if (n && g) {
        userProfile.name   = n;
        userProfile.avatar = localStorage.getItem(StorageKeys.AVATAR) ||
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(n) + '&backgroundColor=1e293b';
        userProfile.grade  = g;
        userProfile.xp     = parseInt(localStorage.getItem(StorageKeys.XP) || '0', 10);
        return true;
    }
    return false;
}

/** Save current userProfile to localStorage. */
function saveProfile() {
    localStorage.setItem(StorageKeys.NAME,   userProfile.name);
    localStorage.setItem(StorageKeys.AVATAR, userProfile.avatar);
    localStorage.setItem(StorageKeys.GRADE,  userProfile.grade);
    localStorage.setItem(StorageKeys.XP,     userProfile.xp);
}

/** Get progress for a specific module (0–100). */
function getModuleProgress(moduleId) {
    try {
        const data = JSON.parse(localStorage.getItem(StorageKeys.PROGRESS) || '{}');
        return data[moduleId] || 0;
    } catch { return 0; }
}

/** Set progress for a specific module (0–100). */
function setModuleProgress(moduleId, pct) {
    try {
        const data = JSON.parse(localStorage.getItem(StorageKeys.PROGRESS) || '{}');
        data[moduleId] = Math.min(100, Math.max(0, pct));
        localStorage.setItem(StorageKeys.PROGRESS, JSON.stringify(data));
    } catch { /* silently fail */ }
}

/** Get total XP. */
function getXP() { return userProfile.xp; }

/** Add XP and persist. */
function addXP(amount) {
    userProfile.xp += amount;
    localStorage.setItem(StorageKeys.XP, userProfile.xp);
}

/** Get average progress across all modules in a subject. */
function getSubjectProgress(subjectKey) {
    const subject = CURRICULUM[subjectKey];
    if (!subject) return 0;
    let total = 0, count = 0;

    const processTopic = (topic) => {
        topic.modules.forEach(m => { total += getModuleProgress(m.id); count++; });
    };

    if (subject.sections) {
        subject.sections.forEach(sec => sec.topics.forEach(processTopic));
        if (subject.examPrep) processTopic(subject.examPrep);
    } else {
        subject.topics.forEach(processTopic);
    }
    return count > 0 ? Math.round(total / count) : 0;
}

/** Reset all progress with confirmation. */
function resetProgress() {
    if (confirm('Are you sure you want to erase all your progress? This cannot be undone.')) {
        localStorage.clear();
        window.location.reload();
    }
}
