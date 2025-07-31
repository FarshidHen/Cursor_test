// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('.header');
const contactForm = document.getElementById('contactForm');
const statNumbers = document.querySelectorAll('.stat-number');

// Mobile Navigation Toggle
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    }
});

// Smooth scrolling function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = header.offsetHeight;
        const sectionTop = section.offsetTop - headerHeight;
        
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// Add smooth scrolling to navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});

// Counter animation for statistics
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const counter = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(counter);
        } else {
            element.textContent = Math.ceil(start);
        }
    }, 16);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            
            // Animate counters when stats section is visible
            if (entry.target.classList.contains('about-stats')) {
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    animateCounter(stat, target);
                });
            }
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.section-header, .about-text, .about-stats, .contact-info, .contact-form');
    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
});

// Contact form handling
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });
    
    // Validate form
    if (validateForm(formObject)) {
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
        submitBtn.disabled = true;
        
        try {
            // Send to backend API
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification(result.message || 'پیام شما با موفقیت ارسال شد!', 'success');
                contactForm.reset();
            } else {
                if (result.errors && result.errors.length > 0) {
                    const errorMessages = result.errors.map(error => error.message).join('<br>');
                    showNotification(errorMessages, 'error');
                } else {
                    showNotification(result.message || 'خطا در ارسال پیام', 'error');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showNotification('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
});

// Form validation
function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('ایمیل معتبر وارد کنید');
    }
    
    if (!data.service) {
        errors.push('نوع خدمات را انتخاب کنید');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('پیام باید حداقل ۱۰ کاراکتر باشد');
    }
    
    if (errors.length > 0) {
        showNotification(errors.join('<br>'), 'error');
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <div class="notification-message">${message}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
        min-width: 300px;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    `;
    
    notification.querySelector('.notification-message').style.cssText = `
        flex: 1;
        line-height: 1.5;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        font-size: 1rem;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    `;
    
    notification.querySelector('.notification-close').addEventListener('mouseover', function() {
        this.style.opacity = '1';
    });
    
    notification.querySelector('.notification-close').addEventListener('mouseout', function() {
        this.style.opacity = '0.7';
    });
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Parallax effect for floating card
window.addEventListener('scroll', () => {
    const floatingCard = document.querySelector('.floating-card');
    if (floatingCard) {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.1;
        floatingCard.style.transform = `translateY(${parallax}px)`;
    }
});

// Add hover effects to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px) scale(1.02)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add click ripple effect to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Animate intro elements
    setTimeout(() => {
        const introTitle = document.querySelector('.intro-title');
        const introDescription = document.querySelector('.intro-description');
        const introButtons = document.querySelector('.intro-buttons');
        const floatingCard = document.querySelector('.floating-card');
        
        if (introTitle) introTitle.classList.add('slide-in-left');
        if (introDescription) {
            setTimeout(() => introDescription.classList.add('fade-in'), 200);
        }
        if (introButtons) {
            setTimeout(() => introButtons.classList.add('fade-in'), 400);
        }
        if (floatingCard) {
            setTimeout(() => floatingCard.classList.add('slide-in-right'), 300);
        }
    }, 100);
});

// Scroll to top functionality
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transform: translateY(100px);
    transition: all 0.3s ease;
    z-index: 1000;
`;

document.body.appendChild(scrollToTopBtn);

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.style.transform = 'translateY(0)';
    } else {
        scrollToTopBtn.style.transform = 'translateY(100px)';
    }
});

// Add hover effect to scroll to top button
scrollToTopBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(0) scale(1.1)';
});

scrollToTopBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
});

