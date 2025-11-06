//
//    Toggle Mobile Navigation
//
document.addEventListener('DOMContentLoaded', function() {
    const navbarMenu = document.querySelector("#navigation #navbar-menu");
    const hamburgerMenu = document.querySelector("#navigation .hamburger-menu");
    const serviceMenu = document.querySelector("#navigation .dropdown");
    const about = document.querySelector('#About\\ Us') || document.querySelector('#About Us');
    const contact = document.querySelector('#Contact');

    // Check if essential elements exist (hamburger menu and navbar are required)
    if (!navbarMenu || !hamburgerMenu) {
        return; // Exit early if essential elements don't exist
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

// Only add service menu functionality if serviceMenu exists
if (serviceMenu) {
    const dropdownToggle = serviceMenu.querySelector('.dropdown-toggle');
    
    // Check if current page is a services page to mark dropdown as active
    const currentPath = window.location.pathname;
    const servicesPaths = ['/resell-hub/', '/mentorship-consulting/', '/trading-investing/', '/partner-invest/'];
    if (servicesPaths.includes(currentPath)) {
        // Mark the Services dropdown toggle as active
        if (dropdownToggle) {
            dropdownToggle.classList.add('active');
        }
        // Mark the specific dropdown item as active
        const activeLink = serviceMenu.querySelector(`a[href="${currentPath}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', function (e) {
            e.preventDefault();
            const isServiceOpen = serviceMenu.classList.contains("open");
            if (!isServiceOpen) {
                serviceMenu.setAttribute("aria-expanded", true);
                serviceMenu.classList.add("open");
                dropdownToggle.setAttribute("aria-expanded", "true");
                if (screenWidth < 770) {
                    if (about) about.style.display = 'none';
                    if (contact) contact.style.display = 'none';
                }
            } else {
                serviceMenu.setAttribute("aria-expanded", false);
                serviceMenu.classList.remove("open");
                dropdownToggle.setAttribute("aria-expanded", "false");
                if (screenWidth < 770) {
                    if (about) about.style.display = 'block';
                    if (contact) contact.style.display = 'block';
                }
            }
        });
    }
}
}); // End of DOMContentLoaded