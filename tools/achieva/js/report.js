// Achieva Report Module - Academic Report Generator & Print Functionality

import { appData } from './store.js';
import { calculateOverallPerformance, calculateSubjectGrade, gradeToGPA, getCAPSLevelFull, formatGradeDisplay } from './subjects.js';

export function generateReportOnTab() {
    const reportContainer = document.getElementById('reportContentContainer');
    if (!reportContainer) return;

    let html = `<div id="actualReportContent" style="padding:1rem;">`;
    html += `<h2 style="text-align:center; font-family:var(--font-head); margin-bottom:0.25rem;">Academic Report Profile</h2>`;
    html += `<p style="text-align:center; color:var(--text-light); margin-bottom:1.5rem;">Vylex Nexys • Smart Planner Analytics</p>`;

    html += `<div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; background-color:var(--bg-layout); padding:1.25rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:2rem;">`;
    html += `<div><strong>Student Name:</strong> ${appData.settings.studentName}</div>`;
    html += `<div><strong>Date Compiled:</strong> ${new Date().toLocaleDateString()}</div>`;

    const performance = calculateOverallPerformance();
    const scale = appData.settings.gradingScale || 'US_GPA';
    let summaryGrade = 'N/A';
    if (performance !== null) {
        if (scale === 'US_GPA') {
            summaryGrade = `${gradeToGPA(performance).toFixed(2)} GPA (${performance.toFixed(1)}%)`;
        } else if (scale === 'SA_CAPS') {
            summaryGrade = `${getCAPSLevelFull(performance)}`;
        } else {
            summaryGrade = `${performance.toFixed(1)}%`;
        }
    }

    html += `<div><strong>Performance Summary:</strong> ${summaryGrade}</div>`;
    html += `</div>`;

    html += `<h3 style="font-family:var(--font-head); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-graduation-cap"></i> Subject Performance Analysis</h3>`;

    if (appData.subjects.length === 0) {
        html += `<p class="empty-state">No academic subjects configured to compile this report.</p>`;
    } else {
        appData.subjects.forEach(subject => {
            const gradeInfo = calculateSubjectGrade(subject);
            const hasGrades = gradeInfo.weightedAverageOfGraded !== null;

            html += `<div style="border:1px solid var(--border-color); padding:1.25rem; border-radius:var(--radius-sm); margin-bottom:1.25rem; background-color:var(--bg-card);">`;
            html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap;">`;
            html += `<h4 style="font-family:var(--font-head);">${subject.name} (${subject.code || 'N/A'})</h4>`;
            html += `<span style="font-weight:800; color:var(--primary-dark);">${hasGrades ? formatGradeDisplay(gradeInfo.weightedAverageOfGraded) : 'N/A'}</span>`;
            html += `</div>`;

            html += `<div style="font-size:0.8rem; color:var(--text-light); margin-bottom:0.75rem;">Credits: ${subject.credits} • Graded syllabus: ${gradeInfo.totalWeightAchieved.toFixed(1)}%</div>`;

            if (subject.assessments.length > 0) {
                html += `<table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-top:0.5rem;">`;
                html += `<thead><tr style="border-bottom:1px solid var(--border-color); text-align:left; color:var(--text-light);"><th style="padding:0.4rem;">Assessment</th><th style="padding:0.4rem;">Type</th><th style="padding:0.4rem;">Weight</th><th style="padding:0.4rem;">Score</th><th style="padding:0.4rem; text-align:right;">Contribution</th></tr></thead>`;
                html += `<tbody>`;
                subject.assessments.forEach(asm => {
                    const contribVal = (asm.score !== null) ? ((asm.score / asm.maxScore) * asm.weight) : 0;
                    html += `<tr style="border-bottom:1px solid var(--border-color); opacity:${asm.score === null ? '0.5' : '1'};">`;
                    html += `<td style="padding:0.4rem; font-weight:700;">${asm.name}</td>`;
                    html += `<td style="padding:0.4rem;">${asm.type}</td>`;
                    html += `<td style="padding:0.4rem;">${asm.weight}%</td>`;
                    html += `<td style="padding:0.4rem;">${asm.score !== null ? `${asm.score}/${asm.maxScore}` : 'Pending'}</td>`;
                    html += `<td style="padding:0.4rem; text-align:right; font-weight:700;">${asm.score !== null ? `${contribVal.toFixed(1)}%` : '--'}</td>`;
                    html += `</tr>`;
                });
                html += `</tbody></table>`;
            } else {
                html += `<p style="font-size:0.8rem; color:var(--text-light);"><i class="fa-solid fa-circle-info"></i> No assessments entered for this subject.</p>`;
            }
            html += `</div>`;
        });
    }
    html += `</div>`;
    reportContainer.innerHTML = html;
}

export function printReport() {
    generateReportOnTab();
    window.print();
}
