 // --- Firebase Setup ---
    // NOTE: Your Firebase config is public by design. Secure your database using Firebase Security Rules.
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
    import { getDatabase, ref, onValue, onChildAdded, onChildChanged, onChildRemoved, set, push, serverTimestamp, runTransaction, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

    const firebaseConfig = {
        apiKey: "AIzaSyD1ivyeUKAoNFZ-NQIlQ9AVlvfTTYqmgA0",
        authDomain: "nexysnet-43a4d.firebaseapp.com",
        databaseURL: "https://nexysnet-43a4d-default-rtdb.firebaseio.com",
        projectId: "nexysnet-43a4d",
        storageBucket: "nexysnet-43a4d.appspot.com",
        messagingSenderId: "756843839147",
        appId: "1:756843839147:web:56a7f6bc8d797142be41ee"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const postsRef = ref(db, 'posts');
    const connectionsRef = ref(db, 'connections');
    const presenceRef = ref(db, '.info/connected');

    // --- Constants & State ---
    const REACTIONS_AVAILABLE = ['❤️', '🚀', '🤯', '🔥', '👍', '😂'];
    const MAX_POST_LENGTH = 500;
    const state = {
        currentUser: 'Guest',
        captcha: { num1: 0, num2: 0, answer: 0 },
        isFeedInitialized: false,
    };

    // --- DOM Element Caching ---
    const D = {
        userAvatar: document.getElementById('userAvatar'),
        usernameModal: document.getElementById('usernameModal'),
        closeModal: document.getElementById('closeModal'),
        saveUserName: document.getElementById('saveUserName'),
        userNameInput: document.getElementById('userNameInput'),
        captchaQuestion: document.getElementById('captchaQuestion'),
        captchaAnswer: document.getElementById('captchaAnswer'),
        composerTrigger: document.getElementById('composer-trigger'),
        composerAvatar: document.getElementById('composerAvatar'),
        composerExpandedContent: document.getElementById('composer-expanded-content'),
        postContentInput: document.getElementById('postContentInput'),
        postImageURLInput: document.getElementById('postImageURLInput'),
        postTagsInput: document.getElementById('postTagsInput'),
        submitPostBtn: document.getElementById('submitPostBtn'),
        cancelPostBtn: document.getElementById('cancelPostBtn'),
        postsContainer: document.getElementById('postsContainer'),
        skeletonLoader: document.getElementById('skeleton-loader'),
        postCharCounter: document.getElementById('postCharCounter'),
        postTemplate: document.getElementById('post-template'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage'),
        onlineCount: document.getElementById('onlineCount'),
        activeUsers: document.getElementById('activeUsers'),
        totalPosts: document.getElementById('totalPosts'),
        totalReactions: document.getElementById('totalReactions'),
        trendingTopics: document.getElementById('trendingTopics'),
    };

    // --- Utility Functions ---
    const formatTimeAgo = (ts) => {
        if (!ts) return '';
        const seconds = (Date.now() - ts) / 1000;
        if (seconds < 60) return `${Math.round(seconds)}s ago`;
        const minutes = seconds / 60;
        if (minutes < 60) return `${Math.round(minutes)}m ago`;
        const hours = minutes / 60;
        if (hours < 24) return `${Math.round(hours)}h ago`;
        return new Date(ts).toLocaleDateString('en-us', { month: 'short', day: 'numeric' });
    };

    const getInitials = (name) => (!name || typeof name !== 'string') ? '??' : name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
    
    const showToast = (message, type = 'info') => {
        D.toastMessage.textContent = message;
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
        document.getElementById('toastIcon').textContent = icons[type];
        D.toast.className = `fixed bottom-6 right-6 text-white py-4 px-6 rounded-xl shadow-2xl z-50 border border-white/20 ${colors[type]} show`;
        setTimeout(() => D.toast.classList.remove('show'), 3000);
    };

    const escapeHTML = (str) => str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

    const createRichText = (text) => {
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const tagRegex = /(#[\w-]+)/g;
        let richText = escapeHTML(text);
        richText = richText.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`);
        richText = richText.replace(tagRegex, (tag) => `<span class="text-purple-400 font-semibold">${tag}</span>`);
        return richText;
    };

    // --- UI & Component Functions ---
    const updateUserUI = (name) => {
        state.currentUser = name;
        const initials = getInitials(name);
        const randomColor = `bg-gradient-to-br from-green-400 to-blue-500`; // Could be dynamic
        D.userAvatar.textContent = initials;
        D.userAvatar.className = `relative w-12 h-12 ${randomColor} rounded-full flex items-center justify-center font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg`;
        D.composerAvatar.textContent = initials;
        D.userAvatar.title = `Logged in as ${name}`;
    };

    const toggleComposer = (expand) => {
        if (expand) {
            D.composerExpandedContent.classList.add('expanded');
            D.postContentInput.focus();
        } else {
            D.composerExpandedContent.classList.remove('expanded');
            D.postContentInput.value = '';
            D.postImageURLInput.value = '';
            D.postTagsInput.value = '';
            D.submitPostBtn.disabled = true;
            D.postCharCounter.textContent = MAX_POST_LENGTH;
        }
    };

    const updatePostElement = (element, post) => {
        // Update Reactions
        const totalReactions = Object.values(post.reactions || {}).reduce((sum, count) => sum + count, 0);
        const userReaction = post.userReactions?.[state.currentUser];
        element.querySelector('[data-reaction-emoji]').textContent = userReaction || '🤍';
        element.querySelector('[data-reaction-count]').textContent = totalReactions;

        // Update Comments
        const commentsContainer = element.querySelector('[data-comments-container]');
        const commentCount = post.comments ? Object.keys(post.comments).length : 0;
        element.querySelector('[data-comment-count]').textContent = commentCount;
        commentsContainer.innerHTML = '';
        if (post.comments) {
            const sortedComments = Object.values(post.comments).sort((a, b) => a.timestamp - b.timestamp);
            sortedComments.forEach(c => commentsContainer.appendChild(createCommentElement(c)));
        }
    };
    
    const createCommentElement = (comment) => {
        const div = document.createElement('div');
        div.className = 'flex space-x-3';
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">${getInitials(comment.author)}</div>
            <div class="flex-1 bg-gray-700 rounded-lg p-3">
                <p class="font-semibold text-sm text-white">${escapeHTML(comment.author)} <span class="text-xs text-gray-400 font-normal ml-2">${formatTimeAgo(comment.timestamp)}</span></p>
                <p class="text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words">${escapeHTML(comment.text)}</p>
            </div>`;
        return div;
    };

    const createPostElement = (postId, post) => {
        const clone = D.postTemplate.content.cloneNode(true);
        const article = clone.querySelector('.post-card');
        article.dataset.postId = postId;

        article.querySelector('[data-author-initials]').textContent = getInitials(post.author);
        article.querySelector('[data-author-name]').textContent = escapeHTML(post.author);
        article.querySelector('[data-timestamp]').textContent = formatTimeAgo(post.timestamp);
        
        const deleteBtn = article.querySelector('[data-action="delete"]');
        if (post.author === state.currentUser) {
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.style.display = 'none';
        }

        const tagsContainer = article.querySelector('[data-post-tags]');
        if (post.tags) {
            tagsContainer.innerHTML = post.tags.split(/\s+/).filter(Boolean).map(tag => 
                `<span class="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">${escapeHTML(tag)}</span>`
            ).join(' ');
        }
        
        article.querySelector('[data-post-content]').innerHTML = createRichText(post.content);
        
        const img = article.querySelector('[data-post-image]');
        if (post.imageUrl) {
            img.src = post.imageUrl;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
        
        article.querySelector('[data-reactions-panel]').innerHTML = REACTIONS_AVAILABLE.map(r => `<button class="text-2xl p-2 rounded-full hover:bg-gray-700 transition-transform hover:scale-125" data-action="react" data-reaction="${r}">${r}</button>`).join('');
        article.querySelector('[data-share-link]').value = `${window.location.origin}${window.location.pathname}?post=${postId}`;
        article.querySelector('[data-current-user-initials]').textContent = getInitials(state.currentUser);

        updatePostElement(article, post); // Set initial reaction/comment counts
        return article;
    };

    // --- Firebase & Real-Time Logic ---
    const initPresence = () => {
        onValue(presenceRef, (snap) => {
            if (snap.val() === false) return;
            const con = push(connectionsRef);
            onDisconnect(con).remove();
            set(con, { user: state.currentUser, timestamp: serverTimestamp() });
        });

        onValue(connectionsRef, (snap) => {
            const count = snap.exists() ? snap.size : 0;
            D.onlineCount.textContent = `${count} online`;
            D.activeUsers.textContent = count; // Also update sidebar
        });
    };

    const handleCreatePost = () => {
        if (!checkUser()) return;
        
        const content = D.postContentInput.value.trim();
        const imageURL = D.postImageURLInput.value.trim();
        const tags = D.postTagsInput.value.trim();

        if (!content && !imageURL) return showToast("Post cannot be empty.", 'error');
        if (D.postContentInput.value.length > MAX_POST_LENGTH) return showToast(`Post exceeds ${MAX_POST_LENGTH} chars.`, 'error');

        D.submitPostBtn.disabled = true;
        D.submitPostBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Posting...`;

        set(push(postsRef), {
            content,
            tags,
            author: state.currentUser,
            timestamp: serverTimestamp(),
            imageUrl: imageURL || null,
        }).then(() => {
            toggleComposer(false);
            showToast('Post published!', 'success');
        }).catch(error => {
            console.error("Error creating post: ", error);
            showToast('Failed to publish post.', 'error');
        }).finally(() => {
            D.submitPostBtn.disabled = false;
            D.submitPostBtn.innerHTML = '<span>Post ✨</span>';
        });
    };
    
    const addReaction = (postId, newReaction) => {
        runTransaction(ref(db, `posts/${postId}`), (post) => {
            if (post) {
                post.reactions = post.reactions || {};
                post.userReactions = post.userReactions || {};
                const oldReaction = post.userReactions[state.currentUser];

                if (oldReaction === newReaction) { // Un-react
                    if (post.reactions[oldReaction]) post.reactions[oldReaction]--;
                    delete post.userReactions[state.currentUser];
                } else { // React or change reaction
                    if (oldReaction && post.reactions[oldReaction]) post.reactions[oldReaction]--;
                    post.reactions[newReaction] = (post.reactions[newReaction] || 0) + 1;
                    post.userReactions[state.currentUser] = newReaction;
                }
            }
            return post;
        });
    };
    
    const addComment = (postId, postCard) => {
        const input = postCard.querySelector('[data-comment-input]');
        const text = input.value.trim();
        if (!text) return;
        set(push(ref(db, `posts/${postId}/comments`)), { 
            author: state.currentUser, text, timestamp: serverTimestamp() 
        }).then(() => { input.value = ''; });
    };

    const deletePost = (postId, author) => {
        if (author !== state.currentUser) {
            return showToast("You can only delete your own posts.", "error");
        }
        if (confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            remove(ref(db, `posts/${postId}`))
                .then(() => showToast("Post deleted.", "success"))
                .catch((e) => showToast("Error deleting post.", "error"));
        }
    };
    
    const copyShareLink = (postCard, button) => {
        const input = postCard.querySelector('[data-share-link]');
        navigator.clipboard.writeText(input.value).then(() => {
            button.textContent = 'Copied!';
            setTimeout(() => { button.textContent = 'Copy'; }, 2000);
        });
    };

    const handlePostInteraction = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
    
        const action = target.dataset.action;
        const postCard = target.closest('.post-card');
        if (!postCard) return;
        const postId = postCard.dataset.postId;
    
        const togglePanel = (panelSelector, btn) => {
            const panel = postCard.querySelector(panelSelector);
            const isActive = !panel.classList.toggle('hidden');
            document.querySelectorAll('.interaction-btn.active').forEach(b => b.classList.remove('active'));
            if(isActive) btn.classList.add('active');
            if (panelSelector.includes('comments') && isActive) {
                panel.querySelector('[data-comment-input]')?.focus();
            }
        };

        switch (action) {
            case 'toggle-reactions': togglePanel('[data-reactions-panel]', target); break;
            case 'toggle-comments': togglePanel('[data-comments-section]', target); break;
            case 'toggle-share': togglePanel('[data-share-panel]', target); break;
            case 'delete': deletePost(postId, postCard.querySelector('[data-author-name]').textContent); break;
            case 'react': if (checkUser()) addReaction(postId, target.dataset.reaction); break;
            case 'add-comment': if (checkUser()) addComment(postId, postCard); break;
            case 'copy-share-link': copyShareLink(postCard, target); break;
        }
    };


    // --- User & Modal Logic ---
    const generateCaptcha = () => {
        state.captcha.num1 = Math.floor(Math.random() * 10) + 1;
        state.captcha.num2 = Math.floor(Math.random() * 10) + 1;
        state.captcha.answer = state.captcha.num1 + state.captcha.num2;
        D.captchaQuestion.textContent = `Human Check: What is ${state.captcha.num1} + ${state.captcha.num2}?`;
        D.captchaAnswer.value = '';
    };

    const handleSaveUser = () => {
        if (parseInt(D.captchaAnswer.value, 10) !== state.captcha.answer) {
            showToast("Incorrect answer. Please try again.", 'error');
            return generateCaptcha();
        }
        const newUserName = D.userNameInput.value.trim();
        if (newUserName.length >= 3) {
            localStorage.setItem('nexysSocialUserName', newUserName);
            initUser();
            D.usernameModal.classList.remove('active');
            showToast(`Welcome, ${newUserName}!`, 'success');
        } else {
            showToast("Username must be at least 3 characters.", 'error');
        }
    };
    
    const checkUser = () => {
        if (state.currentUser === 'Guest') {
            D.usernameModal.classList.add('active');
            generateCaptcha();
            D.userNameInput.focus();
            return false;
        }
        return true;
    };
    
    const initUser = () => {
        const storedUserName = localStorage.getItem('nexysSocialUserName');
        if (storedUserName) {
            updateUserUI(storedUserName);
            initPresence();
        } else {
            D.usernameModal.classList.add('active');
            generateCaptcha();
            D.userNameInput.focus();
        }
    };

    // --- Main Initialization ---
    const initEventListeners = () => {
        D.userAvatar.addEventListener('click', () => { D.usernameModal.classList.add('active'); generateCaptcha(); });
        D.closeModal.addEventListener('click', () => D.usernameModal.classList.remove('active'));
        D.saveUserName.addEventListener('click', handleSaveUser);
        [D.userNameInput, D.captchaAnswer].forEach(el => el.addEventListener('keypress', (e) => e.key === 'Enter' && handleSaveUser()));
        
        D.composerTrigger.addEventListener('click', () => checkUser() && toggleComposer(true));
        D.cancelPostBtn.addEventListener('click', () => toggleComposer(false));
        D.submitPostBtn.addEventListener('click', handleCreatePost);

        D.postContentInput.addEventListener('input', () => {
            const count = D.postContentInput.value.length;
            const remaining = MAX_POST_LENGTH - count;
            D.postCharCounter.textContent = remaining;
            D.postCharCounter.style.color = remaining < 0 ? 'var(--accent-red)' : 'var(--text-tertiary)';
            D.submitPostBtn.disabled = remaining < 0 || D.postContentInput.value.trim().length === 0;
        });

        D.postsContainer.addEventListener('click', handlePostInteraction);
    };

    const initFirebaseListeners = () => {
        onChildAdded(postsRef, (snapshot) => {
            if (!state.isFeedInitialized) {
                D.postsContainer.innerHTML = '';
                state.isFeedInitialized = true;
            }
            const postEl = createPostElement(snapshot.key, snapshot.val());
            postEl.classList.add('animate-slide-up');
            D.postsContainer.prepend(postEl);
        });

        onChildChanged(postsRef, (snapshot) => {
            const postEl = D.postsContainer.querySelector(`[data-post-id="${snapshot.key}"]`);
            if (postEl) updatePostElement(postEl, snapshot.val());
        });

        onChildRemoved(postsRef, (snapshot) => {
            const postEl = D.postsContainer.querySelector(`[data-post-id="${snapshot.key}"]`);
            if (postEl) {
                postEl.classList.add('animate-fade-out');
                postEl.addEventListener('animationend', () => postEl.remove());
            }
        });

        // Listener for aggregate stats
        onValue(postsRef, (snapshot) => {
            if (!snapshot.exists()) {
                D.trendingTopics.innerHTML = `<div class="text-sm text-gray-400">No trends yet.</div>`;
                return;
            };
            
            const posts = snapshot.val();
            const postCount = Object.keys(posts).length;
            let totalReactions = 0;
            const tagCounts = {};

            for (const key in posts) {
                totalReactions += Object.values(posts[key].reactions || {}).reduce((a, b) => a + b, 0);
                if(posts[key].tags) {
                    posts[key].tags.split(/\s+/).filter(Boolean).forEach(tag => {
                        const cleanTag = tag.toLowerCase();
                        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                    });
                }
            }

            D.totalPosts.textContent = postCount;
            D.totalReactions.textContent = totalReactions;

            const sortedTags = Object.entries(tagCounts).sort(([,a],[,b]) => b-a).slice(0, 5);
            D.trendingTopics.innerHTML = sortedTags.map(([tag, count]) => `
                <div class="flex justify-between items-center text-sm">
                    <span class="font-semibold text-purple-300">${escapeHTML(tag)}</span>
                    <span class="text-gray-400">${count} posts</span>
                </div>
            `).join('') || `<div class="text-sm text-gray-400">No trends yet.</div>`;
        });
    };

    // --- App Start ---
    document.addEventListener('DOMContentLoaded', () => {
        initUser();
        initEventListeners();
        initFirebaseListeners();
    });
