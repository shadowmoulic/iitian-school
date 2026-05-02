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
    document.querySelector('.btn-primary[href="#"]')?.addEventListener('click', (e) => {
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

    processBtn?.addEventListener('click', () => {
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
        }, { threshold: 0 });

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

    // One-by-one card slider logic
    function initSlider(trackSelector, containerSelector) {
        const track = document.querySelector(trackSelector);
        const container = document.querySelector(containerSelector);
        if (!track || !container) return;

        const prevBtn = container.querySelector('.slider-btn.prev');
        const nextBtn = container.querySelector('.slider-btn.next');

        let slides = Array.from(track.children);
        const originalCount = slides.length;

        // Clone slides once to the end to allow seamless forward sliding
        slides.forEach((s) => track.appendChild(s.cloneNode(true)));

        let index = 0; 
        let slideWidth = 0;
        let gap = parseFloat(getComputedStyle(track).gap) || 30;
        let isTransitioning = false;

        function computeSizes() {
            const card = track.querySelector('.slider-card');
            if (!card) return;
            gap = parseFloat(getComputedStyle(track).gap) || 30;
            slideWidth = card.getBoundingClientRect().width + gap;
            setTranslate(-index * slideWidth, false);
        }

        function setTranslate(px, withTransition = true) {
            track.style.transition = withTransition ? 'transform 0.4s ease' : 'none';
            track.style.transform = `translateX(${px}px)`;
        }

        function next() {
            if (isTransitioning) return;
            isTransitioning = true;
            index += 1;
            setTranslate(-index * slideWidth, true);
        }

        function prev() {
            if (isTransitioning) return;
            isTransitioning = true;
            index -= 1;
            setTranslate(-index * slideWidth, true);
        }

        track.addEventListener('transitionend', () => {
            isTransitioning = false;
            if (index >= originalCount) {
                index = 0;
                setTranslate(0, false);
            } else if (index < 0) {
                index = originalCount - 1;
                setTranslate(-index * slideWidth, false);
            }
        });

        nextBtn?.addEventListener('click', (e) => { e.preventDefault(); next(); });
        prevBtn?.addEventListener('click', (e) => { e.preventDefault(); prev(); });

        let autoPlayInterval = setInterval(next, 3000);

        container.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        container.addEventListener('mouseleave', () => autoPlayInterval = setInterval(next, 3000));

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => computeSizes(), 120);
        });

        computeSizes();
    }

    initSlider('.slider-track', '.slider-container');
});
