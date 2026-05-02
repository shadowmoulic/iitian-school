/**
 * IITian School Web Components
 * Centralized Navbar, Footer and Shared UI Elements
 */

document.addEventListener('DOMContentLoaded', () => {
    // Shared state for the component
    const currentPath = window.location.pathname;
    // Detect if we are in a monorepo subdirectory or root deployment
    const base = currentPath.startsWith('/iitianschool') ? '/iitianschool' : '';

    // Inject Shared Components
    injectNavbar(base, currentPath);
    injectFooter(base);
    injectWhatsApp();

    // Re-initialize Lucide Icons after injection
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize Mobile Menu & Scroll Logic
    initNavigationLogic();
});

function injectNavbar(base, currentPath) {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (!navPlaceholder) return;

    const isAbout = currentPath.includes('/about');
    const isVideos = currentPath.includes('/videos') || currentPath.includes('videos.html') || currentPath.includes('video2.html');

    const navbarHTML = `
    <nav id="navbar">
        <div class="container nav-content">
            <a href="${base}/" class="logo">
                <i data-lucide="graduation-cap" class="text-primary"></i>
                IITian<span>school</span>
            </a>
            <div class="nav-links">
                <a href="${base}/#courses">Courses</a>
                <a href="${base}/about" class="${isAbout ? 'active' : ''}">About</a>
                <a href="${base}/videos" class="${isVideos ? 'active' : ''}">Videos</a>
                <a href="${base}/#tests">Free Tests</a>
                <a href="${base}/#apps">Mobile App</a>
            </div>
            <div class="mobile-menu-btn">
                <i class="fa-solid fa-bars"></i>
            </div>
        </div>
    </nav>
    `;
    navPlaceholder.outerHTML = navbarHTML;
}

function injectFooter(base) {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    const footerHTML = `
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-about">
                    <a href="${base}/" class="logo">IITian<span>school</span></a>
                    <p>IITian School is a leading educational platform committed to providing high-quality coaching
                        services with a dedicated focus on academic excellence.</p>
                    <div class="social-links">
                        <a href="https://wa.me/919692792825" target="_blank"><i class="fab fa-whatsapp"></i></a>
                        <a href="https://www.youtube.com/@iitianschoolonline" target="_blank"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="${base}/">Home</a></li>
                        <li><a href="${base}/#courses">Courses</a></li>
                        <li><a href="${base}/#tests">Free Tests</a></li>
                        <li><a href="${base}/about">About Us</a></li>
                        <li><a href="${base}/videos">Video Lectures</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms & Conditions</a></li>
                        <li><a href="#">Disclaimer</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Contact Us</h4>
                    <p><i data-lucide="map-pin"></i> Old Town Tankapani Road Near Appolo Pharmacy, Bhubaneswar</p>
                    <p><i data-lucide="mail"></i> iitianschoolonline@gmail.com</p>
                    <p><i data-lucide="phone"></i> +91 9827618994</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 IITian School. All Rights Reserved.</p>
            </div>
        </div>
    </footer>
    `;
    footerPlaceholder.outerHTML = footerHTML;
}

function injectWhatsApp() {
    if (document.getElementById('whatsapp-container')) return;

    const whatsappHTML = `
    <div id="whatsapp-container">
        <div class="whatsapp-popup">
            <p><i class="fab fa-whatsapp" style="color: #25D366; font-size: 1.2rem;"></i> Need Help? Talk to Bhaskar Sir!</p>
        </div>
        <a href="https://wa.me/919692792825?text=Hello%20Bhaskar%20Sir%2C%20I%27m%20interested%20in%20enrolling%20for%20the%20courses%20at%20IITian%20School.%20Please%20guide%20me." class="whatsapp-float" target="_blank">
            <i class="fab fa-whatsapp"></i>
        </a>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', whatsappHTML);
}

function initNavigationLogic() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.getElementById('navbar');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            
            // Toggle Icon
            const icon = menuBtn.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                    
                    // Stagger links animation
                    document.querySelectorAll('.nav-links a').forEach((link, i) => {
                        link.style.opacity = '0';
                        link.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            link.style.transition = '0.3s ease ' + (i * 0.05) + 's';
                            link.style.opacity = '1';
                            link.style.transform = 'translateY(0)';
                        }, 100);
                    });
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                    
                    document.querySelectorAll('.nav-links a').forEach(link => {
                        link.style.opacity = '';
                        link.style.transform = '';
                        link.style.transition = '';
                    });
                }
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}
