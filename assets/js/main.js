// PEDY Academic Resource Hub JavaScript

// Get current date and display in footer
function updateFooterDate() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    // Add ordinal suffix to date
    const getOrdinalSuffix = (date) => {
        if (date > 3 && date < 21) return 'th';
        switch (date % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    
    const ordinalSuffix = getOrdinalSuffix(date);
    const formattedDate = `${dayName} ${date}${ordinalSuffix} ${monthName}`;
    
    // Update footer copyright with current date
    const footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom) {
        footerBottom.innerHTML = `&copy; ${year} PEDY. All rights reserved. | ${formattedDate}`;
    }
}

// Call the function when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateFooterDate();

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('nav a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query) {
            // Highlight search results (simple implementation)
            const allText = document.querySelectorAll('h1, h2, h3, h4, p, span');
            allText.forEach(element => {
                const text = element.textContent.toLowerCase();
                if (text.includes(query)) {
                    element.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                    setTimeout(() => {
                        element.style.backgroundColor = '';
                    }, 2000);
                }
            });
        }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Confetti animation function
    function createConfetti() {
        const colors = ['#6366f1', '#818cf8', '#4f46e5', '#6366f1', '#818cf8'];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `confetti ${Math.random() * 3 + 2}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    // Logo sparkle animation function
    function createLogoSparkles() {
        const logoContainer = document.querySelector('.logo-container');
        if (!logoContainer) return;
        
        const colors = ['#6366f1', '#818cf8', '#4f46e5', '#6366f1', '#818cf8'];
        const sparkleCount = 15;
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'fixed';
            sparkle.style.width = Math.random() * 8 + 4 + 'px';
            sparkle.style.height = sparkle.style.width;
            sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            sparkle.style.borderRadius = '50%';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '9998';
            
            // Position around the logo container
            const logoRect = logoContainer.getBoundingClientRect();
            const angle = (Math.PI * 2 * i) / sparkleCount;
            const radius = 80 + Math.random() * 40;
            const x = logoRect.left + logoRect.width / 2 + Math.cos(angle) * radius;
            const y = logoRect.top + logoRect.height / 2 + Math.sin(angle) * radius;
            
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            sparkle.style.opacity = '0';
            
            document.body.appendChild(sparkle);
            
            // Animate sparkle
            setTimeout(() => {
                sparkle.style.transition = 'all 1.5s ease-out';
                sparkle.style.opacity = '1';
                sparkle.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0)`;
            }, i * 100);
            
            setTimeout(() => {
                sparkle.remove();
            }, 2000);
        }
    }

    // Logo drop animation function
    function createLogoDrops() {
        const logoContainer = document.querySelector('.logo-container');
        if (!logoContainer) return;
        
        const colors = ['#6366f1', '#818cf8', '#4f46e5', '#6366f1', '#818cf8'];
        const dropCount = 8;
        
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.style.position = 'fixed';
            drop.style.width = Math.random() * 6 + 3 + 'px';
            drop.style.height = Math.random() * 12 + 8 + 'px';
            drop.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            drop.style.borderRadius = '50%';
            drop.style.pointerEvents = 'none';
            drop.style.zIndex = '9998';
            
            // Position around the logo container
            const logoRect = logoContainer.getBoundingClientRect();
            const x = logoRect.left + Math.random() * logoRect.width;
            const y = logoRect.top + logoRect.height;
            
            drop.style.left = x + 'px';
            drop.style.top = y + 'px';
            drop.style.opacity = '0';
            
            document.body.appendChild(drop);
            
            // Animate drop
            setTimeout(() => {
                drop.style.transition = 'all 2s ease-out';
                drop.style.opacity = '1';
                drop.style.transform = `translateY(${Math.random() * 200 + 100}px) scale(0)`;
            }, i * 150);
            
            setTimeout(() => {
                drop.remove();
            }, 2500);
        }
    }

    // Continuous logo animations
    function startLogoAnimations() {
        // Initial sparkle burst
        createLogoSparkles();
        
        // Continuous sparkle animations - every 2 seconds
        setInterval(() => {
            createLogoSparkles();
        }, 2000);
        
        // Continuous drop animations - every 3 seconds
        setInterval(() => {
            createLogoDrops();
        }, 3000);
    }

    // Start logo animations
    startLogoAnimations();

    // Explore Now button functionality
    window.exploreNow = function() {
        createConfetti();
        // Scroll to top for now since we removed other sections
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Newsletter subscription
    window.subscribeNewsletter = function(event) {
        event.preventDefault();
        const email = event.target.querySelector('input[type="email"]').value;
        
        if (email) {
            // Show success message
            const button = event.target.querySelector('button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
            button.style.background = '#10b981';
            
            createConfetti();
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                event.target.reset();
            }, 3000);
        }
    };

    // Add some fun micro-interactions
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Search input focus effect
    searchInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.05)';
    });

    searchInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });

    // Mobile menu toggle functionality
    window.toggleMobileMenu = function() {
        const nav = document.querySelector('.nav');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        nav.classList.toggle('active');
        toggle.classList.toggle('active');
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
    };

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const nav = document.querySelector('.nav');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        if (!nav.contains(event.target) && !toggle.contains(event.target)) {
            nav.classList.remove('active');
            toggle.classList.remove('active');
        }
    });

    console.log('PEDY Academic Resource Hub loaded successfully! 🎓');
});