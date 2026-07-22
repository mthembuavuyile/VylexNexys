// Achieva Subjects Module - Subject Portfolio, Assessments & Grade Simulator

import { appData, saveData } from './store.js';

export let activeSimulations = {};

// Grade conversions
export function gradeToGPA(percentage) {
    if (percentage === null || isNaN(percentage)) return 0;
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 60) return 1.0;
    return 0.0;
}

export function getCAPSLevelShort(percentage) {
    if (percentage === null || isNaN(percentage)) return 'N/A';
    if (percentage >= 80) return 'L7';
    if (percentage >= 70) return 'L6';
    if (percentage >= 60) return 'L5';
    if (percentage >= 50) return 'L4';
    if (percentage >= 40) return 'L3';
    if (percentage >= 30) return 'L2';
    return 'L1';
}

export function getCAPSLevelFull(percentage) {
    if (percentage === null || isNaN(percentage)) return 'N/A';
    if (percentage >= 80) return 'Level 7 (Outstanding Achievement, 80-100%)';
    if (percentage >= 70) return 'Level 6 (Meritorious Achievement, 70-79%)';
    if (percentage >= 60) return 'Level 5 (Substantial Achievement, 60-69%)';
    if (percentage >= 50) return 'Level 4 (Adequate Achievement, 50-59%)';
    if (percentage >= 40) return 'Level 3 (Moderate Achievement, 40-49%)';
    if (percentage >= 30) return 'Level 2 (Elementary Achievement, 30-39%)';
    return 'Level 1 (Not Achieved, 0-29%)';
}

export function formatGradeDisplay(percentage) {
    if (percentage === null || isNaN(percentage)) return 'N/A';
    const scale = appData.settings.gradingScale || 'US_GPA';

    if (scale === 'US_GPA') {
        return `${gradeToGPA(percentage).toFixed(2)} GPA`;
    } else if (scale === 'SA_CAPS') {
        return `${getCAPSLevelShort(percentage)} (${percentage.toFixed(0)}%)`;
    } else {
        return `${percentage.toFixed(1)}%`;
    }
}

export function calculateSubjectGrade(subject) {
    if (!subject || !subject.assessments) return { currentContributionToFinal: null, totalWeightAchieved: 0, weightedAverageOfGraded: null };

    let totalAchievedScoreContribution = 0;
    let totalWeightOfGradedAssessments = 0;

    subject.assessments.forEach(assessment => {
        if (assessment.score !== null && typeof assessment.score === 'number' && assessment.maxScore > 0 && assessment.weight > 0) {
            totalAchievedScoreContribution += (assessment.score / assessment.maxScore) * assessment.weight;
            totalWeightOfGradedAssessments += assessment.weight;
        }
    });

    const weightedAverageOfGraded = totalWeightOfGradedAssessments > 0 ? (totalAchievedScoreContribution / totalWeightOfGradedAssessments) * 100 : null;

    return {
        currentContributionToFinal: subject.assessments.length > 0 ? totalAchievedScoreContribution : null,
        totalWeightAchieved: totalWeightOfGradedAssessments,
        weightedAverageOfGraded: weightedAverageOfGraded
    };
}

