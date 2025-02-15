class Note {
    constructor(id, title, content, tags = [], isFavorite = false) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.tags = tags;
        this.isFavorite = isFavorite;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

class NoteMasterApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentFilter = 'all';
        this.setupEventListeners();
        this.renderNotes();
        this.setupTheme();
    }

    setupEventListeners() {
        // Modal triggers
        document.getElementById('newNoteBtn').addEventListener('click', () => this.openModal());
        document.getElementById('fab').addEventListener('click', () => this.openModal());
        document.getElementById('cancelNote').addEventListener('click', () => this.closeModal());
        document.getElementById('noteForm').addEventListener('submit', (e) => this.handleNoteSave(e));

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));

        // Filters
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Mobile menu
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleMobileMenu());

        // Close menu when clicking overlay
        document.getElementById('overlay').addEventListener('click', (e) => {
            if (e.target.id === 'overlay') {
                this.closeMobileMenu();
            }
        });

        // Close menu when clicking a menu item (on mobile)
        document.querySelectorAll('.sidebar-buttons .btn').forEach(button => {
            button.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    openModal(note = null) {
        const modal = document.getElementById('noteModal');
        const overlay = document.getElementById('overlay');
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const tagsInput = document.getElementById('tags');
        const noteIdInput = document.getElementById('noteId');

        if (note) {
            titleInput.value = note.title;
            contentInput.value = note.content;
            tagsInput.value = note.tags.join(', ');
            noteIdInput.value = note.id;
            document.getElementById('modalTitle').textContent = 'Edit Note';
        } else {
            titleInput.value = '';
            contentInput.value = '';
            tagsInput.value = '';
            noteIdInput.value = '';
            document.getElementById('modalTitle').textContent = 'New Note';
        }

        modal.classList.add('active');
        overlay.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('noteModal');
        const overlay = document.getElementById('overlay');
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }

    handleNoteSave(e) {
        e.preventDefault();
        const noteId = document.getElementById('noteId').value;
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const tags = document.getElementById('tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);

        if (noteId) {
            const noteIndex = this.notes.findIndex(note => note.id === noteId);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    title,
                    content,
                    tags,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            const newNote = new Note(
                Date.now().toString(),
                title,
                content,
                tags
            );
            this.notes.unshift(newNote);
        }

        this.saveNotes();
        this.renderNotes();
        this.closeModal();
    }

    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== noteId);
            this.saveNotes();
            this.renderNotes();
        }
    }

    toggleFavorite(noteId) {
        const note = this.notes.find(note => note.id === noteId);
        if (note) {
            note.isFavorite = !note.isFavorite;
            this.saveNotes();
            this.renderNotes();
        }
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredNotes = this.notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        this.renderNotes(filteredNotes);
    }

    handleFilter(filter) {
        this.currentFilter = filter;
        this.renderNotes();
    }

    renderNotes(notesToRender = null) {
        const notesGrid = document.getElementById('notesGrid');
        let displayNotes = notesToRender || this.notes;

        if (this.currentFilter === 'favorites') {
            displayNotes = displayNotes.filter(note => note.isFavorite);
        }

        if (displayNotes.length === 0) {
            notesGrid.innerHTML = this.getEmptyStateHTML();
            return;
        }

        notesGrid.innerHTML = displayNotes.map(note => this.getNoteCardHTML(note)).join('');

        // Add event listeners to the newly created elements
        displayNotes.forEach(note => {
            const card = document.querySelector(`[data-note-id="${note.id}"]`);
            card.querySelector('.edit-btn').addEventListener('click', () => this.openModal(note));
            card.querySelector('.delete-btn').addEventListener('click', () => this.deleteNote(note.id));
            card.querySelector('.favorite-btn').addEventListener('click', () => this.toggleFavorite(note.id));
        });
    }

    getNoteCardHTML(note) {
        return `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <div class="note-actions">
                        <button class="btn favorite-btn">
                            <i class="fas fa-star" style="color: ${note.isFavorite ? 'gold' : 'var(--text-secondary)'}"></i>
                        </button>
                        <button class="btn edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">${marked.parse(note.content)}</div>
                <div class="note-footer">
                    <div class="note-tags">
                        ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-notes-medical"></i>
                </div>
                <h2>No Notes Found</h2>
                <p>Create your first note by clicking the + button</p>
            </div>
        `;
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    setupTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark', theme === 'dark');
        this.updateThemeIcon(theme);
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateThemeIcon(isDark ? 'dark' : 'light');
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const isOpen = sidebar.classList.contains('open');

        if (isOpen) {
            this.closeMobileMenu();
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new NoteMasterApp();
});