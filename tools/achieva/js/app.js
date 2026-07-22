// Achieva Application Main Entry Point

import { appData, loadData, saveData, exportData, importData } from './store.js';
import {
    renderSubjects,
    calculateOverallPerformance,
    gradeToGPA,
    getCAPSLevelShort,
    formatGradeDisplay,
    toggleSimulator,
    onSliderSimChange,
    deleteSubject,
    deleteAssessment,
    activeSimulations
} from './subjects.js';
import { renderSchedule, generateSmartSchedule, renderSmartTimetable, toggleSlotComplete, toggleTask, deleteTask } from './schedule.js';
import { toggleTimer, resetTimer, setTimerMode, updateTimerDisplay, playAlarmSound, populatePomodoroSubjectSelect } from './pomodoro.js';
import { renderGoals, toggleGoal, deleteGoal } from './goals.js';
import { renderAnalyticsCharts } from './analytics.js';
import { generateReportOnTab, printReport } from './report.js';
import {
    applyTheme,
    toggleTheme,
    switchTab,
    openModal,
    closeModal,
    openSubjectModal,
    openAssessmentModal,
    openTaskModal,
    openGoalModal,
    openSettingsModal,
    toggleGoalSubjectSelect
} from './ui.js';

export function refreshAllData() {
    renderSubjects(refreshAllData);
    renderSchedule();
    renderGoals();
    updateDashboard();
    generateReportOnTab();
    populatePomodoroSubjectSelect(appData.subjects);

    if (document.getElementById('analytics')?.classList.contains('active')) {
        renderAnalyticsCharts();
    }
}

export function saveAndRefresh() {
    saveData();
    refreshAllData();
}

function updateDashboard() {
    const performance = calculateOverallPerformance();
    const overallGpaEl = document.getElementById('overallGPA');
    const gpaLabelEl = document.querySelector('.stats-grid .stat-item:nth-child(1) .stat-label');

    if (overallGpaEl && gpaLabelEl) {
        if (performance !== null) {
            const scale = appData.settings.gradingScale || 'US_GPA';
            if (scale === 'US_GPA') {
                overallGpaEl.textContent = gradeToGPA(performance).toFixed(2);
                gpaLabelEl.textContent = 'Current GPA';
            } else if (scale === 'SA_CAPS') {
                overallGpaEl.textContent = getCAPSLevelShort(performance);
                gpaLabelEl.textContent = `Overall Level (${performance.toFixed(1)}%)`;
            } else {
                overallGpaEl.textContent = `${performance.toFixed(1)}%`;
                gpaLabelEl.textContent = 'Overall Average';
            }
        } else {
            overallGpaEl.textContent = 'N/A';
            gpaLabelEl.textContent = 'Overall GPA';
        }
    }

    const enrolledEl = document.getElementById('creditsEnrolled');
    if (enrolledEl) enrolledEl.textContent = appData.subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

    const activeTasksEl = document.getElementById('activeTasks');
    if (activeTasksEl) activeTasksEl.textContent = appData.tasks.filter(t => !t.completed).length;

    const completedGoalsEl = document.getElementById('completedGoals');
    if (completedGoalsEl) completedGoalsEl.textContent = appData.goals.filter(g => g.completed).length;

    updateRecentSubjectsList();
    updateUpcomingDueDatesList();
}

