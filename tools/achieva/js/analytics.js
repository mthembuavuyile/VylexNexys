// Achieva Analytics Module - Chart.js Charts Rendering & Data Visualizations

import { appData } from './store.js';
import { calculateSubjectGrade } from './subjects.js';

let gradeChart = null;
let trendsChart = null;
let creditsChart = null;

export function renderAnalyticsCharts() {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(13, 71, 161, 0.04)';

    // 1. Grade Profile Chart
    const gradeCanvas = document.getElementById('gradeChartCanvas');
    if (gradeCanvas) {
        if (gradeChart) gradeChart.destroy();

        if (appData.subjects.length === 0) {
            renderChartEmptyState(gradeCanvas.parentNode, '📊', 'Add subjects & scores to plot analytics.');
        } else {
            clearChartEmptyState(gradeCanvas.parentNode, gradeCanvas);
            const subjectLabels = appData.subjects.map(s => s.name);
            const subjectAverages = appData.subjects.map(s => {
                const gradeInfo = calculateSubjectGrade(s);
                return gradeInfo.weightedAverageOfGraded !== null ? gradeInfo.weightedAverageOfGraded : 0;
            });

            const targets = appData.subjects.map(s => {
                const goal = appData.goals.find(g => g.type === 'SubjectGrade' && g.subjectId === s.id);
                return goal ? parseFloat(goal.target) : null;
            });

            const ctx = gradeCanvas.getContext('2d');
            gradeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: subjectLabels,
                    datasets: [
                        {
                            label: 'Current Mark (%)',
                            data: subjectAverages,
                            backgroundColor: 'rgba(70, 130, 180, 0.65)',
                            borderColor: '#4682b4',
                            borderWidth: 1.5,
                            borderRadius: 6
                        },
                        {
                            label: 'Target Mark (%)',
                            data: targets.map(t => t === null ? 0 : t),
                            type: 'line',
                            borderColor: '#e8491d',
                            borderDash: [5, 5],
                            fill: false,
                            pointBackgroundColor: '#e8491d',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } }
                    },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }
                    }
                }
            });
        }
    }

    // 2. Trend Performance Chart
    const trendsCanvas = document.getElementById('trendsChartCanvas');
    if (trendsCanvas) {
        if (trendsChart) trendsChart.destroy();

        const semData = {};
        appData.subjects.forEach(subject => {
            const sem = subject.semester || 'Other';
            const gradeInfo = calculateSubjectGrade(subject);
            if (gradeInfo.weightedAverageOfGraded !== null) {
                if (!semData[sem]) semData[sem] = { sum: 0, count: 0 };
                semData[sem].sum += gradeInfo.weightedAverageOfGraded;
                semData[sem].count++;
            }
        });

        const semesters = Object.keys(semData);
        if (semesters.length === 0) {
            renderChartEmptyState(trendsCanvas.parentNode, '📈', 'Add semester variables to view trends.');
        } else {
            clearChartEmptyState(trendsCanvas.parentNode, trendsCanvas);
            const averages = semesters.map(s => semData[s].sum / semData[s].count);

            const ctx = trendsCanvas.getContext('2d');
            trendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: semesters,
                    datasets: [{
                        label: 'Semester Average (%)',
                        data: averages,
                        borderColor: '#5f9ea0',
                        backgroundColor: 'rgba(95, 158, 160, 0.15)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.25,
                        pointBackgroundColor: '#5f9ea0',
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } }
                    },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }
                    }
                }
            });
        }
    }

    // 3. Credits Progress Chart
    const creditsCanvas = document.getElementById('creditsChartCanvas');
    if (creditsCanvas) {
        if (creditsChart) creditsChart.destroy();

        const enrolled = appData.subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
        const targetTotal = appData.settings.totalCreditsRequired || 120;
        const remaining = Math.max(targetTotal - enrolled, 0);

        clearChartEmptyState(creditsCanvas.parentNode, creditsCanvas);

        const ctx = creditsCanvas.getContext('2d');
        creditsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Enrolled Credits', 'Remaining Credits Goal'],
                datasets: [{
                    data: [enrolled, remaining],
                    backgroundColor: ['#4682b4', isDark ? '#334155' : '#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } }
                },
                cutout: '75%'
            }
        });
    }
}

export function renderChartEmptyState(parentNode, icon, text) {
    const canvas = parentNode.querySelector('canvas');
    if (canvas) canvas.style.display = 'none';

    let placeholder = parentNode.querySelector('.empty-state-placeholder');
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'empty-state-placeholder empty-state';
        parentNode.appendChild(placeholder);
    }
    placeholder.innerHTML = `<div class="empty-state-icon">${icon}</div><p>${text}</p>`;
    placeholder.style.display = 'block';
}

export function clearChartEmptyState(parentNode, canvas) {
    if (canvas) canvas.style.display = 'block';
    const placeholder = parentNode.querySelector('.empty-state-placeholder');
    if (placeholder) placeholder.style.display = 'none';
}