// Enhanced typing effect for intro title
function typeWriter(element, text, speed = 100) {
    element.innerHTML = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Language System
const translations = {
    fa: {
        'nav-home': 'خانه',
        'nav-about': 'درباره ما',
        'nav-contact': 'تماس با ما',
        'company-name': 'شاپیفای استودیو',
        'company-description': 'توسعه‌دهنده حرفه‌ای برنامه‌های شاپیفای',
        'useful-links': 'لینک‌های مفید',
        'admin-panel': 'پنل مدیریت',
        'quick-contact': 'تماس سریع',
        'copyright': '© ۲۰۲۴ شاپیفای استودیو. تمامی حقوق محفوظ است.',
        'intro-title-1': 'توسعه‌دهنده حرفه‌ای',
        'intro-title-2': 'برنامه‌های شاپیفای',
        'intro-description': 'ما تیمی از توسعه‌دهندگان مجرب هستیم که برنامه‌های قدرتمند و نوآورانه برای پلتفرم شاپیفای می‌سازیم. با استفاده از جدیدترین تکنولوژی‌ها، کسب‌وکار شما را به سطح بعدی می‌بریم.',
        'start-project': 'شروع پروژه',
        'about-us-btn': 'درباره ما',
        'shopify-apps': 'برنامه‌های شاپیفای',
        'creative-solutions': 'راه‌حل‌های خلاقانه برای فروشگاه‌های آنلاین',
        'about-us-title': 'درباره ما',
        'about-us-subtitle': 'تیمی حرفه‌ای با تجربه گسترده در توسعه برنامه‌های شاپیفای',
        'why-choose-us': 'چرا ما را انتخاب کنید؟',
        'about-description': 'شاپیفای استودیو با بیش از ۵ سال تجربه در زمینه توسعه برنامه‌های شاپیفای، بیش از ۱۰۰ پروژه موفق را تحویل داده است. ما با درک عمیق از نیازهای کسب‌وکارهای آنلاین، راه‌حل‌هایی ارائه می‌دهیم که فروش شما را افزایش می‌دهد.',
        'feature-1': 'طراحی UI/UX حرفه‌ای',
        'feature-2': 'توسعه با جدیدترین تکنولوژی‌ها',
        'feature-3': 'پشتیبانی ۲۴/۷',
        'feature-4': 'تحویل در موعد مقرر',
        'stat-projects': 'پروژه موفق',
        'stat-clients': 'مشتری راضی',
        'stat-experience': 'سال تجربه',
        'stat-support': 'ساعت پشتیبانی',
        'contact-title': 'تماس با ما',
        'contact-subtitle': 'آماده همکاری با شما هستیم',
        'contact-info': 'اطلاعات تماس',
        'address-label': 'آدرس',
        'address-value': 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
        'phone-label': 'تلفن',
        'phone-value': '021-12345678',
        'email-label': 'ایمیل',
        'email-value': 'info@shopifystudio.ir',
        'form-name': 'نام و نام خانوادگی',
        'form-email': 'ایمیل',
        'form-phone': 'شماره تماس',
        'form-message': 'پیام شما',
        'select-service': 'نوع خدمات مورد نظر',
        'service-app': 'توسعه برنامه شاپیفای',
        'service-theme': 'سفارشی‌سازی قالب',
        'service-store': 'راه‌اندازی فروشگاه',
        'service-consultation': 'مشاوره',
        'send-message': 'ارسال پیام',
        'page-title': 'شاپیفای استودیو - توسعه‌دهنده برنامه‌های شاپیفای'
    },
    en: {
        'nav-home': 'Home',
        'nav-about': 'About Us',
        'nav-contact': 'Contact',
        'company-name': 'Shopify Studio',
        'company-description': 'Professional Shopify App Developer',
        'useful-links': 'Useful Links',
        'admin-panel': 'Admin Panel',
        'quick-contact': 'Quick Contact',
        'copyright': '© 2024 Shopify Studio. All rights reserved.',
        'intro-title-1': 'Professional',
        'intro-title-2': 'Shopify Apps Developer',
        'intro-description': 'We are a team of experienced developers who create powerful and innovative applications for the Shopify platform. Using the latest technologies, we take your business to the next level.',
        'start-project': 'Start Project',
        'about-us-btn': 'About Us',
        'shopify-apps': 'Shopify Apps',
        'creative-solutions': 'Creative solutions for online stores',
        'about-us-title': 'About Us',
        'about-us-subtitle': 'Professional team with extensive experience in Shopify app development',
        'why-choose-us': 'Why Choose Us?',
        'about-description': 'Shopify Studio with over 5 years of experience in Shopify app development has delivered more than 100 successful projects. With deep understanding of online business needs, we provide solutions that boost your sales.',
        'feature-1': 'Professional UI/UX Design',
        'feature-2': 'Development with Latest Technologies',
        'feature-3': '24/7 Support',
        'feature-4': 'On-time Delivery',
        'stat-projects': 'Successful Projects',
        'stat-clients': 'Happy Clients',
        'stat-experience': 'Years Experience',
        'stat-support': 'Hours Support',
        'contact-title': 'Contact Us',
        'contact-subtitle': 'Ready to collaborate with you',
        'contact-info': 'Contact Information',
        'address-label': 'Address',
        'address-value': 'Tehran, Valiasr Street, No. 123',
        'phone-label': 'Phone',
        'phone-value': '021-12345678',
        'email-label': 'Email',
        'email-value': 'info@shopifystudio.ir',
        'form-name': 'Full Name',
        'form-email': 'Email',
        'form-phone': 'Phone Number',
        'form-message': 'Your Message',
        'select-service': 'Select Service Type',
        'service-app': 'Shopify App Development',
        'service-theme': 'Theme Customization',
        'service-store': 'Store Setup',
        'service-consultation': 'Consultation',
        'send-message': 'Send Message',
        'page-title': 'Shopify Studio - Professional Shopify App Developer'
    }
};

let currentLanguage = localStorage.getItem('language') || 'fa';

function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.body.className = lang === 'fa' ? 'rtl' : 'ltr';
    
    // Update page title
    if (translations[lang] && translations[lang]['page-title']) {
        document.title = translations[lang]['page-title'];
    }
    
    // Update all translatable elements
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
}

