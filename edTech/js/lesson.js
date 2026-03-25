// Lesson logic and interactions
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Toggle Logic for Mobile
    const sidebar = document.querySelector('.lesson-sidebar');
    
    // Create toggle button if it doesn't exist but sidebar does
    if (sidebar && window.innerWidth <= 900) {
        let toggleBtn = document.querySelector('.sidebar-toggle');
        if (!toggleBtn) {
            toggleBtn = document.createElement('div');
            toggleBtn.className = 'sidebar-toggle';
            toggleBtn.innerHTML = '☰';
            document.body.appendChild(toggleBtn);
        }

        toggleBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('sidebar-open')) {
                sidebar.classList.remove('sidebar-open');
                toggleBtn.innerHTML = '☰';
            } else {
                sidebar.classList.add('sidebar-open');
                toggleBtn.innerHTML = '✕';
            }
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('sidebar-open') && 
                !sidebar.contains(e.target) && 
                e.target !== toggleBtn) {
                sidebar.classList.remove('sidebar-open');
                toggleBtn.innerHTML = '☰';
            }
        });
    }

    // 2. Interactive Quiz Logic
    const submitBtns = document.querySelectorAll('.quiz-submit');
    
    submitBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const quizContainer = e.target.closest('.interactive-quiz');
            const input = quizContainer.querySelector('input');
            const feedback = quizContainer.querySelector('.quiz-feedback');
            const correctAnswer = quizContainer.dataset.answer;

            // Clear previous feedback
            feedback.className = 'quiz-feedback';

            if (!input.value.trim()) {
                feedback.textContent = 'Please enter an answer!';
                feedback.classList.add('error');
                return;
            }

            // Simple validation
            if (input.value.trim() === correctAnswer) {
                feedback.textContent = 'Awesome! That is correct, great job.';
                feedback.classList.add('success');
                
                // Add a little celebration animation to the button
                btn.style.transform = 'scale(1.1)';
                setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
            } else {
                feedback.textContent = 'Not quite! Try reviewing the arithmetic rules and try again.';
                feedback.classList.add('error');
            }
        });
    });
});
