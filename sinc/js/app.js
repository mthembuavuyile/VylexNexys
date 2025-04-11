
// Import initializers from other modules
import { initSidebar } from './sidebar.js';
import { initHeader } from './header.js';
import { initRouter } from './router.js';
import { initTaskTabs } from './uiComponents.js';

// --- Global Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("SINC Dashboard Initializing...");

    initSidebar();
    initHeader();
    initRouter();
    initTaskTabs(); // Initialize task tabs (will only run if task elements exist on current page)

    // You could initialize other components here
    // initSomethingElse();

    console.log("SINC Dashboard Ready.");
});