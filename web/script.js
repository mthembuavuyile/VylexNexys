
        // Mobile Menu Logic
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');

        btn.addEventListener('click', () => {
            menu.classList.toggle('open');
        });

        // Smart Navbar Logic
        let lastScrollTop = 0;
        const nav = document.getElementById('navbar');

        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Only trigger hide/show if we are not at the very top and menu isn't open
            if (!menu.classList.contains('open')) {
                if (scrollTop > lastScrollTop && scrollTop > 80) {
                    // Scrolling DOWN -> Hide
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling UP -> Show
                    nav.style.transform = 'translateY(0)';
                    
                    // Add background/shadow when scrolled, remove at top
                    if (scrollTop > 20) {
                        nav.classList.add('nav-sticky');
                    } else {
                        nav.classList.remove('nav-sticky');
                    }
                }
            }
            lastScrollTop = scrollTop;
        });
