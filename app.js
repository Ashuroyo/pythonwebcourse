// DOM Elements
const navbar = document.getElementById('navbar');
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');

// Global state
let selectedPlan = '';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize all functionality
function initializeApp() {
    setupNavbarScroll();
    setupFormHandling();
    setupFAQToggle();
    setupScrollAnimations();
    setupSmoothScroll();
    setupPlanSelection();
    setupAnalytics();
}

// Navbar scroll effect
function setupNavbarScroll() {
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            navbar.style.background = 'rgba(252, 252, 249, 0.98)';
            navbar.style.boxShadow = 'var(--shadow-md)';
        } else {
            navbar.style.background = 'rgba(252, 252, 249, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        // Hide/show navbar on scroll
        if (scrollY > lastScrollY && scrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = scrollY;
    });
}

// Smooth scroll functionality
function setupSmoothScroll() {
    // Handle navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Handle CTA buttons
    document.querySelectorAll('.btn--primary').forEach(button => {
        if (button.textContent.includes('Join') || button.textContent.includes('Cohort')) {
            button.addEventListener('click', () => {
                scrollToSection('pricing');
            });
        }
    });
}

// Scroll to section function (called from buttons)
function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Form handling and validation
function setupFormHandling() {
    contactForm.addEventListener('submit', handleFormSubmission);
    
    // Real-time validation
    const inputs = contactForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Handle form submission (Updated for Cloudflare Worker)
async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;  // Prevent double-submit
    submitButton.classList.add('loading');
    
    try {
        // Prepare and send form data to Cloudflare Worker
        const formData = new FormData(contactForm);
        
        const response = await fetch('https://contact-form-handler.shamuonhennawi05.workers.dev', { 
            method: 'POST',
            body: formData,
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showSuccessModal();
            resetForm();
            
            // Track successful submission
            const formValues = Object.fromEntries(formData.entries());
            trackEvent('contact_form_submitted', {
                plan: selectedPlan,
                interest_level: formValues.interest,
                has_phone: !!formValues.phone,
                success: true
            });
        } else {
            // Handle Worker-specific errors
            throw new Error(result.error || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showFormError('Something went wrong. Please try again or email us directly at <a href="mailto:hello@pythonwebcourse.com">hello@pythonwebcourse.com</a>.');
        
        // Track error
        trackEvent('contact_form_error', {
            plan: selectedPlan,
            error: error.message
        });
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
    }
}

// Form validation
function validateForm() {
    let isValid = true;
    const requiredFields = contactForm.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    // Email validation
    const emailField = contactForm.querySelector('input[type="email"]');
    if (emailField && emailField.value && !isValidEmail(emailField.value)) {
        showFieldError(emailField, 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

// Validate individual field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Clear previous errors
    clearFieldError({ target: field });
    
    // Required field validation
    if (field.required && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.color = 'var(--color-error)';
    errorElement.style.fontSize = 'var(--font-size-sm)';
    errorElement.style.marginTop = 'var(--space-4)';
    errorElement.innerHTML = message;  // Use innerHTML for link support if needed
    field.parentNode.appendChild(errorElement);
}

// Clear field error
function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Show form-level error
function showFormError(message) {
    // Remove existing error
    const existingError = contactForm.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.style.color = 'var(--color-error)';
    errorElement.style.padding = 'var(--space-12)';
    errorElement.style.marginBottom = 'var(--space-16)';
    errorElement.style.backgroundColor = 'rgba(var(--color-error-rgb), 0.1)';
    errorElement.style.border = '1px solid var(--color-error)';
    errorElement.style.borderRadius = 'var(--radius-base)';
    errorElement.innerHTML = message;  // Use innerHTML for clickable mailto link
    contactForm.insertBefore(errorElement, contactForm.firstChild);
}

// Reset form
function resetForm() {
    contactForm.reset();
    selectedPlan = '';
    
    // Clear all errors
    const errorElements = contactForm.querySelectorAll('.field-error, .form-error');
    errorElements.forEach(error => error.remove());
    
    const fields = contactForm.querySelectorAll('input, select, textarea');
    fields.forEach(field => field.classList.remove('error', 'success'));
}

function setupFAQToggle() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', e => {
      e.preventDefault();
      toggleFAQ(q);
    });
  });
}

function toggleFAQ(questionEl) {
  const item = questionEl.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const isOpen = item.classList.contains('active');

  // Close all items
  document.querySelectorAll('.faq-item.active').forEach(openItem => {
    openItem.classList.remove('active');
    const ans = openItem.querySelector('.faq-answer');
    ans.style.maxHeight = '0';
    ans.style.padding = '0 var(--space-16)';
  });

  if (!isOpen) {
    // Open this one
    item.classList.add('active');
    // Force reflow
    answer.style.display = 'block';
    const h = answer.scrollHeight;
    answer.style.maxHeight = h + 'px';
    answer.style.padding = '0 var(--space-16) var(--space-16)';
  }
}

// Plan selection functionality
function setupPlanSelection() {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        const button = card.querySelector('.btn');
        if (button) {
            button.addEventListener('click', () => {
                const planTitle = card.querySelector('h3').textContent;
                selectedPlan = planTitle;
                
                // Track plan selection
                trackEvent('plan_selected', { plan: planTitle });
            });
        }
    });
}

