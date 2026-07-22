// Achieva Pomodoro Module - Focus Study Timer & Web Audio Tone Synthesizer

let timerInterval = null;
let timerSeconds = 25 * 60;
let timerDuration = 25 * 60;
let timerMode = 'study';
let timerRunning = false;
let sessionsCompleted = 0;
let totalFocusMinutes = 0;

export function playAlarmSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 3; i++) {
            const startTime = audioCtx.currentTime + i * 0.35;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        }
    } catch (e) {
        console.error('AudioContext error:', e);
    }
}

export function toggleTimer() {
    const playBtns = document.querySelectorAll('#timerPlayBtn, #mainTimerPlayBtn');
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        playBtns.forEach(btn => {
            btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        });
    } else {
        timerRunning = true;
        playBtns.forEach(btn => {
            btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        });
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();

            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                playAlarmSound();

                if (timerMode === 'study' || timerMode === 'deep') {
                    sessionsCompleted++;
                    totalFocusMinutes += Math.round(timerDuration / 60);
                    updateSessionStats();
                    alert(`🎉 Excellent work! Focus session complete.`);
                    setTimerMode('short');
                } else {
                    alert(`⏰ Break time complete! Ready for another focus session?`);
                    setTimerMode('study');
                }
            }
        }, 1000);
    }
}

export function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = timerDuration;
    updateTimerDisplay();
    const playBtns = document.querySelectorAll('#timerPlayBtn, #mainTimerPlayBtn');
    playBtns.forEach(btn => {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    });
}

export function setTimerMode(mode) {
    timerMode = mode;

    document.querySelectorAll('.pomodoro-modes .btn-mode, [data-mode]').forEach(btn => {
        btn.classList.remove('active');
        const btnModeAttr = btn.getAttribute('data-mode');
        const text = btn.textContent.toLowerCase();
        if ((mode === 'study' && (text.includes('25m') || text.includes('study') || btnModeAttr === 'study')) ||
            (mode === 'deep' && (text.includes('50m') || text.includes('deep') || btnModeAttr === 'deep')) ||
            (mode === 'short' && (text.includes('short') || text.includes('5m') || btnModeAttr === 'short')) ||
            (mode === 'long' && (text.includes('long') || text.includes('15m') || btnModeAttr === 'long'))) {
            btn.classList.add('active');
        }
    });

    if (mode === 'study') {
        timerDuration = 25 * 60;
    } else if (mode === 'deep') {
        timerDuration = 50 * 60;
    } else if (mode === 'short') {
        timerDuration = 5 * 60;
    } else if (mode === 'long') {
        timerDuration = 15 * 60;
    }
    timerSeconds = timerDuration;
    resetTimer();
}

export function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const displays = document.querySelectorAll('#timerDisplay, #mainTimerDisplay');
    displays.forEach(display => {
        display.textContent = timeStr;
    });

    const circles = document.querySelectorAll('#timerProgressCircle, #mainTimerProgressCircle');
    circles.forEach(circle => {
        if (circle && circle.r) {
            const radius = circle.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const progressFraction = timerSeconds / timerDuration;
            const offset = circumference * (1 - progressFraction);
            circle.style.strokeDashoffset = offset;
        }
    });
}

export function updateSessionStats() {
    const countEl = document.getElementById('pomodoroCompletedCount');
    const minsEl = document.getElementById('pomodoroTotalMinutes');
    if (countEl) countEl.textContent = sessionsCompleted;
    if (minsEl) minsEl.textContent = `${totalFocusMinutes}m`;
}

export function populatePomodoroSubjectSelect(subjects) {
    const select = document.getElementById('pomodoroSubjectSelect');
    if (!select) return;
    select.innerHTML = '<option value="">General Focus Session</option>';
    if (subjects && subjects.length > 0) {
        subjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} ${s.code ? `(${s.code})` : ''}`;
            select.appendChild(opt);
        });
    }
}

