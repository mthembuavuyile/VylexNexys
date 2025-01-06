        document.addEventListener('DOMContentLoaded', () => {
            const header = document.querySelector('header');
            const hamburgerIcon = document.querySelector('.hamburger-icon');
            const navLinks = document.querySelector('.nav-links');

            window.addEventListener('scroll', () => {
                const scrollPosition = window.scrollY;
                if (scrollPosition > 50) {
                    header.style.backgroundColor = 'rgba(17, 24, 39, 0.98)';
                    header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                } else {
                    header.style.backgroundColor = 'rgba(17, 24, 39, 0.95)';
                    header.style.boxShadow = 'none';
                }
            });

            hamburgerIcon.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });

            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                });
            });

            // Intersection Observer for Fade-In Effect
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.feature-card').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(el);
            });
        });
