// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js"; // Uncomment if using Analytics

// IMPORTANT: Keep API keys secure. For production, use environment variables
// and server-side logic or stricter Firebase Security Rules.
// This key is visible in client-side code.
const firebaseConfig = {
    apiKey: "AIzaSyD1ivyeUKAoNFZ-NQIlQ9AVlvfTTYqmgA0", // Replace with your actual API key
    authDomain: "nexysnet-43a4d.firebaseapp.com",
    databaseURL: "https://nexysnet-43a4d-default-rtdb.firebaseio.com",
    projectId: "nexysnet-43a4d",
    storageBucket: "nexysnet-43a4d.appspot.com",
    messagingSenderId: "756843839147",
    appId: "1:756843839147:web:56a7f6bc8d797142be41ee",
    measurementId: "G-T6F7WEKH9X" // Optional: For Analytics
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Uncomment if using Analytics
const db = getDatabase(app);
const postsRef = ref(db, 'posts');

// --- Constants & State ---
const REACTIONS_AVAILABLE = ['👍', '❤️', '🚀', '🤯', '🔥', '✨']; // Define available reactions
const MAX_POST_LENGTH = 500;
let currentUser = 'Guest'; // Default username

// --- DOM Element Caching ---
const userAvatar = document.getElementById('userAvatar');
const usernameModal = document.getElementById('usernameModal');
const closeModalButton = document.getElementById('closeModal');
const saveUserNameButton = document.getElementById('saveUserName');
const userNameInput = document.getElementById('userNameInput');
const postContentInput = document.getElementById('postContentInput');
const postImageURLInput = document.getElementById('postImageURLInput');
const submitPostBtn = document.getElementById('submitPostBtn');
const postsContainer = document.getElementById('postsContainer');
const postCharCounter = document.getElementById('postCharCounter');

// --- Utility Functions ---
/**
 * Formats a timestamp into a relative time string (e.g., "5m ago").
 * @param {number} timestamp - The Unix timestamp in milliseconds.
 * @returns {string} Formatted time string.
 */
function formatTimeAgo(timestamp) {
    if (!timestamp) return ''; // Handle cases where timestamp might be missing
    const now = Date.now();
    const secondsPast = (now - timestamp) / 1000;

    if (secondsPast < 60) return `${Math.round(secondsPast)}s ago`;
    if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}m ago`;
    if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}h ago`;

    const date = new Date(timestamp);
    // Within a week? Show days ago.
    if (secondsPast <= 604800) {
        const daysPast = Math.round(secondsPast / 86400);
        return `${daysPast}d ago`;
    }
    // Older than a week? Show Month Day.
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Gets the initials from a username.
 * @param {string} name - The username.
 * @returns {string} Uppercase initials (max 2).
 */
function getInitials(name) {
     if (!name || typeof name !== 'string') return '??';
     return name.split(' ')
               .map(n => n[0])
               .slice(0, 2) // Max 2 initials
               .join('')
               .toUpperCase() || '??'; // Fallback
}

/**
 * Sanitizes HTML to prevent basic XSS. VERY basic, use a library for robust sanitization.
 * @param {string} str - The input string.
 * @returns {string} Sanitized string.
 */
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}


// --- Modal Logic ---
function initModal() {
    const storedUserName = localStorage.getItem('nexysSocialUserName');
    if (storedUserName) {
        currentUser = storedUserName;
        userAvatar.textContent = getInitials(currentUser);
        userAvatar.title = `Logged in as ${currentUser}`;
    } else {
        usernameModal.classList.add('active'); // Show modal if no name stored
    }

    userAvatar.addEventListener('click', () => {
        userNameInput.value = localStorage.getItem('nexysSocialUserName') || '';
        usernameModal.classList.add('active');
        userNameInput.focus();
    });

    closeModalButton.addEventListener('click', () => {
        usernameModal.classList.remove('active');
    });

    // Close modal if clicking outside the content
    usernameModal.addEventListener('click', (event) => {
        if (event.target === usernameModal) {
            usernameModal.classList.remove('active');
        }
    });

    saveUserNameButton.addEventListener('click', () => {
        const newUserName = userNameInput.value.trim();
        if (newUserName && newUserName.length >= 3) {
            localStorage.setItem('nexysSocialUserName', newUserName);
            currentUser = newUserName;
            userAvatar.textContent = getInitials(currentUser);
            userAvatar.title = `Logged in as ${currentUser}`;
            usernameModal.classList.remove('active');
        } else if (newUserName.length > 0 && newUserName.length < 3) {
             alert("Username must be at least 3 characters long.");
             userNameInput.focus();
        } else {
            // Optionally handle empty input case, maybe revert to Guest?
            // localStorage.removeItem('nexysSocialUserName');
            // currentUser = 'Guest';
            // userAvatar.textContent = getInitials(currentUser);
             alert("Please enter a valid username.");
             userNameInput.focus();
        }
    });
}


