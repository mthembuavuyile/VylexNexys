// ============================================================================
// app.js - Core Application Logic & UI Management
// ============================================================================

const DOM = {};

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    cacheDOMElements();
    setupSidebar();
    setupTheme();
    setupModals();
    
    // Initialize Editor and Tabs
    if (typeof initializeEditor === 'function') initializeEditor();
    
    // Initialize Analysis (for initial text if any)
    if (typeof handleAnalysis === 'function') handleAnalysis();
    
    // Initialize Speech
    if (typeof initializeSpeech === 'function') initializeSpeech();
}

function cacheDOMElements() {
    // UI Elements
    DOM.sidebar = document.getElementById('sidebar');
    DOM.sidebarToggle = document.getElementById('sidebarToggle');
    DOM.closeSidebarBtn = document.getElementById('closeSidebarBtn');
    DOM.themeToggle = document.getElementById('themeToggle');
    DOM.toast = document.getElementById('toast');
    DOM.alertMessage = document.getElementById('alertMessage');
    
    // Sidebar Tabs
    DOM.sidebarTabs = document.querySelectorAll('.sidebar-tab');
    DOM.panels = document.querySelectorAll('.panel');
}

function setupSidebar() {
    // Sidebar toggle
    const toggleSidebar = () => {
        DOM.sidebar.classList.toggle('collapsed');
    };
    
    DOM.sidebarToggle.addEventListener('click', toggleSidebar);
    DOM.closeSidebarBtn.addEventListener('click', () => {
        DOM.sidebar.classList.add('collapsed');
    });

    // Auto collapse on small screens
    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.add('collapsed');
    }

    // Tab switching inside sidebar
    DOM.sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            DOM.sidebarTabs.forEach(t => t.classList.remove('active'));
            DOM.panels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function setupTheme() {
    const THEME_KEY = 'WritingSuiteTheme';
    const savedTheme = localStorage.getItem(THEME_KEY);
    
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    DOM.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem(THEME_KEY, 'light');
            DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(THEME_KEY, 'dark');
            DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}

function setupModals() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                toggleModal(modal, false);
            }
        });
    });

    // Close modals via close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                toggleModal(modal, false);
            }
        });
    });
}

function toggleModal(modalElement, show) {
    modalElement.classList.toggle('hidden', !show);
}

function showAlert(message, type = 'success') {
    DOM.alertMessage.textContent = message;
    DOM.alertMessage.className = `alert show alert-${type}`;
    setTimeout(() => {
        DOM.alertMessage.classList.remove('show');
    }, 3000);
}

function showToast(message) {
    DOM.toast.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 2500);
}

function playAudio(url) {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Error playing audio:", e));
}