// Open contact form with pre-selected plan
function openContactForm(planName) {
    selectedPlan = planName;
    
    // Pre-fill interest level
    const interestSelect = contactForm.querySelector('#interest');
    if (interestSelect) {
        interestSelect.value = 'ready';
    }
    
    // Pre-fill message
    const messageField = contactForm.querySelector('#message');
    if (messageField && planName) {
        messageField.value = `I'm interested in the ${planName} plan. Please send me more information about the next cohort.`;
    }
    
    // Scroll to contact form
    scrollToSection('contact');
    
    // Focus on first field after scroll
    setTimeout(() => {
        const firstField = contactForm.querySelector('input');
        if (firstField) {
            firstField.focus();
        }
    }, 800);
    
    // Track contact form opening
    trackEvent('contact_form_opened', { 
        plan: planName,
        source: 'pricing_button'
    });
}

// Modal functionality
function showSuccessModal() {
    successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Add click handler for backdrop
    setTimeout(() => {
        successModal.addEventListener('click', handleModalBackdropClick);
    }, 100);
    
    // Track success modal display
    trackEvent('form_success_modal_shown', { plan: selectedPlan });
}

function closeModal() {
    successModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    successModal.removeEventListener('click', handleModalBackdropClick);
    
    trackEvent('form_success_modal_closed');
}

function handleModalBackdropClick(e) {
    if (e.target === successModal) {
        closeModal();
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
        closeModal();
    }
});

// Scroll animations
function setupScrollAnimations() {
    // Only run if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        return;
    }
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Track section visibility
                const sectionId = entry.target.id || entry.target.closest('section')?.id;
                if (sectionId) {
                    trackEvent('section_viewed', { section: sectionId });
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.week-card, .pricing-card, .testimonial-card, .problem-card, .feature');
    animateElements.forEach(el => {
        if (el) {
            observer.observe(el);
        }
    });
    
    // Observe sections for tracking
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        if (section.id) {
            observer.observe(section);
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize
window.addEventListener('resize', debounce(() => {
    // Recalculate FAQ answer heights if any are open
    const activeFAQs = document.querySelectorAll('.faq-item.active .faq-answer');
    activeFAQs.forEach(answer => {
        answer.style.maxHeight = answer.scrollHeight + 'px';
    });
}, 250));

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        trackEvent('page_hidden');
    } else {
        trackEvent('page_visible');
    }
});

// Performance optimization: Lazy load images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Analytics tracking
function trackEvent(eventName, properties = {}) {
    // In a real application, integrate with analytics service like Google Analytics, Mixpanel, etc.
    const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        ...properties
    };
    
    console.log('Analytics Event:', eventData);
    
    // Example: Send to analytics service
    // gtag('event', eventName, properties);
    // mixpanel.track(eventName, properties);
}

