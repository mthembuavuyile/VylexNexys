// Achieva Goals Module - Targets, Goal Progress & Feasibility Calculations

import { appData, saveData } from './store.js';
import { calculateSubjectGrade, calculateOverallPerformance, gradeToGPA, formatDate } from './subjects.js';

export function calculateWhatsNeeded(subject, targetFinalGrade) {
    const gradeInfo = calculateSubjectGrade(subject);
    const currentContribution = gradeInfo.currentContributionToFinal || 0;
    const weightAchieved = gradeInfo.totalWeightAchieved || 0;
    const assumedTotalModuleWeight = 100;
    const remainingWeight = assumedTotalModuleWeight - weightAchieved;

    if (currentContribution >= targetFinalGrade && weightAchieved >= assumedTotalModuleWeight) {
        return { achievable: true, message: `<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> Target of ${targetFinalGrade}% achieved! Final Mark: ${currentContribution.toFixed(1)}%.`, currentMark: currentContribution };
    }
    if (currentContribution >= targetFinalGrade && weightAchieved < assumedTotalModuleWeight) {
        return { achievable: true, message: `<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> Target of ${targetFinalGrade}% already secured with ${currentContribution.toFixed(1)}% from graded works.`, currentMark: currentContribution };
    }

    if (remainingWeight <= 0) {
        return {
            achievable: currentContribution >= targetFinalGrade,
            message: currentContribution >= targetFinalGrade ?
                `<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> Target achieved! Final Mark: ${currentContribution.toFixed(1)}%` :
                `<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i> Target of ${targetFinalGrade}% missed. Final: ${currentContribution.toFixed(1)}%.`,
            currentMark: currentContribution
        };
    }

    const scorePointsNeededFromRemainingWeight = targetFinalGrade - currentContribution;

    if (scorePointsNeededFromRemainingWeight <= 0) {
        return {
            achievable: true,
            message: `<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> Target of ${targetFinalGrade}% achieved (currently at ${currentContribution.toFixed(1)}%)!`,
            currentMark: currentContribution
        };
    }

    const averagePercentageNeededOnRemaining = (scorePointsNeededFromRemainingWeight / remainingWeight) * 100;

    if (averagePercentageNeededOnRemaining > 100) {
        return {
            achievable: false,
            message: `<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> Unachievable: Needs <strong>${averagePercentageNeededOnRemaining.toFixed(1)}%</strong> average on remaining assessments to hit target.`,
            currentMark: currentContribution
        };
    } else {
        return {
            achievable: true,
            message: `<i class="fa-solid fa-circle-info" style="color:var(--primary)"></i> Needs an average of <strong>${averagePercentageNeededOnRemaining.toFixed(1)}%</strong> on remaining assessments to achieve ${targetFinalGrade}%.`,
            currentMark: currentContribution
        };
    }
}

export function calculateGoalProgress(goal) {
    if (goal.completed) return 100;
    if (goal.type === 'GPA') {
        const currentGPA = calculateOverallPerformance();
        const targetGPA = parseFloat(goal.target);
        if (currentGPA === null || isNaN(targetGPA) || targetGPA === 0) return 0;

        const scale = appData.settings.gradingScale || 'US_GPA';
        if (scale === 'US_GPA') {
            const currentGPANum = gradeToGPA(currentGPA);
            return Math.min((currentGPANum / targetGPA) * 100, 100);
        } else {
            return Math.min((currentGPA / targetGPA) * 100, 100);
        }
    } else if (goal.type === 'SubjectGrade' && goal.subjectId) {
        const subject = appData.subjects.find(s => s.id === goal.subjectId);
        if (subject) {
            const gradeInfo = calculateSubjectGrade(subject);
            const currentMark = gradeInfo.currentContributionToFinal || 0;
            const targetMark = parseFloat(goal.target);
            return targetMark > 0 ? Math.min((currentMark / targetMark) * 100, 100) : 0;
        }
    } else if (goal.type === 'TaskCompletion') {
        const targetTasks = parseInt(goal.target) || 1;
        const completedTasks = appData.tasks.filter(t => t.completed).length;
        return Math.min((completedTasks / targetTasks) * 100, 100);
    }
    return 0;
}

export function renderGoals() {
    const container = document.getElementById('goalsList');
    if (!container) return;

    if (appData.goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p>No academic goals set. Add targets to monitor your semester progress.</p>
            </div>`;
        return;
    }

    container.innerHTML = appData.goals.sort((a, b) => a.completed - b.completed || new Date(a.createdAt) - new Date(b.createdAt)).map(goal => {
        let progress = calculateGoalProgress(goal);
        let statusMessage = '';

        if (goal.type === 'SubjectGrade' && goal.subjectId) {
            const subject = appData.subjects.find(s => s.id === goal.subjectId);
            if (subject) {
                const targetGrade = parseFloat(goal.target);
                if (!isNaN(targetGrade)) {
                    const neededInfo = calculateWhatsNeeded(subject, targetGrade);
                    statusMessage = `<p class="goal-status-message">${neededInfo.message}</p>`;
                }
            } else {
                statusMessage = `<p class="goal-status-message">Associated subject was deleted.</p>`;
            }
        }

        return `
            <div class="card goal-card ${goal.completed ? 'completed' : ''}">
                <div class="goal-content">
                    <div class="goal-info">
                        <h4 class="goal-title">${goal.title}</h4>
                        <div class="goal-meta">
                            <span><strong>Type:</strong> ${goal.type === 'GPA' ? 'GPA Target' : goal.type === 'SubjectGrade' ? 'Subject Grade Target' : goal.type === 'TaskCompletion' ? 'Task Completion' : 'Personal Target'}</span>
                            <span><strong>Target:</strong> ${goal.target}${goal.type === 'SubjectGrade' ? '%' : ''}</span>
                            ${goal.subjectId && appData.subjects.find(s => s.id === goal.subjectId) ? `<span><strong>Subject:</strong> ${appData.subjects.find(s => s.id === goal.subjectId).name}</span>` : ''}
                            ${goal.deadline ? `<span><strong>Deadline:</strong> ${formatDate(goal.deadline)}</span>` : ''}
                        </div>
                        ${statusMessage}
                        ${goal.type !== 'SubjectGrade' || !statusMessage ? `
                            <div class="goal-progress">
                                <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                                <span class="progress-text">${progress.toFixed(0)}% Completed</span>
                            </div>` : ''
            }
                    </div>
                    <div class="goal-actions">
                        <button class="btn btn-sm ${goal.completed ? 'btn-secondary' : 'btn-primary'}" data-action="toggle-goal" data-goal-id="${goal.id}">
                            <i class="fa-solid ${goal.completed ? 'fa-arrow-rotate-left' : 'fa-check'}"></i> ${goal.completed ? 'Reopen' : 'Done'}
                        </button>
                        <button class="btn-icon btn-danger-icon" data-action="delete-goal" data-goal-id="${goal.id}" title="Delete Goal">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function toggleGoal(goalId, refreshCallback) {
    const goal = appData.goals.find(g => g.id === goalId);
    if (goal) {
        goal.completed = !goal.completed;
        saveData();
        if (typeof refreshCallback === 'function') refreshCallback();
    }
}

export function deleteGoal(goalId, refreshCallback) {
    if (confirm('Delete this goal?')) {
        appData.goals = appData.goals.filter(g => g.id !== goalId);
        saveData();
        if (typeof refreshCallback === 'function') refreshCallback();
    }
}
