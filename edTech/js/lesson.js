/**
 * VYLEX NEXYS EdTech — Lesson Engine
 * Reads module ID from URL params, renders info/quiz slides,
 * tracks progress via storage.js.
 */

const LESSON_XP = 50;
const BOSS_XP = 500;
let earnedXp = LESSON_XP;
let currentSlide = 0;
let totalSlides = 0;
let currentModuleId = null;

/* ── Lesson content database ── */
const lessonsData = {
    /* Mathematics */
    'math-calc-01': [
        {
            type: 'info',
            title: 'First Principles',
            content: '<p style="color:var(--text-secondary);font-size:var(--fs-lg);line-height:1.7;margin-bottom:var(--sp-6);">The derivative of a function <span style="color:var(--brand-400);font-weight:700;font-family:monospace;">f(x)</span> from first principles is given by the limit as <span style="color:var(--brand-400);font-weight:700;font-family:monospace;">h &rarr; 0</span>.</p>',
            formula: "f'(x) = lim(h→0) [f(x+h) - f(x)] / h",
            buttonText: 'Got it'
        },
        {
            type: 'quiz',
            title: 'What is the derivative of f(x) = x²?',
            options: [
                { text: 'x', correct: false },
                { text: '2x', correct: true },
                { text: '2x²', correct: false }
            ]
        }
    ],
    /* Life Sciences */
    'ls-dc-02': [
        {
            type: 'info',
            title: 'DNA Structure',
            content: '<p style="color:var(--text-secondary);font-size:var(--fs-lg);line-height:1.7;margin-bottom:var(--sp-6);">DNA (Deoxyribonucleic acid) is a double helix structure. It consists of nucleotides, which are made of a <span style="color:var(--brand-400);font-weight:700;">sugar</span>, a <span style="color:var(--et-lifesci);font-weight:700;">phosphate</span>, and a <span style="color:var(--warning);font-weight:700;">nitrogenous base</span>.</p>',
            formula: null,
            buttonText: 'Next'
        },
        {
            type: 'quiz',
            title: 'Which of the following is NOT a nitrogenous base found in DNA?',
            options: [
                { text: 'Adenine', correct: false },
                { text: 'Uracil', correct: true },
                { text: 'Cytosine', correct: false },
                { text: 'Guanine', correct: false }
            ]
        }
    ],
    /* Physics */
    'phys-mech-02': [
        {
            type: 'info',
            title: 'Work Done',
            content: '<p style="color:var(--text-secondary);font-size:var(--fs-lg);line-height:1.7;margin-bottom:var(--sp-6);">Work is done when a force acting on an object causes it to move. The formula is <span style="color:var(--brand-400);font-weight:700;font-family:monospace;">W = F &Delta;x cos(&theta;)</span>.</p>',
            formula: 'W = F Δx cos(θ)',
            buttonText: 'Understood'
        },
        {
            type: 'quiz',
            title: 'What is the unit of Work?',
            options: [
                { text: 'Newton', correct: false },
                { text: 'Watt', correct: false },
                { text: 'Joule', correct: true }
            ]
        }
    ],
    /* Agricultural Sciences */
    'agri-ap-01': [
        {
            type: 'info',
            title: 'Ruminant Digestion',
            content: '<p style="color:var(--text-secondary);font-size:var(--fs-lg);line-height:1.7;margin-bottom:var(--sp-6);">Ruminants are mammals that acquire nutrients from plant-based food by fermenting it in a specialized stomach prior to digestion. The stomach has four compartments: rumen, reticulum, omasum, and abomasum.</p>',
            formula: null,
            buttonText: 'Got it'
        },
        {
            type: 'quiz',
            title: 'Which compartment is considered the "true stomach" in ruminants?',
            options: [
                { text: 'Rumen', correct: false },
                { text: 'Reticulum', correct: false },
                { text: 'Omasum', correct: false },
                { text: 'Abomasum', correct: true }
            ]
        }
    ]
};

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    const params = new URLSearchParams(window.location.search);
    currentModuleId = params.get('m');
    if (params.get('b')) earnedXp = BOSS_XP;
    document.getElementById('xp-award-text').textContent = '+' + earnedXp + ' XP';

    const slides = lessonsData[currentModuleId];
    if (slides && slides.length) {
        totalSlides = slides.length;
        renderSlide(0);
    } else {
        // Fallback: no lesson content yet
        document.getElementById('lesson-container').innerHTML = `
            <div class="glass-card-static p-6 text-center" style="margin-top:var(--sp-8);">
                <i class="fa-solid fa-wrench" style="font-size:2rem;color:var(--warning);margin-bottom:var(--sp-4);display:block;"></i>
                <h3 class="font-display text-xl font-bold mb-2">Coming Soon</h3>
                <p class="text-muted mb-6">This module's lesson content is being developed.</p>
                <a href="index.html" class="btn btn-secondary" style="display:inline-flex;">
                    <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
                </a>
            </div>
        `;
    }
});

