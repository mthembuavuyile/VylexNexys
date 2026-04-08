let earnedXp = 50;

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('b')) earnedXp = 500;
    document.getElementById('xp-award-text').innerText = `+${earnedXp} XP`;
});

function nextSlide(num) {
    document.querySelectorAll('main > div').forEach(el => el.classList.add('view-hidden'));
    document.getElementById(`slide-${num}`).classList.remove('view-hidden');
    document.getElementById('progress-bar').style.width = (num * 33) + '%';
}

function handleAnswer(btn, isCorrect) {
    document.querySelectorAll('button').forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.replace('border-slate-700', 'border-emerald-500');
        btn.classList.replace('text-slate-300', 'text-emerald-400');
        btn.classList.add('bg-emerald-500/10');

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#10b981', '#f59e0b'] });

        setTimeout(() => {
            const overlay = document.getElementById('success-overlay');
            overlay.classList.remove('view-hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 50);
        }, 800);
    } else {
        btn.classList.replace('border-slate-700', 'border-red-500');
        btn.classList.replace('text-slate-300', 'text-red-400');
        btn.classList.add('bg-red-500/10');

        const correctBtn = document.getElementById('correct-btn');
        correctBtn.classList.replace('border-slate-700', 'border-emerald-500');
        correctBtn.classList.replace('text-slate-300', 'text-emerald-400');

        setTimeout(() => {
            document.querySelectorAll('button').forEach(b => b.disabled = false);
            btn.classList.replace('border-red-500', 'border-slate-700');
            btn.classList.replace('text-red-400', 'text-slate-300');
            btn.classList.remove('bg-red-500/10');
            correctBtn.classList.replace('border-emerald-500', 'border-slate-700');
            correctBtn.classList.replace('text-emerald-400', 'text-slate-300');
        }, 2000);
    }
}

function finishLesson() {
    loadProfile();
    userProfile.xp += earnedXp;
    saveProfile();
    window.location.href = 'index.html';
}