// --- Post Creation ---
 function initPostCreation() {
    postContentInput.addEventListener('input', () => {
        const remaining = MAX_POST_LENGTH - postContentInput.value.length;
        postCharCounter.textContent = remaining;
        postCharCounter.style.color = remaining < 20 ? (remaining < 0 ? 'var(--error)' : 'var(--warning)') : 'var(--text-tertiary)';
        submitPostBtn.disabled = remaining < 0; // Disable if over limit
    });

     submitPostBtn.addEventListener('click', () => {
         if (currentUser === 'Guest' || currentUser.length < 3) {
             alert("Please set a valid username (at least 3 characters) before posting.");
             usernameModal.classList.add('active');
             userNameInput.focus();
             return;
         }

         const content = postContentInput.value.trim();
         const imageURL = postImageURLInput.value.trim();
         const currentLength = postContentInput.value.length;


         if (!content && !imageURL) {
             alert("Post cannot be empty. Write something or add an image URL.");
             postContentInput.focus();
             return;
         }
          if (currentLength > MAX_POST_LENGTH) {
             alert(`Post is too long! Maximum ${MAX_POST_LENGTH} characters allowed.`);
             postContentInput.focus();
             return;
         }

         const postData = {
             content: content, // Store trimmed content
             author: currentUser,
             timestamp: serverTimestamp(), // Use server timestamp for consistency
             reactions: {}, // Initialize empty
             comments: {},  // Initialize as object for easier updates
             shares: 0,
             imageUrl: imageURL || null // Store null if empty
         };

         const newPostRef = push(postsRef); // Generate a unique key
         set(newPostRef, postData)
             .then(() => {
                 // Clear inputs after successful post
                 postContentInput.value = '';
                 postImageURLInput.value = '';
                 postCharCounter.textContent = MAX_POST_LENGTH; // Reset counter
                 postCharCounter.style.color = 'var(--text-tertiary)';
                 console.log("Post created successfully!");
             })
             .catch((error) => {
                 console.error("Error creating post: ", error);
                 alert("Failed to create post. Please try again.");
             });
     });
 }

// --- Post Rendering ---
/**
 * Creates the HTML string for a single post.
 * @param {string} postId - The unique ID of the post.
 * @param {object} post - The post data object.
 * @returns {string} HTML string for the post article.
 */
