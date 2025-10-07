//
//    Toggle Mobile Navigation
//
document.addEventListener('DOMContentLoaded', function() {
    const navbarMenu = document.querySelector("#navigation #navbar-menu");
    const hamburgerMenu = document.querySelector("#navigation .hamburger-menu");
    const serviceMenu = document.querySelector("#navigation .dropdown");
    const about = document.querySelector('#About\\ Us')
    const contact = document.querySelector('#Contact')

    // Check if elements exist before adding event listeners
    if (!navbarMenu || !hamburgerMenu || !serviceMenu || !about || !contact) {
        console.log('Navigation elements not found, skipping nav.js initialization');
        return; // Exit early if elements don't exist
    }

    const screenWidth = window.screen.width;



hamburgerMenu.addEventListener('click', function () {
    const isNavOpen = navbarMenu.classList.contains("open");
    if (!isNavOpen) {
        hamburgerMenu.setAttribute("aria-expanded", true);
        hamburgerMenu.classList.add("clicked");
        navbarMenu.classList.add("open");
    } else {
        hamburgerMenu.setAttribute("aria-expanded", false);
        hamburgerMenu.classList.remove("clicked");
        navbarMenu.classList.remove("open");
    }
});

serviceMenu.addEventListener('click', function () {
    const isServiceOpen = serviceMenu.classList.contains("open");
    if (!isServiceOpen) {
        serviceMenu.setAttribute("aria-expanded", true);
        serviceMenu.classList.add("open");
        if (screenWidth < 770) {
            about.style.display = 'none'
            contact.style.display = 'none'
        }


    } else {
        serviceMenu.setAttribute("aria-expanded", false);
        serviceMenu.classList.remove("open");
        if (screenWidth < 770) {
            about.style.display = 'block'
            contact.style.display = 'block'
        }



    }
}); // End of DOMContentLoaded