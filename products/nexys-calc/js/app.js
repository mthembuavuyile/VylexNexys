// ==========================================
// VyLab Nexys Calc — Mode switching & Navigation
// ==========================================
const MODE_META = {
    grapher: { title: 'Function Grapher', desc: 'Plot up to three functions on one live coordinate plane.' },
    triangle: { title: 'Triangle Explorer', desc: 'Drag any vertex to reshape the triangle and see it classified live.' },
    equation: { title: 'Equation Solver', desc: 'Evaluate, simplify, and solve algebraic expressions instantly.' },
    sequence: { title: 'Sequence Solver', desc: 'Detect arithmetic, geometric, or quadratic sequences and solve sigma notations.' },
    trig: { title: 'Trigonometry Calculator', desc: 'Right triangle solver, quadrant analyzer, and special angle lookup.' }
};

function toggleMobileDrawer(open) {
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (drawer && backdrop) {
        if (open) {
            backdrop.classList.remove('hidden');
            drawer.classList.remove('-translate-x-full');
        } else {
            backdrop.classList.add('hidden');
            drawer.classList.add('-translate-x-full');
        }
    }
}

function filterSidebarTools(query) {
    const q = query.toLowerCase().trim();
    ['grapher', 'triangle', 'equation', 'sequence', 'trig'].forEach(id => {
        const btn = document.getElementById('nav-' + id);
        const drawerBtn = document.getElementById('drawer-nav-' + id);
        const text = MODE_META[id] ? MODE_META[id].title.toLowerCase() : '';
        const match = !q || text.includes(q);
        if (btn) btn.style.display = match ? 'flex' : 'none';
        if (drawerBtn) drawerBtn.style.display = match ? 'flex' : 'none';
    });
}

function switchMode(newMode) {
    if (typeof mode !== 'undefined') {
        mode = newMode;
    }
    const titleEl = document.getElementById('modeTitle');
    const descEl = document.getElementById('modeDesc');
    const topTitleEl = document.getElementById('topPageTitle');
    if (titleEl && MODE_META[newMode]) titleEl.textContent = MODE_META[newMode].title;
    if (descEl && MODE_META[newMode]) descEl.textContent = MODE_META[newMode].desc;
    if (topTitleEl && MODE_META[newMode]) topTitleEl.textContent = MODE_META[newMode].title + ' | CAPS Math Engine';

    // Update window hash without scrolling
    if (history.replaceState) {
        history.replaceState(null, null, '#' + newMode);
    } else {
        window.location.hash = newMode;
    }
    
    // Toggle Panels
    document.getElementById('panel-grapher')?.classList.toggle('hidden', newMode !== 'grapher');
    document.getElementById('panel-triangle')?.classList.toggle('hidden', newMode !== 'triangle');
    document.getElementById('panel-equation')?.classList.toggle('hidden', newMode !== 'equation');
    document.getElementById('panel-sequence')?.classList.toggle('hidden', newMode !== 'sequence');
    document.getElementById('panel-trig')?.classList.toggle('hidden', newMode !== 'trig');
    
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
    
    // Toggle Navigation Buttons (Desktop Sidebar, Mobile Drawer, Mobile Bottom Bar)
    ['grapher', 'triangle', 'equation', 'sequence', 'trig'].forEach(id => {
        // Desktop Sidebar
        const btn = document.getElementById('nav-' + id);
        if (btn) {
            if (id === newMode) {
                btn.className = "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-semibold transition-all bg-blue-50 text-blue-700 shadow-xs border-l-4 border-blue-600 nav-btn cursor-pointer";
            } else {
                btn.className = "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 nav-btn cursor-pointer";
            }
        }
        
        // Mobile Drawer
        const drawerBtn = document.getElementById('drawer-nav-' + id);
        if (drawerBtn) {
            if (id === newMode) {
                drawerBtn.className = "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-semibold bg-blue-50 text-blue-700 border-l-4 border-blue-600 cursor-pointer";
            } else {
                drawerBtn.className = "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer";
            }
        }

        // Mobile Bottom Nav
        const bNav = document.getElementById('bnav-' + id);
        if (bNav) {
            const icon = bNav.querySelector('.bnav-icon');
            const text = bNav.querySelector('.bnav-text');
            if (id === newMode) {
                if (icon) icon.className = "bnav-icon w-5 h-5 text-blue-600";
                if (text) text.className = "bnav-text text-[10px] font-semibold text-blue-600";
            } else {
                if (icon) icon.className = "bnav-icon w-5 h-5 text-slate-400";
                if (text) text.className = "bnav-text text-[10px] font-medium text-slate-400";
            }
        }
    });
    
    // Update mobile select if present
    const mobileSelect = document.getElementById('mobileModeSelect');
    if (mobileSelect && mobileSelect.value !== newMode) {
        mobileSelect.value = newMode;
    }

    // Close mobile drawer on mode switch
    toggleMobileDrawer(false);

    // Scroll to top of main area
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    if (typeof render === 'function') render();
    if (newMode === 'triangle' && typeof updateTriangleStats === 'function') updateTriangleStats();
}

// ==========================================
// Initialization
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

