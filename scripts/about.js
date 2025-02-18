document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;

    // Create mobile menu overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(10px);
        z-index: 90;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);

    // Style mobile menu
    if (window.innerWidth <= 768) {
        navLinks.style.cssText = `
            position: fixed;
            top: 80px;
            left: 0;
            width: 100%;
            height: calc(100vh - 80px);
            background: transparent;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            z-index: 95;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
    }

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        hamburger.classList.toggle('active');
        
        if (isMenuOpen) {
            overlay.style.display = 'block';
            navLinks.style.display = 'flex';
            // Force reflow
            overlay.offsetHeight;
            navLinks.offsetHeight;
            
            overlay.style.opacity = '1';
            navLinks.style.opacity = '1';
            document.body.style.overflow = 'hidden';
        } else {
            overlay.style.opacity = '0';
            navLinks.style.opacity = '0';
            document.body.style.overflow = '';
            
            setTimeout(() => {
                overlay.style.display = 'none';
                navLinks.style.display = 'none';
            }, 300);
        }
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', () => {
        if (isMenuOpen) toggleMenu();
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            if (isMenuOpen) toggleMenu();

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    let lastScroll = 0;
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.style.boxShadow = 'none';
            return;
        }
        
        if (currentScroll > lastScroll) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
        
        lastScroll = currentScroll;
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Add fade-in animation to sections
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});