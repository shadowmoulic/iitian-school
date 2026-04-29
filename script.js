document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const authModal = document.getElementById('auth-modal');
    const checkoutModal = document.getElementById('checkout-modal');

    // UI Helpers
    const openModal = (modal) => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            const isActive = navLinks.classList.contains('active');

            if (isActive) {
                icon.setAttribute('data-lucide', 'x');
                // Stagger links
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
                icon.setAttribute('data-lucide', 'menu');
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.style.opacity = '';
                    link.style.transform = '';
                    link.style.transition = '';
                });
            }
            lucide.createIcons();
        });
    }

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn?.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Auth Tabs Logic
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${target}-form`).classList.add('active');
        });
    });

    // Open Auth Modal from Nav
    document.querySelector('.btn-primary[href="#"]').addEventListener('click', (e) => {
        e.preventDefault();
        openModal(authModal);
    });

    // Enrollment & Checkout Logic
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const courseCard = btn.closest('.course-card');
            const courseTitle = courseCard.querySelector('h3').innerText;
            const currentPrice = courseCard.querySelector('.current-price').innerText;
            const oldPrice = courseCard.querySelector('.old-price').innerText;

            document.getElementById('selected-course-title').innerText = `Selected: ${courseTitle}`;
            document.getElementById('checkout-price').innerText = currentPrice;
            document.getElementById('checkout-old-price').innerText = oldPrice;

            openModal(checkoutModal);
        });
    });

    // Payment Simulation
    const processBtn = document.getElementById('process-payment');
    const paymentStatus = document.getElementById('payment-status');
    const statusContent = paymentStatus.querySelector('.status-content');
    const successContent = paymentStatus.querySelector('.success-content');

    processBtn.addEventListener('click', () => {
        paymentStatus.classList.add('active');

        // Simulating 3 seconds of "processing"
        setTimeout(() => {
            statusContent.style.display = 'none';
            successContent.style.display = 'block';
        }, 3000);
    });

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(authModal);
            closeModal(checkoutModal);
            // Reset checkout state if needed
            paymentStatus.classList.remove('active');
            statusContent.style.display = 'flex';
            successContent.style.display = 'none';
        });
    });

    document.querySelector('.close-checkout-btn')?.addEventListener('click', () => {
        closeModal(checkoutModal);
        paymentStatus.classList.remove('active');
        statusContent.style.display = 'flex';
        successContent.style.display = 'none';
    });

    // Animate elements on scroll using Intersection Observer
    const animateOnScroll = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;

                    // Check if it's a grid container and stagger children
                    if (target.hasAttribute('data-stagger-parent')) {
                        const children = target.querySelectorAll('[data-stagger]');
                        children.forEach((child, index) => {
                            setTimeout(() => {
                                child.classList.add('animate-in');
                            }, index * 100);
                        });
                    } else if (!target.hasAttribute('data-stagger')) {
                        target.classList.add('animate-in');
                    }

                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.1 });

        // Observe parents with staggered children
        document.querySelectorAll('[data-stagger-parent]').forEach(el => observer.observe(el));

        // Observe individual animatable elements
        document.querySelectorAll('section, .feature-card, .app-section').forEach(el => {
            if (!el.closest('[data-stagger-parent]')) {
                observer.observe(el);
            }
        });
    };

    animateOnScroll();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
