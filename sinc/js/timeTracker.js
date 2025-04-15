// timeTracker.js - Time tracking functionality for SINC Dashboard

// Timer state
const timerState = {
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    currentTimer: null,
    activeTask: null,
    activeCase: null,
    timeEntries: []
};

// DOM element references
let timerDisplay;
let startTimerBtn;
let stopTimerBtn;
let taskSelect;
let caseSelect;
let descriptionInput;
let timeLogContainer;

/**
 * Initialize time tracking functionality
 */
export function initTimeTracking() {
    console.log("Initializing Time Tracking...");
    
    // Get DOM elements
    timerDisplay = document.getElementById('timer-display');
    startTimerBtn = document.getElementById('start-timer-btn');
    stopTimerBtn = document.getElementById('stop-timer-btn');
    taskSelect = document.getElementById('task-select');
    caseSelect = document.getElementById('case-select');
    descriptionInput = document.getElementById('description-input');
    timeLogContainer = document.getElementById('time-log-container');
    
    // Add event listeners
    if (startTimerBtn) {
        startTimerBtn.addEventListener('click', startTimer);
    }
    
    if (stopTimerBtn) {
        stopTimerBtn.addEventListener('click', stopTimer);
    }
    
    // Add form submission handler for manual entry
    const manualEntryForm = document.getElementById('manual-entry-form');
    if (manualEntryForm) {
        manualEntryForm.addEventListener('submit', handleManualEntry);
    }
    
    // Add event listener for toggling between timer and manual entry
    const manualEntryBtn = document.getElementById('manual-entry-btn');
    const timerBtn = document.getElementById('timer-btn');
    
    if (manualEntryBtn) {
        manualEntryBtn.addEventListener('click', showManualEntryForm);
    }
    
    if (timerBtn) {
        timerBtn.addEventListener('click', showTimerInterface);
    }
    
    // Load saved time entries from localStorage
    loadTimeEntries();
    
    console.log("Time Tracking Initialized");
}

/**
 * Start the timer
 */
function startTimer() {
    // Validate that required fields are filled
    const caseValue = caseSelect ? caseSelect.value : null;
    const taskValue = taskSelect ? taskSelect.value : null;
    
    if (!caseValue || !taskValue) {
        alert('Please select both a case and task before starting the timer.');
        return;
    }
    
    // Update UI
    startTimerBtn.classList.add('hidden');
    stopTimerBtn.classList.remove('hidden');
    
    // Set timer state
    timerState.isRunning = true;
    timerState.startTime = Date.now() - timerState.elapsedTime;
    timerState.activeTask = taskValue;
    timerState.activeCase = caseValue;
    
    // Start interval to update display
    timerState.currentTimer = setInterval(updateTimerDisplay, 1000);
    
    // Update UI elements to show active state
    document.getElementById('time-tracking-content').classList.add('active-timer');
}

/**
 * Stop the timer and save the entry
 */
function stopTimer() {
    if (!timerState.isRunning) return;
    
    // Clear interval
    clearInterval(timerState.currentTimer);
    
    // Update UI
    startTimerBtn.classList.remove('hidden');
    stopTimerBtn.classList.add('hidden');
    document.getElementById('time-tracking-content').classList.remove('active-timer');
    
    // Calculate final duration
    const endTime = Date.now();
    const duration = endTime - timerState.startTime;
    
    // Create time entry
    const timeEntry = {
        id: generateUniqueId(),
        case: timerState.activeCase,
        task: timerState.activeTask,
        description: descriptionInput ? descriptionInput.value : '',
        duration,
        date: new Date().toISOString(),
        billable: true // Default to billable
    };
    
    // Add to entries and save
    addTimeEntry(timeEntry);
    
    // Reset timer state
    timerState.isRunning = false;
    timerState.elapsedTime = 0;
    timerState.startTime = null;
    timerState.currentTimer = null;
    
    // Reset display
    if (timerDisplay) {
        timerDisplay.textContent = '00:00:00';
    }
    
    // Clear description input
    if (descriptionInput) {
        descriptionInput.value = '';
    }
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    if (!timerState.isRunning) return;
    
    const currentTime = Date.now();
    timerState.elapsedTime = currentTime - timerState.startTime;
    
    if (timerDisplay) {
        timerDisplay.textContent = formatDuration(timerState.elapsedTime);
    }
}

/**
 * Format milliseconds into HH:MM:SS
 */
function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

/**
 * Generate a unique ID for time entries
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Handle manual time entry form submission
 */
