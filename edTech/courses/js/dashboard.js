function openSubject(evt, subjectName) {
    var i, tabcontent, tablinks;
    
    // Hide all tab content
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove active class from buttons
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show current tab and add active class
    document.getElementById(subjectName).style.display = "block";
    if(evt) evt.currentTarget.className += " active";
}

// Initialize default tab
document.addEventListener('DOMContentLoaded', () => {
    // Click the first tab automatically
    const defaultTab = document.getElementById("mathematics-tab");
    if(defaultTab) defaultTab.click();
});