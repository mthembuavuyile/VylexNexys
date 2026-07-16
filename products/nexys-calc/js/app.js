// ==========================================
// Mode switching and Initialization
// ==========================================
const MODE_META = {
    grapher: { title: 'Function Grapher', desc: 'Plot up to three functions on one live coordinate plane.' },
    triangle: { title: 'Triangle Explorer', desc: 'Drag any vertex to reshape the triangle and see it classified live.' },
    equation: { title: 'Equation Solver', desc: 'Evaluate, simplify, and solve algebraic expressions instantly.' },
    sequence: { title: 'Sequence Solver', desc: 'Detect arithmetic, geometric, or quadratic sequences and solve sigma notations.' },
    trig: { title: 'Trigonometry Calculator', desc: 'Right triangle solver, quadrant analyzer, and special angle lookup.' }
};

function switchMode(newMode) {
    if (typeof mode !== 'undefined') {
        mode = newMode;
    }
    document.getElementById('modeTitle').textContent = MODE_META[newMode].title;
    document.getElementById('modeDesc').textContent = MODE_META[newMode].desc;
    
    // Toggle Panels
    document.getElementById('panel-grapher').classList.toggle('hidden', newMode !== 'grapher');
    document.getElementById('panel-triangle').classList.toggle('hidden', newMode !== 'triangle');
    document.getElementById('panel-equation').classList.toggle('hidden', newMode !== 'equation');
    document.getElementById('panel-sequence').classList.toggle('hidden', newMode !== 'sequence');
    document.getElementById('panel-trig').classList.toggle('hidden', newMode !== 'trig');
    
    // Toggle Layout for Equation Mode
    const canvasContainer = document.getElementById('canvas-container');
    const panelsContainer = document.getElementById('panels-container');
    if (canvasContainer && panelsContainer) {
        if (newMode === 'equation') {
            canvasContainer.classList.add('hidden');
            panelsContainer.classList.remove('lg:col-span-4');
            panelsContainer.classList.add('lg:col-span-12');
        } else {
            canvasContainer.classList.remove('hidden');
            panelsContainer.classList.remove('lg:col-span-12');
            panelsContainer.classList.add('lg:col-span-4');
        }
    }
    
    // Toggle Nav Buttons
    ['grapher', 'triangle', 'equation', 'sequence', 'trig'].forEach(id => {
        const btn = document.getElementById('nav-' + id);
        if (!btn) return;
        if (id === newMode) { btn.classList.add('bg-violet-50', 'text-violet-700'); btn.classList.remove('text-slate-600'); }
        else { btn.classList.remove('bg-violet-50', 'text-violet-700'); btn.classList.add('text-slate-600'); }
    });
    
    // Update mobile select if it doesn't match
    const mobileSelect = document.getElementById('mobileModeSelect');
    if (mobileSelect && mobileSelect.value !== newMode) {
        mobileSelect.value = newMode;
    }

    // Reset scroll position on mode change for mobile usability
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    if (typeof render === 'function') render();
    if (newMode === 'triangle' && typeof updateTriangleStats === 'function') updateTriangleStats();
}

// ==========================================
// Init
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof onExprChange === 'function') {
        onExprChange(0);
        onExprChange(1);
        onExprChange(2);
    }
    
    if (typeof initEquationSolver === 'function') initEquationSolver();
    if (typeof initSequenceSolver === 'function') initSequenceSolver();
    if (typeof initTrigCalculator === 'function') initTrigCalculator();
    
    let initialMode = 'grapher';
    const hash = window.location.hash.substring(1);
    if (hash && MODE_META[hash]) {
        initialMode = hash;
    }
    switchMode(initialMode);
    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof updateTriangleStats === 'function') updateTriangleStats();
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && MODE_META[hash]) {
        switchMode(hash);
    }
});