/* ── Render a slide ── */
function renderSlide(index) {
    currentSlide = index;
    const slide = lessonsData[currentModuleId][index];
    const container = document.getElementById('lesson-container');
    const progressPct = ((index + 1) / totalSlides) * 100;
    document.getElementById('progress-bar').style.width = progressPct + '%';

    if (slide.type === 'info') {
        container.innerHTML = `
            <div class="animate-slide-up">
                <h2 class="font-display text-2xl font-bold mb-4">${slide.title}</h2>
                ${slide.content}
                ${slide.formula ? `<div class="math-block">${slide.formula}</div>` : ''}
                <button onclick="advanceSlide()" class="btn btn-primary w-full" style="margin-top:var(--sp-6);">
                    ${slide.buttonText || 'Continue'}
                </button>
            </div>
        `;
    } else if (slide.type === 'quiz') {
        const optionsHTML = slide.options.map((opt, i) => `
            <button onclick="handleAnswer(this, ${opt.correct})" ${opt.correct ? 'id="correct-btn"' : ''}
                class="glass-card-static p-4 w-full text-left font-bold transition"
                style="border:1px solid var(--border-default);border-radius:var(--r-xl);color:var(--text-secondary);">
                ${opt.text}
            </button>
        `).join('');

        container.innerHTML = `
            <div class="animate-slide-up">
                <h2 class="font-display text-2xl font-bold mb-6">${slide.title}</h2>
                <div class="flex flex-col gap-3">${optionsHTML}</div>
            </div>
        `;
    }
}

function advanceSlide() {
    if (currentSlide + 1 < totalSlides) {
        renderSlide(currentSlide + 1);
    }
}

/* ── Quiz Answer ── */
function handleAnswer(btn, isCorrect) {
    // Disable all option buttons
    btn.parentElement.querySelectorAll('button').forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.style.borderColor = 'var(--success)';
        btn.style.color = 'var(--success)';
        btn.style.background = 'rgba(16,185,129,0.08)';

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#10b981', '#f59e0b'] });

        setTimeout(() => {
            const overlay = document.getElementById('success-overlay');
            overlay.classList.remove('view-hidden');
            setTimeout(() => overlay.style.opacity = '1', 50);
        }, 800);
    } else {
        btn.style.borderColor = 'var(--error)';
        btn.style.color = 'var(--error)';
        btn.style.background = 'rgba(239,68,68,0.08)';

        const correctBtn = document.getElementById('correct-btn');
        if (correctBtn) {
            correctBtn.style.borderColor = 'var(--success)';
            correctBtn.style.color = 'var(--success)';
        }

        setTimeout(() => {
            btn.parentElement.querySelectorAll('button').forEach(b => {
                b.disabled = false;
                b.style.borderColor = 'var(--border-default)';
                b.style.color = 'var(--text-secondary)';
                b.style.background = '';
            });
        }, 2000);
    }
}

/* ── Finish ── */
function finishLesson() {
    addXP(earnedXp);
    if (currentModuleId) {
        setModuleProgress(currentModuleId, 100);
    }
    window.location.href = 'index.html';
}