// js/utils.js

/**
 * Fetches HTML content from a given URL.
 * @param {string} url - The URL to fetch content from.
 * @returns {Promise<string>} - A promise that resolves with the HTML text or rejects with an error.
 */
async function fetchHtmlAsText(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Could not fetch HTML:", error);
        // Return a user-friendly error message as HTML
        return `<div class="card"><p class="text-danger">Error loading content for ${url}. Please check the console for details.</p></div>`;
    }
}