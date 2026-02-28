document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject Header
  const headerContainer = document.getElementById("header-placeholder");
  if (headerContainer) {
    fetch("/components/header.html")
      .then(response => response.text())
      .then(data => {
        headerContainer.innerHTML = data;
        setupMobileMenu(); // Initialize burger logic after header loads
      });
  }

  // 2. Inject Footer
  const footerContainer = document.getElementById("footer-placeholder");
  if (footerContainer) {
    fetch("/components/footer.html")
      .then(response => response.text())
      .then(data => {
        footerContainer.innerHTML = data;
      });
  }
});

function setupMobileMenu() {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    nav.classList.toggle('active');
    const icon = burger.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-xmark');
  });
}