// Track form interactions and user behavior
function setupAnalytics() {
    // Track page load
    trackEvent('page_loaded', {
        page_title: document.title,
        referrer: document.referrer
    });
    
    // Track pricing card interactions
    document.querySelectorAll('.pricing-card').forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            const planName = card.querySelector('h3').textContent;
            trackEvent('pricing_card_hover', { 
                plan: planName, 
                position: index + 1 
            });
        });
    });
    
    // Track CTA button clicks
    document.querySelectorAll('.cta-primary, .btn--primary').forEach(button => {
        button.addEventListener('click', () => {
            const buttonText = button.textContent.trim();
            const section = button.closest('section')?.id || 'unknown';
            trackEvent('cta_clicked', { 
                button_text: buttonText, 
                section: section 
            });
        });
    });
    
    // Track form field interactions
    const formFields = contactForm.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        let startTime;
        
        field.addEventListener('focus', () => {
            startTime = Date.now();
            trackEvent('form_field_focused', { 
                field_name: field.name || field.id,
                field_type: field.type || field.tagName.toLowerCase()
            });
        });
        
        field.addEventListener('blur', () => {
            if (startTime) {
                const timeSpent = Date.now() - startTime;
                trackEvent('form_field_completed', {
                    field_name: field.name || field.id,
                    time_spent_ms: timeSpent,
                    has_value: !!field.value
                });
            }
        });
    });
    
    // Track scroll depth
    let maxScrollDepth = 0;
    let scrollDepthMarkers = [25, 50, 75, 90, 100];
    let trackedMarkers = new Set();
    
    window.addEventListener('scroll', debounce(() => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        
        if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;
        }
        
        scrollDepthMarkers.forEach(marker => {
            if (scrollPercent >= marker && !trackedMarkers.has(marker)) {
                trackedMarkers.add(marker);
                trackEvent('scroll_depth', { depth_percent: marker });
            }
        });
    }, 500));
    
    // Track time spent on page
    let timeOnPageStart = Date.now();
    let timeOnPageInterval = setInterval(() => {
        if (!document.hidden) {
            const timeSpent = Math.floor((Date.now() - timeOnPageStart) / 1000);
            if (timeSpent > 0 && timeSpent % 30 === 0) { // Every 30 seconds
                trackEvent('time_on_page', { 
                    seconds: timeSpent,
                    max_scroll_depth: maxScrollDepth
                });
            }
        }
    }, 1000);
    
    // Track page exit
    window.addEventListener('beforeunload', () => {
        const timeSpent = Math.floor((Date.now() - timeOnPageStart) / 1000);
        trackEvent('page_exit', {
            time_spent_seconds: timeSpent,
            max_scroll_depth: maxScrollDepth,
            form_started: contactForm.querySelector('input').value !== '',
            plan_selected: selectedPlan
        });
        clearInterval(timeOnPageInterval);
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    trackEvent('javascript_error', {
        error_message: e.message,
        error_filename: e.filename,
        error_lineno: e.lineno,
        error_stack: e.error?.stack
    });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    trackEvent('promise_rejection', {
        reason: e.reason?.toString()
    });
});

// Mobile-specific enhancements
function setupMobileEnhancements() {
    // Detect mobile device
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Optimize form for mobile
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // Prevent zoom on input focus for iOS
            if (input.type === 'email' || input.type === 'tel') {
                input.addEventListener('focus', () => {
                    input.style.fontSize = '16px';
                });
            }
        });
        
        // Track mobile usage
        trackEvent('mobile_user_detected', {
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height
        });
    }
}

function openTermsModal() {
    document.getElementById('termsModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeTermsModal() {
    document.getElementById('termsModal').classList.add('hidden');
    document.body.style.overflow = '';
}


// Initialize mobile enhancements
setupMobileEnhancements();

// Export functions for global access (if needed)
window.scrollToSection = scrollToSection;
window.openContactForm = openContactForm;
window.toggleFAQ = toggleFAQ;
window.closeModal = closeModal;