// Font Awesome Detection & Fallback
function detectFontAwesome() {
    // Create a test element to check if Font Awesome is loaded
    const testElement = document.createElement('i');
    testElement.className = 'fas fa-home';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement, '::before');
    const fontFamily = computedStyle.getPropertyValue('font-family');
    
    // If Font Awesome is not loaded, add fallback class
    if (!fontFamily.includes('Font Awesome')) {
        document.body.classList.add('icon-fallback');
        console.log('Font Awesome not detected, using emoji fallbacks');
    } else {
        console.log('Font Awesome loaded successfully');
    }
    
    document.body.removeChild(testElement);
}

// Language button event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });
    
    // Initialize language
    switchLanguage(currentLanguage);
    
    // Force language switch to ensure all elements are updated
    setTimeout(() => {
        switchLanguage(currentLanguage);
    }, 100);
    
    // Detect Font Awesome and apply fallbacks if needed
    setTimeout(detectFontAwesome, 1000);
    
    // Load social media links
    loadSocialMediaLinks();
});

// Social Media Loading
async function loadSocialMediaLinks() {
    try {
        const response = await fetch('/api/contact/social-media');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const socialContainer = document.getElementById('socialLinksFooter');
            socialContainer.innerHTML = '';
            
            result.data.forEach(social => {
                const link = document.createElement('a');
                link.href = social.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = social.platform;
                
                // Set appropriate icon image
                const iconSrc = `/icons/${social.platform}.svg`;
                
                link.innerHTML = `<img src="${iconSrc}" alt="${social.platform}" loading="lazy">`;
                socialContainer.appendChild(link);
            });
        }
    } catch (error) {
        console.error('Error loading social media links:', error);
    }
}

// Initialize typing effect on load
document.addEventListener('DOMContentLoaded', () => {
    const introTitle = document.querySelector('.intro-title');
    if (introTitle) {
        const originalText = introTitle.textContent;
        setTimeout(() => {
            typeWriter(introTitle, originalText, 50);
        }, 500);
    }
});