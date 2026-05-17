document.addEventListener('DOMContentLoaded', () => {
    if (loadProfile()) {
        renderDynamicData();
        updateXpDisplays();
        navigate('learn');
    } else {
        feather.replace();
    }
});

function updateXpDisplays() {
    document.querySelectorAll('.dash-xp-display').forEach(el => el.innerText = userProfile.xp);
    const gradeTxt = document.getElementById('dash-grade-txt');
    if (gradeTxt) gradeTxt.innerText = userProfile.grade;
    const profileGrade = document.getElementById('profile-grade-display');
    if (profileGrade) profileGrade.innerText = `Grade ${userProfile.grade} • ${userProfile.subject}`;

    const profileName = document.getElementById('profile-name-display');
    if (profileName && userProfile.name) profileName.innerText = userProfile.name;

    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar && userProfile.avatar) headerAvatar.src = userProfile.avatar;

    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar && userProfile.avatar) profileAvatar.src = userProfile.avatar;
}

function finishStep1() {
    const nameInput = document.getElementById('ob-name-input');
    if (!nameInput.value.trim()) {
        nameInput.classList.add('border-red-500');
        return;
    }
    userProfile.name = nameInput.value.trim();
    userProfile.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.name}&backgroundColor=1e293b`;
    
    document.getElementById('ob-step-1').classList.add('view-hidden');
    document.getElementById('ob-step-2').classList.remove('view-hidden');
    document.getElementById('ob-step-2').classList.add('animate-slide-up');
    document.getElementById('onboard-progress').style.width = '66%';
}

function selectGrade(grade, btnElement) {
    userProfile.grade = grade;
    document.querySelectorAll('.grade-btn').forEach(btn => {
        btn.classList.remove('border-brand-500', 'bg-brand-900/20');
        btn.classList.add('border-slate-700');
    });
    btnElement.classList.remove('border-slate-700');
    btnElement.classList.add('border-brand-500', 'bg-brand-900/20');

    setTimeout(() => {
        document.getElementById('ob-step-2').classList.add('view-hidden');
        document.getElementById('ob-step-3').classList.remove('view-hidden');
        document.getElementById('ob-step-3').classList.add('animate-slide-up');
        document.getElementById('onboard-progress').style.width = '100%';
    }, 300);
}

function finishOnboarding(subject) {
    userProfile.subject = subject;
    saveProfile();
    renderDynamicData();
    updateXpDisplays();
    setTimeout(() => navigate('learn'), 200);
}

function switchTab(tabId, btnTarget) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('view-hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.remove('view-hidden');
    if (btnTarget) btnTarget.classList.add('active');
}

function navigate(viewId) {
    document.querySelectorAll('main > section').forEach(el => el.classList.add('view-hidden'));
    const header = document.getElementById('app-header');
    const nav = document.getElementById('bottom-nav');

    if (['learn', 'labs', 'stats', 'profile'].includes(viewId)) {
        header.classList.remove('view-hidden');
        nav.classList.remove('view-hidden');
    } else {
        header.classList.add('view-hidden');
        nav.classList.add('view-hidden');
    }
    document.getElementById(`view-${viewId}`).classList.remove('view-hidden');
    feather.replace();
}

function switchAppView(viewId, btn) {
    document.querySelectorAll('.app-view').forEach(el => el.classList.add('view-hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('view-hidden');
    document.querySelectorAll('.bottom-nav-btn').forEach(b => {
        b.classList.remove('text-white', 'bg-white/10');
        b.classList.add('text-slate-400');
    });
    btn.classList.add('text-white', 'bg-white/10');
    btn.classList.remove('text-slate-400');
}

function renderDynamicData() {
    const tabsContainer = document.getElementById('subject-tabs-container');
    const contentContainer = document.getElementById('subject-content-container');
    const statsContainer = document.getElementById('stats-mastery-container');
    const labsContainer = document.getElementById('labs-container');

    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    statsContainer.innerHTML = '';
    labsContainer.innerHTML = '';

    Object.keys(curriculumData).forEach((key, index) => {
        const sub = curriculumData[key];
        const isActive = (userProfile.subject && sub.label.includes(userProfile.subject)) || (index === 0 && !userProfile.subject);

        // Tabs
        tabsContainer.innerHTML += `<button onclick="switchTab('${sub.id}', this)" class="tab-btn ${isActive ? 'active' : ''} px-5 py-2.5 rounded-full glass-panel border border-slate-700 text-sm font-bold text-slate-400 whitespace-nowrap">${sub.label}</button>`;

        // Modules
        let modulesHTML = sub.modules.map(mod => `
            <div class="glass-panel p-5 rounded-2xl border border-slate-700 hover:border-${sub.color}-500 transition-all flex flex-col cursor-pointer" onclick="window.location.href='lesson.html?m=${mod.id}'">
                <h4 class="font-bold text-white text-lg mb-1">${mod.title}</h4>
                <p class="text-sm text-slate-400 flex-1 mb-4">${mod.desc}</p>
                <div class="w-full h-1.5 bg-slate-800 rounded-full mb-4">
                    <div class="h-full bg-${sub.color}-500" style="width: ${mod.progress}%"></div>
                </div>
                <button class="w-full py-2 bg-${sub.color}-600 hover:bg-${sub.color}-500 text-white rounded-lg font-bold text-sm transition mt-auto">Start Module</button>
            </div>
        `).join('');

        contentContainer.innerHTML += `<div id="${sub.id}" class="tab-content space-y-6 ${isActive ? '' : 'view-hidden'} animate-fade-in"><h3 class="font-display text-lg font-bold mt-4 mb-4">Core Modules</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${modulesHTML}</div></div>`;

        // Stats
        let subProgress = sub.modules.reduce((acc, m) => acc + m.progress, 0) / (sub.modules.length || 1);
        statsContainer.innerHTML += `
            <div class="mb-3">
                <div class="flex justify-between text-sm mb-1"><span class="text-slate-300 font-bold">${sub.label}</span><span class="text-slate-400">${Math.round(subProgress)}%</span></div>
                <div class="w-full h-2 bg-slate-800 rounded-full"><div class="h-full bg-${sub.color}-500 rounded-full" style="width: ${subProgress}%"></div></div>
            </div>`;
    });

    labsData.forEach(lab => {
        labsContainer.innerHTML += `
            <a href="${lab.url}" target="_blank" class="block glass-panel p-5 rounded-2xl border border-slate-700 hover:border-brand-500 transition flex gap-4 items-center cursor-pointer">
                <div class="w-12 h-12 rounded-lg bg-${lab.color}-500/20 text-${lab.color}-400 flex items-center justify-center"><i data-feather="${lab.icon}"></i></div>
                <div class="flex-1">
                    <h4 class="font-bold text-white flex items-center gap-2">${lab.title} <i data-feather="external-link" class="w-4 h-4 text-slate-400"></i></h4>
                    <p class="text-xs text-slate-400">${lab.desc}</p>
                </div>
            </a>`;
    });
}