function updateRecentSubjectsList() {
    const container = document.getElementById('recentSubjectsList');
    if (!container) return;

    const recentSubjects = [...appData.subjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

    if (recentSubjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:1.5rem;">
                <div class="empty-state-icon">📚</div>
                <p>No subjects added yet.</p>
            </div>`;
        return;
    }

    container.innerHTML = recentSubjects.map(subject => {
        const gradeInfo = appData.subjects ? calculateSubjectGrade(subject) : { weightedAverageOfGraded: null, totalWeightAchieved: 0 };
        const avgVal = gradeInfo.weightedAverageOfGraded;
        return `
            <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-weight:700; color:var(--text-main);">${subject.name}</span>
                    <div style="font-size:0.75rem; color:var(--text-light);">${subject.code || 'No Code'} • ${gradeInfo.totalWeightAchieved.toFixed(1)}% graded</div>
                </div>
                <span style="font-weight:800; color: var(--primary-dark); font-size:1.1rem;">
                    ${avgVal !== null ? formatGradeDisplay(avgVal) : 'N/A'}
                </span>
            </div>`;
    }).join('');
}

function updateUpcomingDueDatesList() {
    const container = document.getElementById('upcomingDueDatesList');
    if (!container) return;

    let upcomingItems = [];

    appData.tasks.filter(t => !t.completed && t.dueDate).forEach(task => {
        upcomingItems.push({ type: 'Task', title: task.title, dueDate: task.dueDate });
    });

    appData.subjects.forEach(s => {
        s.assessments.filter(a => a.score === null && a.dueDate).forEach(asm => {
            upcomingItems.push({ type: 'Assessment', title: asm.name, dueDate: asm.dueDate, subject: s.name });
        });
    });

    upcomingItems.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const displayItems = upcomingItems.slice(0, 4);

    if (displayItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:2.5rem 1rem;">
                <div class="empty-state-icon">📅</div>
                <p>No upcoming tasks or due dates.</p>
            </div>`;
        return;
    }

    container.innerHTML = displayItems.map(item => `
         <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div style="max-width:70%;">
                <div style="font-weight:700; color:var(--text-main); font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.title}</div>
                <small style="color: var(--text-light);">${item.type}${item.subject ? ' • ' + item.subject : ''}</small>
            </div>
            <span style="font-size:0.8rem; font-weight:700; color: var(--accent); background-color:rgba(232,73,29,0.06); padding:2px 8px; border-radius:4px;">
                ${item.dueDate}
            </span>
        </div>
    `).join('');
}

// Initialise Event Listeners & Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    applyTheme();
    refreshAllData();

    // Check URL hash for direct tab navigation (e.g. #schedule, #pomodoro)
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'subjects', 'schedule', 'goals', 'report', 'analytics', 'pomodoro'].includes(hash)) {
        switchTab(hash);
    }

    // Modal background click handling
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Theme toggle buttons
    document.querySelectorAll('.theme-toggle, .theme-toggle-top').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });

    // Navigation triggers
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    // Form Submissions
    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
        subjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subject = {
                id: 'subj_' + Date.now(),
                name: document.getElementById('subjectName').value.trim(),
                code: document.getElementById('subjectCode').value.trim(),
                credits: parseFloat(document.getElementById('subjectCredits').value),
                instructor: document.getElementById('subjectInstructor').value.trim(),
                semester: document.getElementById('subjectSemester').value.trim(),
                assessments: [],
                createdAt: new Date().toISOString()
            };
            appData.subjects.push(subject);
            saveAndRefresh();
            closeModal('subjectModal');
        });
    }

    const assessmentForm = document.getElementById('assessmentForm');
    if (assessmentForm) {
        assessmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subjectId = document.getElementById('assessmentSubjectId').value;
            const editingAssessmentId = document.getElementById('editingAssessmentId').value;
            const subject = appData.subjects.find(s => s.id === subjectId);

            if (subject) {
                const assessmentData = {
                    name: document.getElementById('assessmentName').value.trim(),
                    type: document.getElementById('assessmentType').value,
                    weight: parseFloat(document.getElementById('assessmentWeight').value),
                    score: document.getElementById('assessmentScore').value.trim() !== '' ? parseFloat(document.getElementById('assessmentScore').value) : null,
                    maxScore: parseFloat(document.getElementById('assessmentMaxScore').value),
                    dueDate: document.getElementById('assessmentDueDate').value || null,
                };

                if (assessmentData.maxScore <= 0) {
                    alert("Max Score must be greater than 0.");
                    return;
                }
                if (assessmentData.score !== null && assessmentData.score > assessmentData.maxScore) {
                    alert("Your score cannot be greater than the Max Possible Score.");
                    return;
                }

                if (editingAssessmentId) {
                    const assessmentIndex = subject.assessments.findIndex(a => a.id === editingAssessmentId);
                    if (assessmentIndex > -1) {
                        subject.assessments[assessmentIndex] = { ...subject.assessments[assessmentIndex], ...assessmentData };
                    }
                } else {
                    const newAssessment = {
                        id: 'asm_' + Date.now(),
                        ...assessmentData,
                        createdAt: new Date().toISOString()
                    };
                    subject.assessments.push(newAssessment);
                }

                delete activeSimulations[subjectId];
                saveAndRefresh();
                closeModal('assessmentModal');
            }
        });
    }

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const task = {
                id: 'task_' + Date.now(),
                title: document.getElementById('taskTitle').value.trim(),
                subjectId: document.getElementById('taskSubject').value || null,
                dueDate: document.getElementById('taskDueDate').value || null,
                priority: document.getElementById('taskPriority').value,
                completed: false,
                createdAt: new Date().toISOString()
            };
            appData.tasks.push(task);
            saveAndRefresh();
            closeModal('taskModal');
        });
    }

    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const goalType = document.getElementById('goalType').value;
            const goal = {
                id: 'goal_' + Date.now(),
                title: document.getElementById('goalTitle').value.trim(),
                type: goalType,
                subjectId: goalType === 'SubjectGrade' ? document.getElementById('goalSubjectId').value : null,
                target: document.getElementById('goalTarget').value.trim(),
                deadline: document.getElementById('goalDeadline').value || null,
                completed: false,
                createdAt: new Date().toISOString()
            };
            if (goalType === 'SubjectGrade' && !goal.subjectId) {
                alert("Please select a subject for the goal.");
                return;
            }
            appData.goals.push(goal);
            saveAndRefresh();
            closeModal('goalModal');
        });
    }

    const goalTypeSelect = document.getElementById('goalType');
    if (goalTypeSelect) {
        goalTypeSelect.addEventListener('change', (e) => {
            toggleGoalSubjectSelect(e.target.value);
        });
    }

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            appData.settings.studentName = document.getElementById('settingsStudentName').value.trim() || 'My Academic Journey';
            appData.settings.totalCreditsRequired = parseInt(document.getElementById('settingsTotalCredits').value) || 120;
            appData.settings.gradingScale = document.getElementById('settingsGradingScale').value;
            saveAndRefresh();
            closeModal('settingsModal');
        });
    }

    // Schedule Generator Trigger
    const btnGenerateSchedule = document.getElementById('btnGenerateSchedule');
    if (btnGenerateSchedule) {
        btnGenerateSchedule.addEventListener('click', generateSmartSchedule);
    }

    // Event Delegation for dynamic buttons & sliders
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const subjectId = btn.getAttribute('data-subject-id');
        const assessmentId = btn.getAttribute('data-assessment-id');
        const taskId = btn.getAttribute('data-task-id');
        const goalId = btn.getAttribute('data-goal-id');
        const dayKey = btn.getAttribute('data-day-key');
        const slotId = btn.getAttribute('data-slot-id');

        if (action === 'open-subject-modal') openSubjectModal();
        else if (action === 'open-task-modal') openTaskModal();
        else if (action === 'open-goal-modal') openGoalModal();
        else if (action === 'open-settings-modal') openSettingsModal();
        else if (action === 'print-report') printReport();
        else if (action === 'export-data') exportData();
        else if (action === 'add-assessment') openAssessmentModal(subjectId);
        else if (action === 'edit-assessment') openAssessmentModal(subjectId, assessmentId);
        else if (action === 'delete-assessment') deleteAssessment(subjectId, assessmentId, saveAndRefresh);
        else if (action === 'delete-subject') deleteSubject(subjectId, saveAndRefresh);
        else if (action === 'toggle-simulator') toggleSimulator(subjectId);
        else if (action === 'toggle-task') toggleTask(taskId, saveAndRefresh);
        else if (action === 'delete-task') deleteTask(taskId, saveAndRefresh);
        else if (action === 'toggle-goal') toggleGoal(goalId, saveAndRefresh);
        else if (action === 'delete-goal') deleteGoal(goalId, saveAndRefresh);
        else if (action === 'toggle-slot-complete') toggleSlotComplete(dayKey, slotId);
    });

    document.addEventListener('input', (e) => {
        if (e.target.matches('[data-action="slider-change"]')) {
            const subjectId = e.target.getAttribute('data-subject-id');
            const assessmentId = e.target.getAttribute('data-assessment-id');
            onSliderSimChange(subjectId, assessmentId, e.target.value);
        }
    });

    // Auto re-generate schedule when dropdown options or study days change
    ['schedStrategy', 'schedStudyDuration', 'schedBreakDuration', 'schedStartTime', 'schedEndTime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                generateSmartSchedule();
            });
        }
    });

    document.querySelectorAll('.schedule-days-selector input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            generateSmartSchedule();
        });
    });

    // Pomodoro Timer Controls & Sound Test
    document.querySelectorAll('#timerPlayBtn, #mainTimerPlayBtn').forEach(btn => {
        btn.addEventListener('click', toggleTimer);
    });

    document.querySelectorAll('#timerResetBtn, #mainTimerResetBtn').forEach(btn => {
        btn.addEventListener('click', resetTimer);
    });

    const soundTestBtn = document.getElementById('pomodoroSoundTestBtn');
    if (soundTestBtn) {
        soundTestBtn.addEventListener('click', () => {
            playAlarmSound();
        });
    }

    document.querySelectorAll('.pomodoro-modes .btn-mode, [data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode') || (btn.textContent.includes('25m') ? 'study' : btn.textContent.includes('50m') ? 'deep' : btn.textContent.includes('Short') || btn.textContent.includes('5m') ? 'short' : 'long');
            setTimerMode(mode);
        });
    });

    // File import listener
    const importFileInput = document.getElementById('importFile');
    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            importData(e, saveAndRefresh);
        });
    }

    updateTimerDisplay();
});
