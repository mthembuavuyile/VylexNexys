// js/sidebar.js

const sidebar = {
    sidebarElement: null,
    sidebarToggleBtn: null,
    mobileToggleBtn: null,
    appContainer: null, // Or maybe 'body' depending on CSS strategy
    isMobileOpen: false,
    isDesktopCollapsed: false, // Optional: track state

    init: function() {
        this.sidebarElement = document.getElementById('sidebar');
        this.sidebarToggleBtn = document.getElementById('sidebar-toggle');
        this.mobileToggleBtn = document.getElementById('mobile-menu-toggle');
        this.appContainer = document.querySelector('.app-container'); // Or document.body

        if (!this.sidebarElement || !this.sidebarToggleBtn || !this.mobileToggleBtn || !this.appContainer) {
            console.error("Sidebar init failed: Could not find essential elements.");
            return;
        }

        // Desktop toggle listener
        this.sidebarToggleBtn.addEventListener('click', () => this.toggleDesktopSidebar());

        // Mobile toggle listener
        this.mobileToggleBtn.addEventListener('click', () => this.toggleMobileSidebar());

        // Optional: Close mobile sidebar if clicking outside of it
        document.addEventListener('click', (event) => {
             if (this.isMobileOpen &&
                 !this.sidebarElement.contains(event.target) &&
                 !this.mobileToggleBtn.contains(event.target)) {
                 this.closeMobileSidebar();
             }
        });

         // Optional: Load collapsed state from localStorage
         this.loadState();
         this.applyDesktopState(); // Apply initial state
    },

    toggleDesktopSidebar: function() {
        this.isDesktopCollapsed = !this.isDesktopCollapsed;
        this.applyDesktopState();
        this.saveState(); // Optional: Save state
    },

    applyDesktopState: function() {
         if (this.isDesktopCollapsed) {
            this.sidebarElement.classList.add('collapsed');
         } else {
             this.sidebarElement.classList.remove('collapsed');
         }
    },

    toggleMobileSidebar: function() {
        if (this.isMobileOpen) {
            this.closeMobileSidebar();
        } else {
            this.openMobileSidebar();
        }
    },

    openMobileSidebar: function() {
        this.sidebarElement.classList.add('mobile-open');
        // Optional: Add an overlay class to the body/container
        // this.appContainer.classList.add('sidebar-overlay-active');
        this.isMobileOpen = true;
    },

    closeMobileSidebar: function() {
        this.sidebarElement.classList.remove('mobile-open');
        // Optional: Remove overlay class
        // this.appContainer.classList.remove('sidebar-overlay-active');
        this.isMobileOpen = false;
    },

    // --- Optional State Persistence ---
    saveState: function() {
        try {
            localStorage.setItem('sidebarCollapsed', this.isDesktopCollapsed);
        } catch (e) {
            console.warn("Could not save sidebar state to localStorage.");
        }
    },

    loadState: function() {
         try {
            const savedState = localStorage.getItem('sidebarCollapsed');
            // Check explicitly for 'true'/'false' strings
            if (savedState !== null) {
                 this.isDesktopCollapsed = savedState === 'true';
            }
         } catch (e) {
             console.warn("Could not load sidebar state from localStorage.");
         }
    }
};