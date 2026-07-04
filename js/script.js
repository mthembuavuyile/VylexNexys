document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject Header
  const headerContainer = document.getElementById("header-placeholder");
  if (headerContainer) {
    fetch("/components/header.html")
      .then(response => response.text())
      .then(data => {
        headerContainer.innerHTML = data;
        setupMobileMenu(); // Initialize burger logic after header loads
        setupAppSwitcher(); // Initialize Google-style App Switcher logic
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

function setupAppSwitcher() {
  const trigger = document.getElementById('appSwitcherTrigger');
  const dropdown = document.getElementById('appSwitcherDropdown');
  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', !isExpanded);
    dropdown.classList.toggle('active');
    dropdown.setAttribute('aria-hidden', isExpanded);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
      trigger.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('active');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  });

  // Close dropdown on pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      trigger.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('active');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  });
}