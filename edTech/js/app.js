/**
 * VYLEX NEXYS EdTech — App Controller
 * Data-driven renderer powered by CURRICULUM registry.
 */

/* ── Subject color map ── */
const SUBJECT_COLORS = {
    mathematics:          'var(--et-math)',
    physical_sciences:    'var(--et-physics)',
    life_sciences:        'var(--et-lifesci)',
    cat:                  'var(--et-cat)',
    egd:                  'var(--et-egd)',
    agricultural_sciences:'var(--et-agrisci)'
};

/* Section-level overrides (Physics vs Chemistry) */
const SECTION_COLORS = {
    physics:   'var(--et-physics)',
    chemistry: 'var(--et-chemistry)'
};

/* ── Labs Data ── */
const labsData = [
    { id: 'lab1', title: 'Electrodynamics Simulator', desc: 'Build AC/DC motors and generators in 3D.', icon: 'fa-bolt', color: 'var(--et-physics)', url: '../tools/virtual-lab.html' },
    { id: 'lab2', title: 'Chemical Titration', desc: 'Virtual titration setup with real-time indicators.', icon: 'fa-flask', color: 'var(--et-chemistry)', url: '../tools/virtual-lab.html' },
    { id: 'lab3', title: 'Projectile Motion', desc: 'Launch varied masses and track parabolas.', icon: 'fa-bullseye', color: 'var(--warning)', url: '../tools/virtual-lab.html' },
    { id: 'lab4', title: 'DNA Molecule Viewer', desc: 'Explore the double helix in interactive 3D.', icon: 'fa-dna', color: 'var(--et-lifesci)', url: '../tools/virtual-lab.html' }
];

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    if (loadProfile()) {
        buildApp();
        navigate('dashboard');
    }
    // Landing is visible by default
});

/* ═══════════════════════════════════════════
   ONBOARDING
   ═══════════════════════════════════════════ */

function finishStep1() {
    const input = document.getElementById('ob-name-input');
    const name = input.value.trim();
    if (!name) {
        input.classList.add('input-error');
        input.focus();
        return;
    }
    input.classList.remove('input-error');
    userProfile.name = name;
    userProfile.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
        encodeURIComponent(name) + '&backgroundColor=1e293b';

    // Transition to step 2
    document.getElementById('ob-step-1').classList.add('view-hidden');
    const step2 = document.getElementById('ob-step-2');
    step2.classList.remove('view-hidden');
    step2.classList.add('animate-slide-up');
    document.getElementById('onboard-progress').style.width = '100%';
}

function selectGrade(grade, btn) {
    userProfile.grade = grade;

    // Visual feedback
    document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Save and enter app
    setTimeout(() => {
        saveProfile();
        buildApp();
        navigate('dashboard');
    }, 350);
}

/* ═══════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════ */

function navigate(viewId, extra) {
    const header = document.getElementById('app-header');
    const nav = document.getElementById('bottom-nav');
    const appViews = ['dashboard', 'subject', 'labs', 'stats', 'profile'];

    // Hide all views
    document.querySelectorAll('main > section').forEach(s => s.classList.add('view-hidden'));

    if (appViews.includes(viewId)) {
        header.classList.remove('view-hidden');
        nav.classList.remove('view-hidden');
    } else {
        header.classList.add('view-hidden');
        nav.classList.add('view-hidden');
    }

    // Show target view
    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.classList.remove('view-hidden');
        target.scrollTop = 0;
    }

    // Update nav pills
    document.querySelectorAll('.nav-pill').forEach(pill => {
        const pv = pill.getAttribute('data-view');
        if (pv === viewId || (viewId === 'subject' && pv === 'dashboard')) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Render specific views
    if (viewId === 'subject' && extra) {
        renderSubjectDetail(extra.subjectKey, extra.sectionId);
    }
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'stats') renderStats();
    if (viewId === 'labs') renderLabs();
}

/* ═══════════════════════════════════════════
   BUILD APP (called once after login)
   ═══════════════════════════════════════════ */

function buildApp() {
    updateGlobalUI();
}

