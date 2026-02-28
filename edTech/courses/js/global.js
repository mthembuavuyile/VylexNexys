document.addEventListener('DOMContentLoaded', () => {
    loadSharedComponents();
});

function loadSharedComponents() {
    const rootPath = document.body.getAttribute('data-root-path') || './';

    // Updated header with Burger Icon
    const headerHTML = `
    <div class="container">
        <nav>
            <div id="branding">
                <h1><span class="highlight">Vylex Nexys</span> EdTech</h1>
            </div>
            
            <ul class="nav-links" id="nav-menu">
                <li><a href="${rootPath}index.html">Home</a></li>
                <li><a href="${rootPath}edTech/courses">Courses</a></li>
                <li><a href="${rootPath}about.html">About</a></li>
                <li><a href="${rootPath}tools/">Tools</a></li>
                <li><a href="${rootPath}contact.html">Contact</a></li>
            </ul>

            <div class="burger" id="burger-menu">
                <div class="line1"></div>
                <div class="line2"></div>
                <div class="line3"></div>
            </div>
        </nav>
    </div>
    `;

    const footerHTML = `
        <p>Copyright &copy; ${new Date().getFullYear()} Vylex Nexys. All Rights Reserved.</p>
    `;

    document.getElementById('main-header').innerHTML = headerHTML;
    document.getElementById('main-footer').innerHTML = footerHTML;

    // --- BURGER MENU LOGIC ---
    const burger = document.getElementById('burger-menu');
    const nav = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');

        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Burger Animation
        burger.classList.toggle('toggle');
    });
}