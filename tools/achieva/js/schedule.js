// Achieva Schedule Module - Smart Study Schedule Generator & Deadlines Tracker

import { appData, saveData } from './store.js';
import { formatDate } from './subjects.js';

// --- Smart Study Schedule Generator ---

export function generateSmartSchedule() {
    const dayCheckboxes = document.querySelectorAll('.schedule-days-selector input[type="checkbox"]:checked');
    const selectedDays = Array.from(dayCheckboxes).map(cb => cb.value);

    const startTimeInput = document.getElementById('schedStartTime')?.value || '09:00';
    const endTimeInput = document.getElementById('schedEndTime')?.value || '17:00';
    const studyDuration = parseInt(document.getElementById('schedStudyDuration')?.value || '45');
    const breakDuration = parseInt(document.getElementById('schedBreakDuration')?.value || '15');
    const strategy = document.getElementById('schedStrategy')?.value || 'priority';

    if (selectedDays.length === 0) {
        alert('Please select at least one study day.');
        return;
    }

    // Save schedule settings
    appData.scheduleSettings = {
        days: selectedDays,
        startTime: startTimeInput,
        endTime: endTimeInput,
        studyDuration,
        breakDuration,
        strategy
    };

    // Gather subject priorities & weights based on strategy
    let subjectsPool = [];
    if (appData.subjects.length > 0) {
        appData.subjects.forEach(subj => {
            let weight = 1;
            if (strategy === 'priority') {
                const goal = appData.goals.find(g => g.type === 'SubjectGrade' && g.subjectId === subj.id);
                const targetGrade = goal ? parseFloat(goal.target) : 75;
                weight = Math.max(1, Math.round(targetGrade / 20));
            } else if (strategy === 'deadline') {
                const soonestAsm = subj.assessments
                    .filter(a => a.score === null && a.dueDate)
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
                if (soonestAsm) {
                    const daysDiff = (new Date(soonestAsm.dueDate) - new Date()) / (1000 * 3600 * 24);
                    weight = daysDiff <= 3 ? 4 : daysDiff <= 7 ? 3 : 2;
                } else {
                    weight = 1;
                }
            } else { // balanced
                weight = 1;
            }
            subjectsPool.push({ id: subj.id, name: subj.name, code: subj.code || '', weight });
        });

        if (strategy === 'priority' || strategy === 'deadline') {
            subjectsPool.sort((a, b) => b.weight - a.weight);
        } else {
            subjectsPool.sort((a, b) => a.name.localeCompare(b.name));
        }
    } else {
        // Fallback demo subjects with distinct weights for each strategy
        if (strategy === 'priority') {
            subjectsPool = [
                { id: 'custom_1', name: 'Mathematics (High Target Focus)', code: 'MATH101', weight: 4 },
                { id: 'custom_2', name: 'Physical Sciences (Priority Target)', code: 'PHYS101', weight: 3 },
                { id: 'custom_4', name: 'Life Sciences', code: 'LIFE101', weight: 2 },
                { id: 'custom_3', name: 'English Literature', code: 'ENG101', weight: 1 }
            ];
        } else if (strategy === 'deadline') {
            subjectsPool = [
                { id: 'custom_2', name: 'Physical Sciences (Exam Due Soon)', code: 'PHYS101', weight: 4 },
                { id: 'custom_1', name: 'Mathematics (Assessment Soon)', code: 'MATH101', weight: 3 },
                { id: 'custom_3', name: 'English Literature', code: 'ENG101', weight: 2 },
                { id: 'custom_4', name: 'Life Sciences', code: 'LIFE101', weight: 1 }
            ];
        } else {
            subjectsPool = [
                { id: 'custom_3', name: 'English Literature', code: 'ENG101', weight: 1 },
                { id: 'custom_1', name: 'Mathematics', code: 'MATH101', weight: 1 },
                { id: 'custom_4', name: 'Life Sciences', code: 'LIFE101', weight: 1 },
                { id: 'custom_2', name: 'Physical Sciences', code: 'PHYS101', weight: 1 }
            ];
        }
    }

    // Interleave subjects into expanded sequence based on weight
    const expandedSubjects = [];
    subjectsPool.forEach(subj => {
        for (let i = 0; i < subj.weight; i++) {
            expandedSubjects.push(subj);
        }
    });

    const generatedSchedule = [];
    const dayNames = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

    let globalSubjectIndex = 0;

    selectedDays.forEach(dayKey => {
        const dayLabel = dayNames[dayKey] || dayKey;
        const slots = [];

        const [startH, startM] = startTimeInput.split(':').map(Number);
        const [endH, endM] = endTimeInput.split(':').map(Number);

        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        let slotIndex = 0;

        while (currentMinutes + studyDuration <= endMinutes) {
            const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
            const slotStartM = (currentMinutes % 60).toString().padStart(2, '0');

            currentMinutes += studyDuration;

            const slotEndH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
            const slotEndM = (currentMinutes % 60).toString().padStart(2, '0');

            const currentSubj = expandedSubjects[globalSubjectIndex % expandedSubjects.length];
            globalSubjectIndex++;

            slots.push({
                id: `slot_${dayKey}_${slotIndex}_${Date.now()}`,
                type: 'study',
                startTime: `${slotStartH}:${slotStartM}`,
                endTime: `${slotEndH}:${slotEndM}`,
                subjectName: currentSubj.name,
                subjectCode: currentSubj.code,
                completed: false
            });

            slotIndex++;

            // Insert break if time permits
            if (currentMinutes + breakDuration <= endMinutes && breakDuration > 0) {
                const breakStartH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
                const breakStartM = (currentMinutes % 60).toString().padStart(2, '0');

                currentMinutes += breakDuration;

                const breakEndH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
                const breakEndM = (currentMinutes % 60).toString().padStart(2, '0');

                slots.push({
                    id: `break_${dayKey}_${slotIndex}_${Date.now()}`,
                    type: 'break',
                    startTime: `${breakStartH}:${breakStartM}`,
                    endTime: `${breakEndH}:${breakEndM}`,
                    subjectName: 'Break & Refresh',
                    completed: false
                });

                slotIndex++;
            }
        }

        generatedSchedule.push({
            dayKey,
            dayLabel,
            slots
        });
    });

    appData.generatedSchedule = generatedSchedule;
    saveData();
    renderSmartTimetable();
}