function updateGlobalUI() {
    // XP displays
    document.querySelectorAll('.xp-display').forEach(el => el.textContent = userProfile.xp);

    // Grade
    const gt = document.getElementById('dash-grade-txt');
    if (gt) gt.textContent = userProfile.grade;

    // Profile
    const pn = document.getElementById('profile-name-display');
    if (pn && userProfile.name) pn.textContent = userProfile.name;

    const pg = document.getElementById('profile-grade-display');
    if (pg) pg.textContent = 'Grade ' + userProfile.grade;

    // Avatars
    if (userProfile.avatar) {
        const ha = document.getElementById('header-avatar');
        if (ha) ha.src = userProfile.avatar;
        const pa = document.getElementById('profile-avatar');
        if (pa) pa.src = userProfile.avatar;
    }
}

/* ═══════════════════════════════════════════
   DASHBOARD — Subject Cards Grid
   ═══════════════════════════════════════════ */

function renderDashboard() {
    updateGlobalUI();
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = '';

    getSubjectKeys().forEach(key => {
        const subj = CURRICULUM[key];
        const color = SUBJECT_COLORS[key] || 'var(--brand-500)';
        const progress = getSubjectProgress(key);
        const moduleCount = countModules(key);
        const label = subj.shortLabel || subj.label;

        // SVG progress ring
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;

        const card = document.createElement('div');
        card.className = 'glass-card subject-card p-5 animate-slide-up';
        card.style.setProperty('--card-accent', color);
        card.onclick = () => navigate('subject', { subjectKey: key });

        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="subject-icon">
                    <i class="fa-solid ${subj.icon}"></i>
                </div>
                <svg width="52" height="52" class="progress-ring">
                    <circle class="progress-ring-bg" cx="26" cy="26" r="${radius}" stroke-width="4"/>
                    <circle class="progress-ring-fill" cx="26" cy="26" r="${radius}" stroke-width="4"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        style="stroke:${color}"/>
                    <text x="26" y="26" text-anchor="middle" dominant-baseline="central"
                        fill="var(--text-secondary)" font-size="11" font-weight="700">${progress}%</text>
                </svg>
            </div>
            <h3 class="font-display font-bold text-lg mb-1">${label}</h3>
            <p class="text-muted text-sm">${moduleCount} modules</p>
        `;

        grid.appendChild(card);
    });
}

/* ═══════════════════════════════════════════
   SUBJECT DETAIL — Topics & Modules
   ═══════════════════════════════════════════ */

function renderSubjectDetail(subjectKey, activeSectionId) {
    const subj = CURRICULUM[subjectKey];
    if (!subj) return;

    const color = SUBJECT_COLORS[subjectKey] || 'var(--brand-500)';

    // Breadcrumb
    const bc = document.getElementById('subject-breadcrumb');
    bc.innerHTML = `
        <a href="#" onclick="event.preventDefault();navigate('dashboard')">Dashboard</a>
        <span class="sep"><i class="fa-solid fa-chevron-right" style="font-size:0.6rem;"></i></span>
        <span class="current">${subj.label}</span>
    `;

    // Header
    const header = document.getElementById('subject-header');
    const progress = getSubjectProgress(subjectKey);
    header.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
            <div class="subject-icon" style="--card-accent:${color};width:56px;height:56px;font-size:1.5rem;">
                <i class="fa-solid ${subj.icon}"></i>
            </div>
            <div class="flex-1">
                <h2 class="font-display text-2xl font-bold">${subj.label}</h2>
                <p class="text-muted text-sm">${countModules(subjectKey)} modules · ${progress}% complete</p>
            </div>
        </div>
        <div class="progress-track">
            <div class="progress-fill" style="width:${progress}%;--card-accent:${color};"></div>
        </div>
    `;

    // Section tabs (Physical Sciences only)
    const tabsEl = document.getElementById('section-tabs');
    const container = document.getElementById('topics-container');

    if (subj.sections) {
        // Sectioned subject
        tabsEl.classList.remove('view-hidden');
        tabsEl.innerHTML = '';

        const activeSection = activeSectionId || subj.sections[0].id;

        subj.sections.forEach(sec => {
            const isActive = sec.id === activeSection;
            const secColor = SECTION_COLORS[sec.id] || color;
            const tab = document.createElement('button');
            tab.className = 'tab-chip' + (isActive ? ' active' : '');
            tab.textContent = sec.label;
            tab.onclick = () => renderSubjectDetail(subjectKey, sec.id);
            if (isActive) {
                tab.style.borderColor = secColor;
                tab.style.background = secColor.replace(')', ',0.12)').replace('var(', 'color-mix(in srgb,') || '';
                tab.style.background = `color-mix(in srgb, ${secColor} 12%, transparent)`;
            }
            tabsEl.appendChild(tab);
        });

        // Render active section topics
        const sec = subj.sections.find(s => s.id === activeSection) || subj.sections[0];
        const secColor = SECTION_COLORS[sec.id] || color;
        renderTopics(container, sec.topics, secColor);

        // Append exam prep if exists
        if (subj.examPrep) {
            renderTopics(container, [subj.examPrep], secColor, true);
        }
    } else {
        // Simple subject
        tabsEl.classList.add('view-hidden');
        renderTopics(container, subj.topics, color);
    }
}

function renderTopics(container, topics, color, append) {
    if (!append) container.innerHTML = '';

    topics.forEach(topic => {
        const group = document.createElement('div');
        group.className = 'topic-group';

        const isExam = topic.isExamPrep;
        const badgeHTML = topic.badge ? `<span class="badge badge-brand">${topic.badge}</span>` : '';
        const examIcon = isExam ? '<i class="fa-solid fa-file-pen" style="margin-right:6px;opacity:0.7;"></i>' : '';

        group.innerHTML = `
            <div class="topic-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="flex items-center gap-3">
                    ${examIcon}
                    <span class="font-bold">${topic.label}</span>
                    ${badgeHTML}
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-muted text-xs">${topic.modules.length} modules</span>
                    <i class="fa-solid fa-chevron-down chevron" style="font-size:0.7rem;"></i>
                </div>
            </div>
            <div class="topic-modules" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));">
                ${topic.modules.map(mod => renderModuleCard(mod, color)).join('')}
            </div>
        `;

        container.appendChild(group);
    });
}

function renderModuleCard(mod, color) {
    const progress = getModuleProgress(mod.id);
    return `
        <div class="glass-card p-4" style="--card-accent:${color};cursor:pointer;"
             onclick="window.location.href='lesson.html?m=${mod.id}'">
            <h4 class="font-bold mb-1">${mod.title}</h4>
            <p class="text-muted text-sm mb-3">${mod.desc}</p>
            <div class="progress-track mb-3">
                <div class="progress-fill" style="width:${progress}%;"></div>
            </div>
            <button class="btn-module" style="background:${color};">
                ${progress > 0 ? 'Continue' : 'Start Module'}
            </button>
        </div>
    `;
}

/* ═══════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════ */

function renderStats() {
    updateGlobalUI();
    const container = document.getElementById('stats-mastery-container');
    container.innerHTML = '';

    getSubjectKeys().forEach(key => {
        const subj = CURRICULUM[key];
        const color = SUBJECT_COLORS[key] || 'var(--brand-500)';
        const progress = getSubjectProgress(key);
        const label = subj.shortLabel || subj.label;

        const row = document.createElement('div');
        row.innerHTML = `
            <div class="flex justify-between mb-1">
                <span class="text-sm font-bold">${label}</span>
                <span class="text-muted text-sm">${progress}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width:${progress}%;background:${color};"></div>
            </div>
        `;
        container.appendChild(row);
    });
}

/* ═══════════════════════════════════════════
   LABS
   ═══════════════════════════════════════════ */

function renderLabs() {
    const container = document.getElementById('labs-container');
    container.innerHTML = '';

    labsData.forEach(lab => {
        const card = document.createElement('a');
        card.href = lab.url;
        card.target = '_blank';
        card.className = 'glass-card p-5 flex items-center gap-4';
        card.style.textDecoration = 'none';

        card.innerHTML = `
            <div class="flex items-center justify-center shrink-0"
                 style="width:48px;height:48px;border-radius:var(--r-lg);background:color-mix(in srgb,${lab.color} 15%,transparent);color:${lab.color};font-size:1.25rem;">
                <i class="fa-solid ${lab.icon}"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-bold flex items-center gap-2">
                    ${lab.title}
                    <i class="fa-solid fa-arrow-up-right-from-square text-muted" style="font-size:0.7rem;"></i>
                </h4>
                <p class="text-muted text-xs">${lab.desc}</p>
            </div>
        `;

        container.appendChild(card);
    });
}