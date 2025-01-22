document.addEventListener('DOMContentLoaded', function() {
    const hamburgerButton = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    hamburgerButton.addEventListener('click', function() {
        navLinks.classList.toggle('active');
         document.querySelector('.hamburger-icon').classList.toggle('active');

    });
    
    // Basic form submission handling
    const contactForm = document.querySelector('.contact-form');
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        // Gather form data
        const formData = new FormData(contactForm);

        // You can process the data here or send it to a server (e.g., using fetch)
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        alert("Form submitted successfully (check console for values)!"); // Basic feedback for now

        // Reset form
        contactForm.reset();
    });
});