function handleManualEntry(event) {
    event.preventDefault();
    
    const form = event.target;
    const date = form.elements['entry-date'].value;
    const hours = parseInt(form.elements['entry-hours'].value || 0);
    const minutes = parseInt(form.elements['entry-minutes'].value || 0);
    const caseValue = form.elements['entry-case'].value;
    const taskValue = form.elements['entry-task'].value;
    const description = form.elements['entry-description'].value;
    const billable = form.elements['entry-billable'].checked;
    
    if (!date || (!hours && !minutes) || !caseValue || !taskValue) {
        alert('Please fill all required fields');
        return;
    }
    
    // Calculate duration in milliseconds
    const duration = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    
    // Create time entry
    const timeEntry = {
        id: generateUniqueId(),
        case: caseValue,
        task: taskValue,
        description,
        duration,
        date: new Date(date).toISOString(),
        billable
    };
    
    // Add to entries and save
    addTimeEntry(timeEntry);
    
    // Reset form
    form.reset();
    
    // Show a success message
    const successMessage = document.createElement('div');
    successMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-2';
    successMessage.setAttribute('role', 'alert');
    successMessage.textContent = 'Time entry added successfully!';
    
    form.appendChild(successMessage);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

/**
 * Add a time entry to the list and save to localStorage
 */
function addTimeEntry(entry) {
    // Add to state
    timerState.timeEntries.push(entry);
    
    // Save to localStorage
    saveTimeEntries();
    
    // Update UI
    renderTimeEntries();
}

/**
 * Save time entries to localStorage
 */
function saveTimeEntries() {
    localStorage.setItem('sincTimeEntries', JSON.stringify(timerState.timeEntries));
}

/**
 * Load time entries from localStorage
 */
function loadTimeEntries() {
    const savedEntries = localStorage.getItem('sincTimeEntries');
    if (savedEntries) {
        timerState.timeEntries = JSON.parse(savedEntries);
        renderTimeEntries();
    }
}

/**
 * Render time entries in the UI
 */
function renderTimeEntries() {
    if (!timeLogContainer) return;
    
    timeLogContainer.innerHTML = '';
    
    if (timerState.timeEntries.length === 0) {
        timeLogContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                No time entries yet. Start the timer or add a manual entry.
            </div>
        `;
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    // Add table head
    table.innerHTML = `
        <thead class="bg-gray-50">
            <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case/Task</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billable</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200"></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    // Sort entries by date (most recent first)
    const sortedEntries = [...timerState.timeEntries].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // Add rows for each entry
    sortedEntries.forEach(entry => {
        const row = document.createElement('tr');
        
        // Format date
        const entryDate = new Date(entry.date);
        const dateFormatted = entryDate.toLocaleDateString();
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dateFormatted}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${entry.case}<br>
                <span class="text-xs text-gray-500">${entry.task}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${entry.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDuration(entry.duration)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${entry.billable ? 'Yes' : 'No'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button data-id="${entry.id}" class="edit-entry-btn text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button data-id="${entry.id}" class="delete-entry-btn text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    timeLogContainer.appendChild(table);
    
    // Add event listeners for edit and delete buttons
    const editButtons = timeLogContainer.querySelectorAll('.edit-entry-btn');
    const deleteButtons = timeLogContainer.querySelectorAll('.delete-entry-btn');
    
    editButtons.forEach(button => {
        button.addEventListener('click', () => editTimeEntry(button.dataset.id));
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => deleteTimeEntry(button.dataset.id));
    });
}

/**
 * Delete a time entry
 */
function deleteTimeEntry(id) {
    if (confirm('Are you sure you want to delete this time entry?')) {
        timerState.timeEntries = timerState.timeEntries.filter(entry => entry.id !== id);
        saveTimeEntries();
        renderTimeEntries();
    }
}

/**
 * Edit a time entry
 */
function editTimeEntry(id) {
    const entry = timerState.timeEntries.find(entry => entry.id === id);
    if (!entry) return;
    
    // Show manual entry form if not already visible
    showManualEntryForm();
    
    // Fill form with entry data
    const form = document.getElementById('manual-entry-form');
    if (!form) return;
    
    const entryDate = new Date(entry.date);
    form.elements['entry-date'].value = entryDate.toISOString().split('T')[0];
    
    const hours = Math.floor(entry.duration / (60 * 60 * 1000));
    const minutes = Math.floor((entry.duration % (60 * 60 * 1000)) / (60 * 1000));
    
    form.elements['entry-hours'].value = hours;
    form.elements['entry-minutes'].value = minutes;
    form.elements['entry-case'].value = entry.case;
    form.elements['entry-task'].value = entry.task;
    form.elements['entry-description'].value = entry.description || '';
    form.elements['entry-billable'].checked = entry.billable;
    
    // Add edit mode indicator
    form.dataset.editMode = 'true';
    form.dataset.editId = id;
    
    // Change submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Entry';
    }
    
    // Add cancel button if not already present
    if (!form.querySelector('.cancel-edit-btn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'cancel-edit-btn ml-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', cancelEditMode);
        
        submitBtn.parentNode.appendChild(cancelBtn);
    }
}

/**
 * Cancel edit mode
 */
function cancelEditMode() {
    const form = document.getElementById('manual-entry-form');
    if (!form) return;
    
    // Reset form
    form.reset();
    
    // Remove edit mode indicator
    delete form.dataset.editMode;
    delete form.dataset.editId;
    
    // Change submit button text back
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Add Entry';
    }
    
    // Remove cancel button
    const cancelBtn = form.querySelector('.cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

/**
 * Show manual entry form
 */
function showManualEntryForm() {
    const timerInterface = document.getElementById('timer-interface');
    const manualEntryForm = document.getElementById('manual-entry-form-container');
    
    if (timerInterface) timerInterface.classList.add('hidden');
    if (manualEntryForm) manualEntryForm.classList.remove('hidden');
}

/**
 * Show timer interface
 */
function showTimerInterface() {
    const timerInterface = document.getElementById('timer-interface');
    const manualEntryForm = document.getElementById('manual-entry-form-container');
    
    if (timerInterface) timerInterface.classList.remove('hidden');
    if (manualEntryForm) manualEntryForm.classList.add('hidden');
}