function renderPost(postId, post) {
    if (!post || !post.author) {
        console.warn(`Skipping invalid post data for ID: ${postId}`);
        return ''; // Don't render if essential data is missing
    }

    const sanitizedContent = sanitizeHTML(post.content || '');
    const postTimestamp = formatTimeAgo(post.timestamp);
    const authorInitials = getInitials(post.author);

    // --- Reactions ---
    const totalLikes = post.reactions?.['❤️'] || 0; // Specific count for Likes
    const reactionsPanelHtml = REACTIONS_AVAILABLE.map(r => `
        <button class="reaction interaction-btn" data-action="react" data-reaction="${r}" title="React with ${r}">
            ${r} <span class="reaction-count">${post.reactions?.[r] || ''}</span>
        </button>
    `).join('');

    // --- Comments ---
    const commentsArray = post.comments ? Object.entries(post.comments).sort(([, a], [, b]) => a.timestamp - b.timestamp) : [];
    const commentsHtml = commentsArray.map(([commentId, c]) => {
        if (!c || !c.author || !c.text) return ''; // Skip invalid comments
        const commentAuthorInitials = getInitials(c.author);
        const sanitizedCommentText = sanitizeHTML(c.text);
        return `
        <div class="comment" data-comment-id="${commentId}">
            <div class="comment-avatar">${commentAuthorInitials}</div>
            <div class="comment-body">
               <div class="comment-author">${sanitizeHTML(c.author)}</div>
               <div class="comment-text">${sanitizedCommentText}</div>
               <div class="post-time">${formatTimeAgo(c.timestamp)}</div>
            </div>
        </div>
        `;
    }).join('');
    const commentCount = commentsArray.length;

    // --- Image ---
    const imageHtml = post.imageUrl ? `<img src="${sanitizeHTML(post.imageUrl)}" class="post-image" alt="User provided image for post by ${sanitizeHTML(post.author)}">` : '';

    // --- Share ---
    const shareCount = post.shares || 0; // TODO: Implement share count update

    // --- Build Post HTML ---
    return `
    <article class="post-card" data-post-id="${postId}">
        <div class="post-header">
            <div class="post-avatar" title="${sanitizeHTML(post.author)}">${authorInitials}</div>
            <div class="post-meta">
                <div class="post-author">${sanitizeHTML(post.author)}</div>
                <div class="post-time">${postTimestamp}</div>
            </div>
            <!-- Optional: Add options menu here -->
        </div>
        ${sanitizedContent ? `<div class="post-content">${sanitizedContent.replace(/\n/g, '<br>')}</div>` : ''}
        ${imageHtml}
        <div class="post-footer">
            <button class="interaction-btn like ${totalLikes > 0 ? 'liked' : ''}" data-action="toggle-reactions" title="React to post">
                 <span class="interaction-icon">❤️</span> ${totalLikes > 0 ? totalLikes : ''} Like${totalLikes !== 1 ? 's' : ''}
            </button>
            <button class="interaction-btn comment" data-action="toggle-comments" title="View/Add comments">
                 <span class="interaction-icon">💬</span> ${commentCount > 0 ? commentCount : ''} Comment${commentCount !== 1 ? 's' : ''}
            </button>
            <button class="interaction-btn share" data-action="toggle-share" title="Share post">
                 <span class="interaction-icon">🔗</span> ${shareCount > 0 ? shareCount : ''} Share${shareCount !== 1 ? 's' : ''}
            </button>
        </div>

        <!-- Interaction Panels -->
        <div class="reactions-panel" id="reactions-${postId}">${reactionsPanelHtml}</div>

        <div class="share-panel" id="share-${postId}">
            <input type="text" id="shareLink-${postId}" class="share-link" readonly value="${window.location.origin}${window.location.pathname}?post=${postId}" aria-label="Shareable link for this post">
            <button class="share-btn" data-action="copy-share-link" title="Copy Link">📋</button>
        </div>

        <div class="comments-section" id="comments-${postId}">
            ${commentsHtml}
            <div class="comment-form">
                <textarea id="commentInput-${postId}" class="comment-input" placeholder="Write a comment..." aria-label="Comment input for post ${postId}"></textarea>
                <button class="post-btn" data-action="add-comment">Comment</button>
            </div>
        </div>
    </article>
    `;
}

/**
 * Displays all posts fetched from Firebase.
 * @param {object|null} postsData - The snapshot value from Firebase (object of posts or null).
 */
function displayPosts(postsData) {
    if (!postsContainer) return; // Safety check

    if (!postsData) {
        postsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No posts yet. Be the first!</p>';
        return;
    }

    // Convert object to array and sort by timestamp descending (newest first)
    const postsArray = Object.entries(postsData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.timestamp - a.timestamp);

    postsContainer.innerHTML = postsArray.map(post => renderPost(post.id, post)).join('');
}


// --- Post Interactions ---

/**
 * Handles clicks on various interaction buttons within posts using event delegation.
 * @param {Event} event - The click event object.
 */
function handleInteraction(event) {
     const target = event.target;
     const actionButton = target.closest('[data-action]'); // Find the nearest element with data-action

     if (!actionButton) return; // Click wasn't on an actionable element

     const action = actionButton.dataset.action;
     const postCard = actionButton.closest('.post-card');
     if (!postCard) return; // Should always find a post card if action button is found

     const postId = postCard.dataset.postId;

     switch (action) {
         case 'toggle-reactions':
             togglePanel(postId, 'reactions');
             break;
         case 'toggle-comments':
             togglePanel(postId, 'comments');
             break;
         case 'toggle-share':
             togglePanel(postId, 'share');
             break;
         case 'react':
             if (currentUser === 'Guest') { alert("Please set a username to react."); return; }
             const reaction = actionButton.dataset.reaction;
             addReaction(postId, reaction);
             break;
         case 'add-comment':
              if (currentUser === 'Guest') { alert("Please set a username to comment."); return; }
             addComment(postId);
             break;
         case 'copy-share-link':
             copyShareLink(postId);
             break;
        // Add cases for other actions like delete, edit, etc.
     }
}

