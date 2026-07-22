// Achieva UI Module - Theme Toggling, Tab Navigation, Modals & UI Binding

import { appData, saveData } from './store.js';
import { generateReportOnTab } from './report.js';
import { renderAnalyticsCharts } from './analytics.js';

export function applyTheme() {
    const isDark = appData.settings.theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);

    const moonIconHTML = '<i class="fa-solid fa-moon"></i>';
    const sunIconHTML = '<i class="fa-solid fa-sun"></i>';

    const tToggle = document.querySelector('.theme-toggle');
    const tToggleTop = document.querySelector('.theme-toggle-top');

    if (tToggle) tToggle.innerHTML = isDark ? sunIconHTML : moonIconHTML;
    if (tToggleTop) tToggleTop.innerHTML = isDark ? sunIconHTML : moonIconHTML;
}

export function toggleTheme() {
    appData.settings.theme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    applyTheme();
    saveData();

    if (document.getElementById('analytics')?.classList.contains('active')) {
        renderAnalyticsCharts();
    }
}

export function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const triggers = document.querySelectorAll(`[data-tab="${tabName}"]`);
    triggers.forEach(t => t.classList.add('active'));

    const tabEl = document.getElementById(tabName);
    if (tabEl) tabEl.classList.add('active');

    const tabTitles = {
        dashboard: 'Academic Cockpit',
        subjects: 'Subject Manager',
        schedule: 'Study Schedule & Generator',
        goals: 'Academic Targets',
        report: 'Academic Performance Report',
        analytics: 'Performance Analytics',
        pomodoro: 'Focus Study Timer (Pomodoro)'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = tabTitles[tabName] || 'Achieva';

    // Hash navigation routing
    if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, null, `#${tabName}`);
    }

    if (tabName === 'report') generateReportOnTab();
    if (tabName === 'analytics') renderAnalyticsCharts();
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

export function openSubjectModal() {
    const form = document.getElementById('subjectForm');
    if (form) form.reset();
    openModal('subjectModal');
}

export function openAssessmentModal(subjectId, assessmentIdToEdit = null) {
    const form = document.getElementById('assessmentForm');
    if (!form) return;
    form.reset();

    document.getElementById('assessmentSubjectId').value = subjectId;
    document.getElementById('editingAssessmentId').value = assessmentIdToEdit || '';

    const headerEl = document.querySelector('#assessmentModal .modal-header h2');

    if (assessmentIdToEdit) {
        const subject = appData.subjects.find(s => s.id === subjectId);
        const assessment = subject?.assessments.find(a => a.id === assessmentIdToEdit);
        if (assessment) {
            document.getElementById('assessmentName').value = assessment.name;
            document.getElementById('assessmentType').value = assessment.type;
            document.getElementById('assessmentWeight').value = assessment.weight;
            document.getElementById('assessmentScore').value = assessment.score !== null ? assessment.score : '';
            document.getElementById('assessmentMaxScore').value = assessment.maxScore;
            document.getElementById('assessmentDueDate').value = assessment.dueDate || '';
            if (headerEl) headerEl.textContent = 'Edit Assessment';
        }
    } else {
        if (headerEl) headerEl.textContent = 'Add Assessment';
    }
    openModal('assessmentModal');
}

export function openTaskModal() {
    const form = document.getElementById('taskForm');
    if (form) form.reset();

    const select = document.getElementById('taskSubject');
    if (select) {
        select.innerHTML = '<option value="">General Task</option>';
        appData.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    }
    openModal('taskModal');
}

export function toggleGoalSubjectSelect(goalType) {
    const subjectGroup = document.getElementById('goalSubjectGroup');
    const subjectSelect = document.getElementById('goalSubjectId');
    if (!subjectGroup || !subjectSelect) return;

    if (goalType === 'SubjectGrade') {
        subjectGroup.style.display = 'block';
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        appData.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = `${subject.name} (${subject.code || 'No Code'})`;
            subjectSelect.appendChild(option);
        });
        subjectSelect.required = true;
    } else {
        subjectGroup.style.display = 'none';
        subjectSelect.required = false;
    }
}

export function openGoalModal() {
    const form = document.getElementById('goalForm');
    if (form) form.reset();
    toggleGoalSubjectSelect('');
    openModal('goalModal');
}

export function openSettingsModal() {
    const nameInput = document.getElementById('settingsStudentName');
    const creditsInput = document.getElementById('settingsTotalCredits');
    const scaleInput = document.getElementById('settingsGradingScale');

    if (nameInput) nameInput.value = appData.settings.studentName;
    if (creditsInput) creditsInput.value = appData.settings.totalCreditsRequired;
    if (scaleInput) scaleInput.value = appData.settings.gradingScale || 'US_GPA';

    openModal('settingsModal');
}

export function switchScheduleSubTab(subTabName) {
    document.querySelectorAll('.segment-tab').forEach(tab => tab.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-sched-tab="${subTabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const tasksSec = document.getElementById('scheduleTasksSection');
    const timetableSec = document.getElementById('scheduleTimetableSection');

    if (subTabName === 'tasks') {
        if (tasksSec) tasksSec.style.display = 'block';
        if (timetableSec) timetableSec.style.display = 'none';
    } else {
        if (tasksSec) tasksSec.style.display = 'none';
        if (timetableSec) timetableSec.style.display = 'block';
    }
}

export function toggleQuickAddMenu() {
    const menu = document.getElementById('quickAddMenu');
    if (menu) menu.classList.toggle('active');
}

export function closeQuickAddMenu() {
    const menu = document.getElementById('quickAddMenu');
    if (menu) menu.classList.remove('active');
}

export function openMoreNavModal() {
    openModal('moreNavModal');
}

