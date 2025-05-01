// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // Initialize Sidebar Functionality
    sidebar.init();

    // Initialize Router
    router.init();

    // Add navigation listeners AFTER router is initialized
    const sidebarNav = document.getElementById('sidebar-nav');
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.getAttribute('href').startsWith('#')) {
                // No need to preventDefault or manually change hash,
                // the browser and the router's hashchange listener will handle it.

                // Close mobile sidebar on navigation
                if (sidebar.isMobileOpen) {
                    sidebar.closeMobileSidebar();
                }
            }
        });
    } else {
        console.error("App init: Could not find sidebar navigation.");
    }

    console.log("SINC App Initialized");

    document.addEventListener('DOMContentLoaded', () => router.init()); 

});