// Achieva Store Module - Data State & Local Storage Management

export let appData = {
    subjects: [],
    tasks: [],
    goals: [],
    generatedSchedule: [], // Persisted generated weekly study timetable slots
    scheduleSettings: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: '09:00',
        endTime: '17:00',
        studyDuration: 45,
        breakDuration: 15,
        strategy: 'priority' // 'priority', 'balanced', 'deadline'
    },
    settings: {
        theme: 'light',
        studentName: "My Academic Journey",
        totalCreditsRequired: 120,
        gradingScale: 'US_GPA'
    }
};

export function loadData() {
    const saved = localStorage.getItem('academiaTrackData_v2');
    if (saved) {
        try {
            const parsedData = JSON.parse(saved);
            appData = {
                ...appData,
                ...parsedData,
                scheduleSettings: {
                    ...appData.scheduleSettings,
                    ...(parsedData.scheduleSettings || {})
                },
                settings: {
                    ...appData.settings,
                    ...(parsedData.settings || {})
                }
            };
        } catch (e) {
            console.error('Could not load saved data:', e);
        }
    }
}

export function saveData() {
    try {
        localStorage.setItem('academiaTrackData_v2', JSON.stringify(appData));
    } catch (e) {
        console.error('Could not save data:', e);
        alert('Error saving data. LocalStorage might be full or unavailable.');
    }
}

export function exportData() {
    try {
        const rawJson = JSON.stringify(appData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(rawJson);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `achieva_academic_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(linkElement);
        linkElement.click();
        linkElement.remove();
    } catch (e) {
        alert('Export failed: ' + e.message);
    }
}

export function importData(event, onImportSuccess) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed && (parsed.subjects || parsed.tasks || parsed.goals)) {
                appData = {
                    subjects: parsed.subjects || [],
                    tasks: parsed.tasks || [],
                    goals: parsed.goals || [],
                    generatedSchedule: parsed.generatedSchedule || [],
                    scheduleSettings: {
                        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                        startTime: '09:00',
                        endTime: '17:00',
                        studyDuration: 45,
                        breakDuration: 15,
                        strategy: 'priority',
                        ...(parsed.scheduleSettings || {})
                    },
                    settings: {
                        theme: parsed.settings?.theme || 'light',
                        studentName: parsed.settings?.studentName || 'My Academic Journey',
                        totalCreditsRequired: parsed.settings?.totalCreditsRequired || 120,
                        gradingScale: parsed.settings?.gradingScale || 'US_GPA'
                    }
                };
                saveData();
                alert('Planner data successfully imported!');
                if (typeof onImportSuccess === 'function') onImportSuccess();
            } else {
                alert('Failed to parse: Invalid planner JSON schema.');
            }
        } catch (err) {
            alert('Error reading backup file: ' + err.message);
        }
    };
    reader.readAsText(file);
}
