// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-visible');
        }
    });
}, observerOptions);

// Observe all feature sections and service cards
document.addEventListener('DOMContentLoaded', () => {
    const elementsToObserve = document.querySelectorAll('.feature, .service-card, .team-member');
    elementsToObserve.forEach(el => observer.observe(el));
});

// Parallax effect for hero section
let ticking = false;

function updateParallax() {
    const scrolled = window.pageYOffset;
    const heroGrid = document.querySelector('.hero-grid');
    
    if (heroGrid) {
        heroGrid.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
    }
});

// Add hover effect to grid items
document.querySelectorAll('.grid-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)';
    });
});

// Optional: Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