export function renderSmartTimetable() {
    const container = document.getElementById('smartTimetableContainer');
    if (!container) return;

    if (!appData.generatedSchedule || appData.generatedSchedule.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🗓️</div>
                <p>No study timetable generated yet. Adjust settings above and click <strong>"Generate Smart Study Timetable"</strong>.</p>
            </div>`;
        return;
    }

    const settings = appData.scheduleSettings || {};
    const strategyMap = {
        priority: '🎯 Priority & Goal Weighted Strategy',
        deadline: '🚨 Assessment Deadline Urgent Strategy',
        balanced: '⚖️ Equal Balance Distribution Strategy'
    };
    const strategyText = strategyMap[settings.strategy] || 'Smart Schedule Strategy';
    const studyLen = settings.studyDuration || 45;
    const breakLen = settings.breakDuration || 15;

    container.innerHTML = `
        <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 12px; padding: 0.85rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem; font-weight: 700; color: var(--primary-dark); font-size: 0.92rem;">
                <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 1.1rem;"></i>
                <span>Active Strategy: <strong style="color: var(--primary);">${strategyText}</strong> (${studyLen}m study / ${breakLen}m break)</span>
            </div>
            <span style="font-size: 0.8rem; background: var(--card-bg); padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border-color); color: var(--text-light); font-weight: 600;">
                ${settings.startTime || '09:00'} - ${settings.endTime || '17:00'}
            </span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="font-family:var(--font-head); margin:0;"><i class="fa-solid fa-calendar-week"></i> Your Personalized Study Timetable</h3>
            <button class="btn btn-secondary btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Schedule</button>
        </div>
        <div class="timetable-grid">
            ${appData.generatedSchedule.map(dayData => `
                <div class="day-schedule-card">
                    <div class="day-schedule-header">
                        <h4>${dayData.dayLabel}</h4>
                        <span style="font-size:0.75rem; color:var(--text-light); font-weight:600;">${dayData.slots.filter(s => s.type === 'study').length} Study Blocks</span>
                    </div>
                    <div class="day-slots-list">
                        ${dayData.slots.map(slot => `
                            <div class="time-slot-item ${slot.type === 'break' ? 'break-slot' : ''} ${slot.completed ? 'completed' : ''}">
                                <div>
                                    <div class="time-slot-time">${slot.startTime} - ${slot.endTime}</div>
                                    <div class="time-slot-subject">
                                        <i class="fa-solid ${slot.type === 'break' ? 'fa-coffee' : 'fa-book-open'}" style="color:var(--primary);"></i>
                                        <span>${slot.subjectName} ${slot.subjectCode ? `(${slot.subjectCode})` : ''}</span>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    ${slot.type === 'study' ? `
                                        <input type="checkbox" class="due-item-checkbox" style="position:static;" 
                                               data-action="toggle-slot-complete" data-day-key="${dayData.dayKey}" data-slot-id="${slot.id}" ${slot.completed ? 'checked' : ''} title="Mark session completed">
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

export function toggleSlotComplete(dayKey, slotId) {
    const dayObj = appData.generatedSchedule.find(d => d.dayKey === dayKey);
    if (dayObj) {
        const slot = dayObj.slots.find(s => s.id === slotId);
        if (slot) {
            slot.completed = !slot.completed;
            saveData();
            renderSmartTimetable();
        }
    }
}

// --- Tasks & Assessment Due Dates List ---

export function renderSchedule() {
    renderSmartTimetable();

    const container = document.getElementById('scheduleList');
    if (!container) return;

    let allDueItems = [];

    appData.tasks.forEach(task => {
        if (task.dueDate) {
            allDueItems.push({
                id: task.id, type: 'Task', title: task.title, dueDate: task.dueDate, completed: task.completed,
                subjectName: task.subjectId ? (appData.subjects.find(s => s.id === task.subjectId)?.name || 'General') : 'General',
                details: `Priority: <span class="priority-${task.priority.toLowerCase()}" style="font-weight:700; color:var(--${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'success'});">${task.priority}</span>`,
                itemClass: 'task-item'
            });
        }
    });

    appData.subjects.forEach(subject => {
        subject.assessments.forEach(asm => {
            if (asm.dueDate) {
                allDueItems.push({
                    id: asm.id, type: 'Assessment', title: asm.name, dueDate: asm.dueDate, completed: asm.score !== null,
                    subjectName: subject.name,
                    details: `Type: ${asm.type} • Weight: ${asm.weight}%`,
                    itemClass: 'assessment-item'
                });
            }
        });
    });

    allDueItems.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    if (allDueItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📅</div>
                <p>No tasks or assessment due dates with deadlines.</p>
            </div>`;
        return;
    }

    container.innerHTML = allDueItems.map(item => {
        const isOverdue = new Date(item.dueDate) < new Date() && !item.completed;
        return `
            <div class="card due-item ${item.itemClass} ${item.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                <h4>
                    ${item.title} 
                    ${item.type === 'Task' ?
                `<input type="checkbox" class="due-item-checkbox" data-action="toggle-task" data-task-id="${item.id}" ${item.completed ? 'checked' : ''}>` :
                (item.completed ? '<i class="fa-solid fa-circle-check" style="color:var(--success); float:right; margin-top:2px;"></i>' : '<i class="fa-solid fa-clock" style="color:var(--primary); float:right; margin-top:2px;"></i>')
            }
                </h4>
                <p><strong>Due Date:</strong> ${formatDate(item.dueDate)} ${isOverdue ? '<span style="color:var(--danger); font-weight:700;">(Overdue)</span>' : ''}</p>
                <p><strong>Subject:</strong> ${item.subjectName}</p>
                <p><small>${item.details}</small></p>
                ${item.type === 'Task' ? `
                    <button class="btn-icon btn-danger-icon" style="position:absolute; bottom:0.85rem; right:0.85rem;" title="Delete Task" data-action="delete-task" data-task-id="${item.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>` : ''
            }
            </div>
        `;
    }).join('');
}

export function toggleTask(taskId, refreshCallback) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveData();
        if (typeof refreshCallback === 'function') refreshCallback();
    }
}

export function deleteTask(taskId, refreshCallback) {
    if (confirm('Delete this task?')) {
        appData.tasks = appData.tasks.filter(t => t.id !== taskId);
        saveData();
        if (typeof refreshCallback === 'function') refreshCallback();
    }
}
