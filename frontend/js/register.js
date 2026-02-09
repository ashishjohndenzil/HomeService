// Validation functions - Declare outside DOMContentLoaded so they're available
function createSuggestionElement(field) {
    let suggestion = field.parentElement.querySelector('.validation-suggestion');
    if (!suggestion) {
        suggestion = document.createElement('small');
        suggestion.className = 'validation-suggestion';
        field.parentElement.appendChild(suggestion);
    }
    return suggestion;
}

function validateFullName(field) {
    const suggestion = createSuggestionElement(field);
    const fullName = field.value.trim();

    if (!fullName) {
        suggestion.textContent = 'Full name is required';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    if (fullName.length < 3) {
        suggestion.textContent = 'Name should be at least 3 characters long';
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    if (!/^[a-zA-Z\s'-]+$/.test(fullName)) {
        suggestion.textContent = 'Name should only contain letters, spaces, hyphens, and apostrophes';
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    suggestion.textContent = '✓ Name looks good';
    suggestion.className = 'validation-suggestion success-suggestion';
    field.style.borderColor = '#10b981';
    return true;
}

function validateEmail(field) {
    const suggestion = createSuggestionElement(field);
    const email = field.value.trim();

    if (!email) {
        suggestion.textContent = 'Email is required';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    // Regex validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        suggestion.textContent = 'Please enter a valid email format (e.g., user@example.com)';
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    // Debounced server-side check
    clearTimeout(field.checkEmailTimeout);
    field.checkEmailTimeout = setTimeout(() => {
        checkEmailServer(field, email);
    }, 500);

    // Tentative success until server responds
    suggestion.textContent = 'Checking availability...';
    suggestion.className = 'validation-suggestion info-suggestion';
    field.style.borderColor = '#3b82f6';
    return true;
}

function checkEmailServer(field, email) {
    const suggestion = createSuggestionElement(field);

    fetch(`../backend/api/check-email.php?email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                suggestion.textContent = '❌ Email already registered';
                suggestion.className = 'validation-suggestion error-suggestion';
                field.style.borderColor = '#ef4444';
                field.setCustomValidity('Email already exists');
            } else {
                suggestion.textContent = '✓ Email available';
                suggestion.className = 'validation-suggestion success-suggestion';
                field.style.borderColor = '#10b981';
                field.setCustomValidity('');
            }
        })
        .catch(err => {
            console.error('Error checking email:', err);
            // Default to valid if check fails to avoid blocking user unnecessarily
            suggestion.textContent = '✓ Email looks good (Offline check)';
            suggestion.className = 'validation-suggestion success-suggestion';
            field.style.borderColor = '#10b981';
            field.setCustomValidity('');
        });
}

function validatePhone(field) {
    const suggestion = createSuggestionElement(field);
    const phone = field.value.trim();

    // Remove any non-numeric characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    if (!phone) {
        suggestion.textContent = 'Phone number is required';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    if (/[^0-9]/.test(phone)) {
        suggestion.textContent = 'Please enter only numbers';
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    if (cleanPhone.length !== 10) {
        if (cleanPhone.length < 10) {
            suggestion.textContent = `Phone number must be exactly 10 digits (you have ${cleanPhone.length})`;
        } else {
            suggestion.textContent = `Phone number cannot exceed 10 digits (you have ${cleanPhone.length})`;
        }
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    suggestion.textContent = '✓ Phone number looks good';
    suggestion.className = 'validation-suggestion success-suggestion';
    field.style.borderColor = '#10b981';
    return true;
}

function validatePassword(field) {
    const suggestion = createSuggestionElement(field);
    const password = field.value;

    if (!password) {
        suggestion.textContent = 'Password is required';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    if (password.length < 6) {
        suggestion.textContent = 'Password must be at least 6 characters long';
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    if (password.length < 8) {
        suggestion.textContent = 'Consider using 8+ characters for better security';
        suggestion.className = 'validation-suggestion info-suggestion';
        field.style.borderColor = '#3b82f6';
        return true;
    }

    suggestion.textContent = '✓ Password is strong';
    suggestion.className = 'validation-suggestion success-suggestion';
    field.style.borderColor = '#10b981';
    return true;
}

function validateConfirmPassword(field) {
    const suggestion = createSuggestionElement(field);
    const confirmPassword = field.value;
    const password = document.getElementById('password').value;

    if (!confirmPassword) {
        suggestion.textContent = 'Please confirm your password';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    if (password && confirmPassword !== password) {
        suggestion.textContent = 'Passwords do not match';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    if (confirmPassword === password && password) {
        suggestion.textContent = '✓ Passwords match';
        suggestion.className = 'validation-suggestion success-suggestion';
        field.style.borderColor = '#10b981';
        return true;
    }

    suggestion.textContent = '';
    field.style.borderColor = '';
    return false;
}

function validateLocation(field) {
    const suggestion = createSuggestionElement(field);
    const location = field.value.trim();

    if (!location) {
        suggestion.textContent = 'Location is required';
        suggestion.className = 'validation-suggestion error-suggestion';
        field.style.borderColor = '#ef4444';
        return false;
    }

    if (location.length < 3) {
        suggestion.textContent = 'Please enter a clearer location (City, State/Area)';
        suggestion.className = 'validation-suggestion warning-suggestion';
        field.style.borderColor = '#f59e0b';
        return false;
    }

    suggestion.textContent = '✓ Location looks good';
    suggestion.className = 'validation-suggestion success-suggestion';
    field.style.borderColor = '#10b981';
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Setup inline validation for all form fields
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function () { validateFullName(this); });
        fullNameInput.addEventListener('blur', function () { validateFullName(this); });
    }

    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function () { validateEmail(this); });
        emailInput.addEventListener('blur', function () { validateEmail(this); });
    }

    const phoneFields = ['phone', 'initial_phone', 'googlePhone'];

    phoneFields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Strictly allow only numbers and max 10 digits
            input.addEventListener('input', function (e) {
                // Remove any non-numeric characters immediately
                this.value = this.value.replace(/\D/g, '');

                // Limit to 10 digits
                if (this.value.length > 10) {
                    this.value = this.value.slice(0, 10);
                }

                validatePhone(this);
            });
            input.addEventListener('blur', function () { validatePhone(this); });
        }
    });

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function () { validatePassword(this); });
        passwordInput.addEventListener('blur', function () { validatePassword(this); });
    }

    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function () { validateConfirmPassword(this); });
        confirmPasswordInput.addEventListener('blur', function () { validateConfirmPassword(this); });
    }

    const locationFields = ['location', 'initial_location'];
    locationFields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function () { validateLocation(this); });
            input.addEventListener('blur', function () { validateLocation(this); });
        }
    });

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Clear previous messages
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        // Get form values
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const location = document.getElementById('location').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Read userType from the visible dropdown (userTypeTop) instead of hidden field
        const userTypeTop = document.getElementById('userTypeTop');
        const userType = userTypeTop ? userTypeTop.value : document.getElementById('userType').value;

        const serviceIdElement = document.getElementById('serviceId');
        // Force fresh read of value
        const serviceId = (userType === 'provider' && serviceIdElement) ? serviceIdElement.value : null;
        const terms = document.getElementById('terms').checked;

        // Debug logging
        console.log('Form submission debug:');
        console.log('userType:', userType);
        console.log('serviceId value:', serviceId);
        console.log('serviceId element:', serviceIdElement);
        console.log('serviceId element value:', serviceIdElement ? serviceIdElement.value : 'null');

        // Validation
        if (!fullName || !email || !phone || !password || !confirmPassword || !userType) {
            showError('Please fill in all fields');
            return;
        }

        // Validate service selection for providers (check that it's not empty and not "")
        if (userType === 'provider' && (!serviceId || serviceId === '')) {
            showError('Please select a service category');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (!terms) {
            showError('Please accept the Terms of Service and Privacy Policy');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Phone validation (basic)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone) || phone.length < 10) {
            showError('Please enter a valid phone number');
            return;
        }

        if (!location) {
            showError('Please enter your location');
            return;
        }

        // Prepare data for API
        const formData = {
            fullName: fullName,
            email: email,
            phone: phone,
            location: location,
            password: password,
            userType: userType
        };

        // Add service ID for providers - Direct capture
        if (userType === 'provider') {
            const serviceIdEl = document.getElementById('serviceId');
            if (serviceIdEl) {
                formData.serviceId = serviceIdEl.value;
                console.log('Sending serviceId:', formData.serviceId);
            } else {
                console.error('CRITICAL: serviceId element not found during payload construction');
            }
        }

        try {
            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            // Send data to backend API
            const response = await fetch('../backend/api/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (data.success) {
                showSuccess('Registration successful! Redirecting...');
                registerForm.reset();

                // Store user data and token if provided
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    if (data.user && data.user.user_type === 'provider') {
                        window.location.href = 'provider-dashboard.html';
                    } else {
                        window.location.href = 'login.html';
                    }
                }, 1500);
            } else {
                showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred. Please try again later.');

            // Reset button state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Register';
            submitBtn.disabled = false;
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
    }
});