/**
* Toggles the visibility of interaction panels (reactions, comments, share).
* @param {string} postId - The ID of the post.
* @param {'reactions' | 'comments' | 'share'} panelType - The type of panel to toggle.
*/
function togglePanel(postId, panelType) {
   const panel = document.getElementById(`${panelType}-${postId}`);
   if (panel) {
       panel.classList.toggle('active');

       // Optional: Focus the input field when comments open
       if (panelType === 'comments' && panel.classList.contains('active')) {
           const commentInput = document.getElementById(`commentInput-${postId}`);
           commentInput?.focus();
       }
       // Optional: Select text when share panel opens
       if (panelType === 'share' && panel.classList.contains('active')) {
            const shareLinkInput = document.getElementById(`shareLink-${postId}`);
            shareLinkInput?.select();
       }
   } else {
       console.error(`Panel element not found: ${panelType}-${postId}`);
   }
}

/**
 * Adds or updates a reaction for a post.
 * For simplicity, this example just increments the count.
 * A real app would track *who* reacted to prevent multiple reactions of the same type.
 * @param {string} postId - The ID of the post.
 * @param {string} reactionEmoji - The reaction emoji (e.g., '❤️').
 */
function addReaction(postId, reactionEmoji) {
     const reactionRef = ref(db, `posts/${postId}/reactions/${reactionEmoji}`);
     // In a real app, you'd fetch the current count and increment, or use transactions.
     // This simplified version just sets it (or overwrites), demonstrating the path.
     // Let's simulate an increment for now. Need to read first.
     onValue(reactionRef, (snapshot) => {
        const currentCount = snapshot.val() || 0;
        set(reactionRef, currentCount + 1);
     }, { onlyOnce: true }); // Read only once

     // TODO: Add visual feedback (e.g., highlight the clicked reaction)
}

/**
 * Adds a new comment to a post.
 * @param {string} postId - The ID of the post.
 */
function addComment(postId) {
     const commentInput = document.getElementById(`commentInput-${postId}`);
     const commentText = commentInput.value.trim();

     if (!commentText) {
         alert("Comment cannot be empty.");
         commentInput.focus();
         return;
     }

     const newComment = {
         author: currentUser,
         text: commentText,
         timestamp: serverTimestamp()
     };

     const commentsRef = ref(db, `posts/${postId}/comments`);
     const newCommentRef = push(commentsRef); // Generate unique key for the comment

     set(newCommentRef, newComment)
         .then(() => {
             commentInput.value = ''; // Clear input on success
             console.log("Comment added!");
             // Optional: Keep comments section open after posting
             // togglePanel(postId, 'comments'); // Ensure it's open
         })
         .catch((error) => {
             console.error("Error adding comment: ", error);
             alert("Failed to add comment. Please try again.");
         });
}

 /**
 * Copies the share link to the clipboard.
 * @param {string} postId - The ID of the post.
 */
function copyShareLink(postId) {
     const shareLinkInput = document.getElementById(`shareLink-${postId}`);
     if (!shareLinkInput) return;

     shareLinkInput.select(); // Select the text
     shareLinkInput.setSelectionRange(0, 99999); // For mobile devices

     try {
         navigator.clipboard.writeText(shareLinkInput.value)
             .then(() => {
                 alert("Link copied to clipboard!"); // Provide feedback
             })
             .catch(err => {
                 console.error('Failed to copy link: ', err);
                 alert("Could not copy link. Please copy manually.");
             });
     } catch (err) {
         console.error('Clipboard API not available: ', err);
         alert("Clipboard access denied or not supported. Please copy manually.");
         // Fallback for older browsers (less reliable)
         // document.execCommand('copy');
     }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initModal();
    initPostCreation();

    // Attach the main event listener for interactions
    postsContainer.addEventListener('click', handleInteraction);

    // Listen for real-time updates to posts
    onValue(postsRef, (snapshot) => {
        displayPosts(snapshot.val());
    }, (error) => {
        console.error("Firebase read failed: " + error.code);
        postsContainer.innerHTML = '<p style="text-align: center; color: var(--error);">Error loading posts. Please refresh.</p>';
    });

     // Initial character count update
     postCharCounter.textContent = MAX_POST_LENGTH;
});