export function calculateOverallPerformance() {
    let totalWeightedPercent = 0;
    let totalCredits = 0;

    appData.subjects.forEach(subject => {
        const gradeInfo = calculateSubjectGrade(subject);
        if (gradeInfo.weightedAverageOfGraded !== null && subject.credits > 0) {
            totalWeightedPercent += gradeInfo.weightedAverageOfGraded * subject.credits;
            totalCredits += subject.credits;
        }
    });

    return totalCredits > 0 ? totalWeightedPercent / totalCredits : null;
}

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function renderSubjects(refreshCallback) {
    const container = document.getElementById('subjectsList');
    if (!container) return;

    if (appData.subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p>No subjects added yet. Click "Add Subject" to begin tracking your academics.</p>
            </div>`;
        return;
    }

    container.innerHTML = appData.subjects.map(subject => {
        const gradeInfo = calculateSubjectGrade(subject);
        let gradeDisplayHTML = '';

        if (gradeInfo.currentContributionToFinal !== null) {
            const gradeVal = gradeInfo.weightedAverageOfGraded;
            gradeDisplayHTML = `
                <div class="grade-number">${formatGradeDisplay(gradeVal)}</div>
                <div class="grade-label">Weighted Average</div>
                <div class="grade-label-small">(${gradeInfo.totalWeightAchieved.toFixed(1)}% of syllabus graded)</div>
                <div class="grade-label-small">Final contribution: ${gradeInfo.currentContributionToFinal.toFixed(1)}%</div>
            `;
        } else {
            gradeDisplayHTML = `<div class="grade-number">N/A</div><div class="grade-label">No assessments scored</div>`;
        }

        const isSimOpen = activeSimulations[subject.id] !== undefined;

        return `
            <div class="card subject-card" id="subject-${subject.id}">
                <div class="subject-header">
                    <div class="subject-info">
                        <span class="subject-code">${subject.code || 'No Code'}</span>
                        <h4>${subject.name}</h4>
                        <div class="subject-meta">
                            <span><i class="fa-solid fa-graduation-cap"></i> ${subject.credits} Credits</span>
                            ${subject.instructor ? `<span><i class="fa-solid fa-user-tie"></i> ${subject.instructor}</span>` : ''}
                            ${subject.semester ? `<span><i class="fa-solid fa-clock"></i> ${subject.semester}</span>` : ''}
                        </div>
                    </div>
                    <div class="subject-grade">${gradeDisplayHTML}</div>
                </div>
                
                <div class="assessments-section">
                    <div class="assessments-header">
                        <h4>Assessments Portfolio</h4>
                        <button class="btn btn-primary btn-sm" data-action="add-assessment" data-subject-id="${subject.id}">
                            <i class="fa-solid fa-plus"></i> Add Assessment
                        </button>
                    </div>
                    <div class="assessment-list">
                        ${subject.assessments.length === 0 ?
                '<p class="empty-state" style="padding:1.5rem; font-size:0.85rem;"><i class="fa-solid fa-circle-info"></i> No assessments added yet for this subject.</p>' :
                subject.assessments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(asm => `
                                <div class="assessment-item">
                                    <div class="assessment-info">
                                        <span class="assessment-name">${asm.name}</span>
                                        <div class="assessment-details">
                                            <span><i class="fa-solid fa-tags"></i> ${asm.type}</span>
                                            <span><i class="fa-solid fa-weight-hanging"></i> Weight: ${asm.weight}%</span>
                                            <span><i class="fa-solid fa-bullseye"></i> Max: ${asm.maxScore}</span>
                                            ${asm.dueDate ? `<span><i class="fa-solid fa-calendar-day"></i> Due: ${formatDate(asm.dueDate)}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="assessment-score">
                                        ${asm.score !== null ?
                        `<span class="score-value">${asm.score}/${asm.maxScore} (${((asm.score / asm.maxScore) * 100).toFixed(1)}%)</span>
                                             <div class="score-weight">Contrib: ${((asm.score / asm.maxScore) * asm.weight).toFixed(1)}%</div>` :
                        '<span class="score-value" style="color:var(--warning);"><i class="fa-solid fa-spinner fa-spin"></i> Pending</span>'
                    }
                                    </div>
                                    <div style="display:flex; gap:0.25rem;">
                                        <button class="btn-icon" title="Edit Assessment" data-action="edit-assessment" data-subject-id="${subject.id}" data-assessment-id="${asm.id}">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                        <button class="btn-icon btn-danger-icon" title="Delete Assessment" data-action="delete-assessment" data-subject-id="${subject.id}" data-assessment-id="${asm.id}">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')
            }
                    </div>
                    ${subject.assessments.length > 0 ? `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; font-size:0.8rem; font-weight:600; color:var(--text-light);">
                            <span>Total Syllabus Defined: ${subject.assessments.reduce((sum, a) => sum + a.weight, 0).toFixed(1)}%</span>
                            <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.65rem;" data-action="toggle-simulator" data-subject-id="${subject.id}">
                                <i class="fa-solid fa-sliders"></i> What-If Simulator
                            </button>
                        </div>` : ''
            }
                </div>

                <!-- What-if simulation drawer -->
                <div class="simulator-drawer" id="simulator-${subject.id}" style="display: ${isSimOpen ? 'block' : 'none'};">
                    <h5><i class="fa-solid fa-sliders"></i> What-If Grade Simulator</h5>
                    <p class="simulator-intro">Simulate expected marks on ungraded assessments to forecast final subject marks.</p>
                    <div class="simulator-sliders-list" id="simulator-sliders-${subject.id}"></div>
                    <div class="simulator-summary">
                        <div class="simulated-badge">
                            <span>Simulated Contribution</span>
                            <strong id="simulated-mark-${subject.id}">--%</strong>
                        </div>
                        <div class="simulated-badge">
                            <span>Simulated Mark / Level</span>
                            <strong id="simulated-gpa-${subject.id}">--</strong>
                        </div>
                    </div>
                </div>

                <div class="subject-actions">
                    <span class="grade-label-small">Created: ${formatDate(subject.createdAt)}</span>
                    <button class="btn btn-danger btn-sm" data-action="delete-subject" data-subject-id="${subject.id}">
                        <i class="fa-solid fa-trash"></i> Delete Subject
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Restore active simulation slider views
    Object.keys(activeSimulations).forEach(subjId => {
        renderSimulatorSliders(subjId);
        updateSimulationResult(subjId);
    });
}

export function toggleSimulator(subjectId) {
    const drawer = document.getElementById(`simulator-${subjectId}`);
    if (!drawer) return;

    if (activeSimulations[subjectId] !== undefined) {
        drawer.style.display = 'none';
        delete activeSimulations[subjectId];
    } else {
        drawer.style.display = 'block';
        const subject = appData.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        activeSimulations[subjectId] = {};
        subject.assessments.forEach(asm => {
            if (asm.score === null) {
                activeSimulations[subjectId][asm.id] = 75;
            }
        });

        renderSimulatorSliders(subjectId);
        updateSimulationResult(subjectId);
    }
}

export function renderSimulatorSliders(subjectId) {
    const subject = appData.subjects.find(s => s.id === subjectId);
    const container = document.getElementById(`simulator-sliders-${subjectId}`);
    if (!subject || !container) return;

    const pendingAssessments = subject.assessments.filter(a => a.score === null);
    if (pendingAssessments.length === 0) {
        container.innerHTML = `<p class="simulator-intro" style="color:var(--success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> All assessments are already graded!</p>`;
        return;
    }

    container.innerHTML = pendingAssessments.map(asm => {
        const currentSimVal = activeSimulations[subjectId][asm.id] !== undefined ? activeSimulations[subjectId][asm.id] : 75;
        return `
            <div class="simulator-slider-item">
                <div class="slider-info">
                    <span class="slider-name">${asm.name} <small>(Weight: ${asm.weight}%)</small></span>
                    <span class="slider-value" id="sim-val-${subjectId}-${asm.id}">${currentSimVal}%</span>
                </div>
                <input type="range" class="sim-slider" min="0" max="100" value="${currentSimVal}" 
                       data-action="slider-change" data-subject-id="${subjectId}" data-assessment-id="${asm.id}">
            </div>
        `;
    }).join('');
}

export function onSliderSimChange(subjectId, assessmentId, value) {
    if (!activeSimulations[subjectId]) activeSimulations[subjectId] = {};
    activeSimulations[subjectId][assessmentId] = parseFloat(value);
    const valEl = document.getElementById(`sim-val-${subjectId}-${assessmentId}`);
    if (valEl) valEl.textContent = `${value}%`;
    updateSimulationResult(subjectId);
}

export function updateSimulationResult(subjectId) {
    const subject = appData.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    let totalAchievedScoreContribution = 0;
    let totalWeight = 0;

    subject.assessments.forEach(asm => {
        if (asm.score !== null) {
            totalAchievedScoreContribution += (asm.score / asm.maxScore) * asm.weight;
            totalWeight += asm.weight;
        } else if (activeSimulations[subjectId] && activeSimulations[subjectId][asm.id] !== undefined) {
            const simScore = activeSimulations[subjectId][asm.id];
            totalAchievedScoreContribution += (simScore / 100) * asm.weight;
            totalWeight += asm.weight;
        }
    });

    const markEl = document.getElementById(`simulated-mark-${subjectId}`);
    const gpaEl = document.getElementById(`simulated-gpa-${subjectId}`);

    if (markEl) markEl.textContent = `${totalAchievedScoreContribution.toFixed(1)}%`;
    if (gpaEl) {
        const avgPercentage = totalWeight > 0 ? (totalAchievedScoreContribution / totalWeight) * 100 : 0;
        gpaEl.textContent = formatGradeDisplay(avgPercentage);
    }
}

export function deleteSubject(subjectId, refreshCallback) {
    if (confirm('Are you sure you want to delete this subject and all its assessments? This cannot be undone.')) {
        appData.subjects = appData.subjects.filter(s => s.id !== subjectId);
        appData.tasks = appData.tasks.filter(t => t.subjectId !== subjectId);
        appData.goals = appData.goals.filter(g => !(g.type === 'SubjectGrade' && g.subjectId === subjectId));
        delete activeSimulations[subjectId];
        saveData();
        if (typeof refreshCallback === 'function') refreshCallback();
    }
}

export function deleteAssessment(subjectId, assessmentId, refreshCallback) {
    const subject = appData.subjects.find(s => s.id === subjectId);
    if (subject && confirm('Delete this assessment?')) {
        subject.assessments = subject.assessments.filter(a => a.id !== assessmentId);
        delete activeSimulations[subjectId];
        saveData();
        if (typeof refreshCallback === 'function') refreshCallback();
    }
}
