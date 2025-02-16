import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
        import { getDatabase, ref, set, onValue, push, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

        const firebaseConfig = {
            apiKey: "AIzaSyD1ivyeUKAoNFZ-NQIlQ9AVlvfTTYqmgA0",
            authDomain: "nexysnet-43a4d.firebaseapp.com",
            databaseURL: "https://nexysnet-43a4d-default-rtdb.firebaseio.com",
            projectId: "nexysnet-43a4d",
            storageBucket: "nexysnet-43a4d.firebasestorage.app",
            messagingSenderId: "756843839147",
            appId: "1:756843839147:web:56a7f6bc8d797142be41ee",
            measurementId: "G-T6F7WEKH9X"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        const db = getDatabase(app);

        // Constants
        const reactions = ['👍', '❤️', '😆', '😮', '😢', '😠'];
        let currentUser = localStorage.getItem('userName') || 'Guest';

        // Initialize user interface
        document.getElementById('userAvatar').textContent = currentUser[0].toUpperCase(); // Ensure uppercase

        const userAvatar = document.getElementById('userAvatar');
        const usernameModal = document.getElementById('usernameModal');
        const closeModalButton = document.getElementById('closeModal');
        const saveUserNameButton = document.getElementById('saveUserName');
        const userNameInput = document.getElementById('userNameInput');

        userAvatar.addEventListener('click', () => {
            usernameModal.style.display = "block";
            userNameInput.value = localStorage.getItem('userName') || ''; // Pre-fill with current name
        });

        closeModalButton.addEventListener('click', () => {
            usernameModal.style.display = "none";
        });

        window.addEventListener('click', (event) => {
            if (event.target == usernameModal) {
                usernameModal.style.display = "none";
            }
        });

        saveUserNameButton.addEventListener('click', () => {
            const newUserName = userNameInput.value.trim();
            if (newUserName) {
                localStorage.setItem('userName', newUserName);
                currentUser = newUserName; // Update current user variable
                document.getElementById('userAvatar').textContent = currentUser[0].toUpperCase(); // Update avatar
            } else {
                localStorage.removeItem('userName'); // Optionally remove name if input is cleared
                currentUser = 'Guest'; // Reset to default
                document.getElementById('userAvatar').textContent = 'G'; // Reset avatar to default
            }
            usernameModal.style.display = "none";
        });



        // Functions
        function createPost() {
            if (currentUser.length < 3) {
                alert("Username must be at least 3 characters to post.");
                return;
            }

            const content = document.getElementById('postContent').value;
            const imageURL = document.getElementById('postImageURL').value; // Get image URL
            const name = currentUser; // Use current user name
            if (!content.trim() && !imageURL.trim()) { // Allow posts with only image or only text or both
                alert("Post content or image URL cannot be empty."); // Or better user feedback
                return;
            }

            // Create post data
            const postData = {
                content: content,
                author: name,
                timestamp: Date.now(),
                reactions: {},
                comments: [],
                shares: 0,
                imageUrl: imageURL.trim() // Add image URL to post data
            };

            // Save to Firebase
            const newPostRef = push(ref(db, 'posts'));
            set(newPostRef, postData);

            // Clear input
            document.getElementById('postContent').value = '';
            document.getElementById('postImageURL').value = ''; // Clear image URL input
        }

        function addReaction(postId, reaction, currentReactions) {
            const reactions = { ...currentReactions } || {};
            reactions[reaction] = (reactions[reaction] || 0) + 1;
            update(ref(db, `posts/${postId}`), { reactions });
        }

        function addComment(postId) {
            const commentText = document.querySelector(`#comment-${postId}`).value;
            if (!commentText.trim()) return;

            const newCommentRef = push(ref(db, `posts/${postId}/comments`));
            set(newCommentRef, {
                author: currentUser,
                text: commentText,
                timestamp: Date.now()
            });

            document.querySelector(`#comment-${postId}`).value = '';
            toggleComments(postId); // Optionally close comments after posting
        }

        function sharePost(postId) {
            const sharePanel = document.querySelector(`#share-${postId}`);
            sharePanel.classList.toggle('active');

            if (sharePanel.classList.contains('active')) {
                const shareLink = `${window.location.origin}${window.location.pathname}?post=${postId}`;
                document.querySelector(`#shareLink-${postId}`).value = shareLink;

                update(ref(db, `posts/${postId}`), {
                    shares: 0 // removed incrementing shares as per feedback, keeping share count simple
                });
            }
        }

        function displayPosts(posts) {
            const postsContainer = document.getElementById('posts');
            postsContainer.innerHTML = '';

            Object.entries(posts || {}).reverse().forEach(([postId, post]) => {
                const postElement = document.createElement('article');
                postElement.className = 'post-card';

                const reactionsHtml = reactions.map(reaction => {
                    const count = post.reactions?.[reaction] || 0;
                    return `
                        <button class="reaction interaction-btn" onclick="addReaction('${postId}', '${reaction}', ${JSON.stringify(post.reactions)})">
                            ${reaction} ${count || ''}
                        </button>
                    `;
                }).join('');

                const commentsHtml = Object.entries(post.comments || {}).map(([commentId, comment]) => `
                    <div class="comment">
                        <div class="post-header">
                            <div class="avatar">${comment.author[0].toUpperCase()}</div>
                            <div class="post-meta">
                                <div class="post-author">${comment.author}</div>
                                <div class="post-time">${new Date(comment.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="post-content">${comment.text}</div>
                    </div>
                `).join('');

                let imageHtml = ''; // Initialize image HTML
                if (post.imageUrl) { // Check if image URL exists
                    imageHtml = `<img src="${post.imageUrl}" alt="Post Image" class="post-image">`;
                }


                postElement.innerHTML = `
                    <div class="post-header">
                        <div class="avatar">${post.author[0].toUpperCase()}</div>
                        <div class="post-meta">
                            <div class="post-author">${post.author}</div>
                            <div class="post-time">${new Date(post.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    ${imageHtml}  <!-- Insert image HTML here -->
                    <div class="post-footer">
                        <button class="interaction-btn" onclick="toggleReactions('${postId}')">
                            👍 React
                        </button>
                        <button class="interaction-btn" onclick="toggleComments('${postId}')">
                            💬 Comment
                        </button>
                        <button class="interaction-btn" onclick="sharePost('${postId}')">
                            ↗️ Share
                        </button>
                    </div>
                    <div class="reactions-panel" id="reactions-${postId}">
                        ${reactionsHtml}
                    </div>
                    <div class="share-panel" id="share-${postId}">
                        <input type="text" class="share-link" id="shareLink-${postId}" value="${window.location.href}?post=${postId}" readonly />
                        <button class="post-btn" onclick="navigator.clipboard.writeText(document.querySelector('#shareLink-${postId}').value)">
                            Copy Link
                        </button>
                    </div>
                    <div class="comments-section" id="comments-${postId}">
                        ${commentsHtml}
                        <div class="comment-form">
                            <textarea id="comment-${postId}" class="comment-input" placeholder="Write a comment..."></textarea>
                            <button class="post-btn" onclick="addComment('${postId}')">
                                Comment
                            </button>
                        </div>
                    </div>
                `;
                postsContainer.appendChild(postElement);
            });
        }

        // Event listeners and real-time updates
        document.getElementById('submitPost').addEventListener('click', createPost);

        // Expose functions to window for HTML onclick handlers (Not needed as functions are in module scope and directly called in HTML)
        window.addReaction = addReaction; // Keep these if you prefer window scope for onclick, though module scope is cleaner.
        window.addComment = addComment;
        window.sharePost = sharePost;


        function toggleReactions(postId) {
            document.querySelector(`#reactions-${postId}`).classList.toggle('active');
        }
        window.toggleReactions = toggleReactions; // Expose to window if called from onclick

        function toggleComments(postId) {
            document.querySelector(`#comments-${postId}`).classList.toggle('active');
        }
        window.toggleComments = toggleComments; // Expose to window if called from onclick


        // Set up real-time listener for posts
        onValue(ref(db, 'posts'), (snapshot) => {
            displayPosts(snapshot.val());
        });