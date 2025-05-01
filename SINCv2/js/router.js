// js/router.js

const router = {
    routes: {
        'dashboard': { path: 'templates/dashboard.html', title: 'Dashboard' },
        'cases': { path: 'templates/cases.html', title: 'Case Files' },
        'clients': { path: 'templates/clients.html', title: 'Clients' },
        'calendar': { path: 'templates/calendar.html', title: 'Calendar' }, // Example route needing JS
        'documents': { path: 'templates/documents.html', title: 'Documents' },
        'tasks': { path: 'templates/tasks.html', title: 'Tasks' },
        'time': { path: 'templates/time.html', title: 'Time Tracking' },
        'billing': { path: 'templates/billing.html', title: 'Billing' },
        'assistant': { path: 'templates/assistant.html', title: 'AI Assistant' },
        'settings': { path: 'templates/settings.html', title: 'Settings' },
        'default': 'dashboard'
    },

    contentContainer: null,
    loadingIndicator: null,
    pageTitleElement: null,
    sidebarNav: null,

    init: function() {
        // ... (keep existing init code) ...
        this.contentContainer = document.getElementById('content-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.pageTitleElement = document.getElementById('page-title');
        this.sidebarNav = document.getElementById('sidebar-nav');

        if (!this.contentContainer || !this.loadingIndicator || !this.pageTitleElement || !this.sidebarNav) {
            console.error("Router init failed: Could not find essential elements.");
            return;
        }

        window.addEventListener('hashchange', () => this.handleRouteChange());
        this.handleRouteChange(); // Initial load
    },

    handleRouteChange: function() {
        // ... (keep existing handleRouteChange code) ...
        const hash = window.location.hash.substring(1);
        const routeName = hash || this.routes.default;
        const routeConfig = this.routes[routeName] || this.routes[this.routes.default];
        const targetRouteName = this.routes[routeName] ? routeName : this.routes.default;

        if (routeConfig) {
            this.loadContent(targetRouteName, routeConfig.path, routeConfig.title);
             if (!this.routes[routeName]) {
                 console.warn(`Route not found: #${hash}. Loading default route #${targetRouteName}.`);
                 window.location.hash = targetRouteName; // Update hash to reflect loaded content
             }
        } else {
             console.error(`Could not find configuration for route: ${targetRouteName}`);
             this.contentContainer.innerHTML = `<div class="p-6"><p class="text-red-600 font-semibold">Error: Could not load requested content.</p></div>`;
             this.hideLoading();
        }
    },

    // --- MODIFIED loadContent Function ---
    loadContent: async function(routeName, filePath, title) {
        this.showLoading();
        this.updateActiveLink(routeName);
        this.updatePageTitle(title);

        try {
            const htmlContent = await fetchHtmlAsText(filePath); // Assumes fetchHtmlAsText exists

            // 1. Inject the HTML content
            this.contentContainer.innerHTML = htmlContent;

            // 2. Find and execute scripts within the newly added content
            this.executeScriptsInContainer(this.contentContainer);

            // Optional: Dispatch a custom event after content and scripts are loaded
            // This can be useful for other parts of your app to know when a view is ready
            this.contentContainer.dispatchEvent(new CustomEvent('content-loaded', {
                bubbles: true,
                detail: { routeName: routeName }
            }));
            console.log(`Content loaded and scripts executed for: ${routeName}`);

        } catch (error) {
            console.error(`Error loading or processing content for ${routeName} from ${filePath}:`, error);
            this.contentContainer.innerHTML = `<div class="p-6 bg-red-100 border border-red-400 text-red-700 rounded shadow"><p class="font-semibold">Failed to load ${title}.</p><p class="text-sm">${error.message}</p></div>`;
        } finally {
            this.hideLoading();
        }
    },

    // --- NEW HELPER FUNCTION to execute scripts ---
    executeScriptsInContainer: function(container) {
        // Find all script tags within the container that haven't been processed yet
        // Adding a data attribute helps prevent re-execution if content is somehow re-processed
        const scripts = container.querySelectorAll('script:not([data-executed])');
        let executedCount = 0;

        scripts.forEach(oldScript => {
            // Mark as processed immediately
            oldScript.setAttribute('data-executed', 'true');

            const newScript = document.createElement('script');

            // Copy attributes (like src, type, defer, async)
            Array.from(oldScript.attributes).forEach(attr => {
                // Skip the temporary data-executed attribute
                if (attr.name !== 'data-executed') {
                    newScript.setAttribute(attr.name, attr.value);
                }
            });

            // If it's an inline script, copy the content
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }

            // Replace the old script tag with the new one in the DOM.
            // This forces the browser to evaluate and execute the new script tag.
            // Using parentNode ensures it works even if the script is the only child
            if (oldScript.parentNode) {
                 oldScript.parentNode.replaceChild(newScript, oldScript);
                 executedCount++;
            } else {
                console.warn("Script tag found without a parentNode during execution:", oldScript);
            }
        });

        if (executedCount > 0) {
            console.log(`Executed ${executedCount} script(s) found in loaded content.`);
        }
    },
    // --- End of NEW HELPER ---


    showLoading: function() {
        // ... (keep existing showLoading code) ...
        if(this.loadingIndicator) this.loadingIndicator.style.display = 'flex';
        if (this.contentContainer) this.contentContainer.innerHTML = ''; // Clear previous content
    },

    hideLoading: function() {
        // ... (keep existing hideLoading code) ...
        if(this.loadingIndicator) this.loadingIndicator.style.display = 'none';
    },

    updatePageTitle: function(title) {
       // ... (keep existing updatePageTitle code) ...
       if(this.pageTitleElement) this.pageTitleElement.textContent = title || 'SINC';
       document.title = `SINC - ${title || 'Legal Management'}`;
    },

    updateActiveLink: function(routeName) {
        // ... (keep existing updateActiveLink code, ensure it works correctly) ...
        if (!this.sidebarNav) return;
        const links = this.sidebarNav.querySelectorAll('li[data-route]');
        links.forEach(linkListItem => {
            const isActive = linkListItem.dataset.route === routeName;
            linkListItem.classList.toggle('bg-gray-700', isActive); // Example active class
            const anchor = linkListItem.querySelector('a');
            if (anchor) {
                anchor.classList.toggle('text-white', isActive);
                anchor.classList.toggle('text-gray-300', !isActive);
                anchor.classList.toggle('hover:bg-gray-700', !isActive);
                anchor.classList.toggle('hover:text-white', !isActive);
            }
        });
    }
};

// Helper function (ensure this is defined, e.g., in utils.js or here)
async function fetchHtmlAsText(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Provide more context in the error message
            throw new Error(`HTTP error! Status: ${response.status} while fetching ${url}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error fetching HTML:", error);
        // Re-throw the error so it can be caught by loadContent
        throw error;
    }
}

// Ensure router is initialized (likely done in app.js)
// document.addEventListener('DOMContentLoaded', () => router.init()); // Assuming app.js handles this