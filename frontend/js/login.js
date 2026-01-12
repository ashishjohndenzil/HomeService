document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Setup inline validation for email field
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function () {
            validateEmailField(this);
        });
        emailInput.addEventListener('blur', function () {
            validateEmailField(this);
        });
    }

    // Setup inline validation for password field
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            validatePasswordField(this);
        });
        passwordInput.addEventListener('blur', function () {
            validatePasswordField(this);
        });
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Clear previous messages
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        // Validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Prepare data for API
        const formData = {
            email: email,
            password: password,
            remember: remember
        };

        try {
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            // Send data to backend API
            const response = await fetch('../backend/api/login.php', {
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
                showSuccess('Login successful! Redirecting...');

                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);

                // Redirect based on user type
                setTimeout(() => {
                    if (data.user.user_type === 'provider') {
                        window.location.href = 'provider-dashboard.html';
                    } else if (data.user.user_type === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'customer-dashboard.html';
                    }
                }, 1500);
            } else {
                showError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred. Please try again later.');

            // Reset button state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Login';
            submitBtn.disabled = false;
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function validateEmailField(field) {
        let suggestion = field.parentElement.querySelector('.validation-suggestion');

        if (!suggestion) {
            suggestion = document.createElement('small');
            suggestion.className = 'validation-suggestion';
            field.parentElement.appendChild(suggestion);
        }

        const email = field.value.trim();

        if (!email) {
            suggestion.textContent = 'Email is required';
            suggestion.className = 'validation-suggestion error-suggestion';
            field.style.borderColor = '#ef4444';
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            suggestion.textContent = 'Please enter a valid email format (e.g., user@example.com)';
            suggestion.className = 'validation-suggestion warning-suggestion';
            field.style.borderColor = '#f59e0b';
            return false;
        }

        suggestion.textContent = '✓ Email looks good';
        suggestion.className = 'validation-suggestion success-suggestion';
        field.style.borderColor = '#10b981';
        return true;
    }

    function validatePasswordField(field) {
        let suggestion = field.parentElement.querySelector('.validation-suggestion');

        if (!suggestion) {
            suggestion = document.createElement('small');
            suggestion.className = 'validation-suggestion';
            field.parentElement.appendChild(suggestion);
        }

        const password = field.value;

        if (!password) {
            suggestion.textContent = 'Password is required';
            suggestion.className = 'validation-suggestion error-suggestion';
            field.style.borderColor = '#ef4444';
            return false;
        }

        suggestion.textContent = '✓ Password entered';
        suggestion.className = 'validation-suggestion success-suggestion';
        field.style.borderColor = '#10b981';
        return true;
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        if (userData.user_type === 'provider') {
            window.location.href = 'provider-dashboard.html';
        } else if (userData.user_type === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'customer-dashboard.html';
        }
    }
});

// Google Sign-In Handler
function handleGoogleLogin(response) {
    const credential = response.credential;
    console.log('Google login credential received');

    // Decode JWT token to get user info
    const userInfo = parseJwt(credential);
    console.log('Decoded user info:', userInfo);

    if (!userInfo) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Failed to decode Google credentials';
        errorMessage.classList.add('show');
        return;
    }

    console.log('Sending to backend...');

    // Send to backend for verification and account creation/login
    fetch('../backend/api/google-login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            credential: credential,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
        })
    })
        .then(res => {
            console.log('Backend response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('Backend response:', data);

            if (data.success) {
                console.log('Storing user data...');
                // Store user data
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);

                console.log('Redirecting to dashboard...');
                // Redirect to dashboard
                setTimeout(() => {
                    if (data.user.user_type === 'provider') {
                        window.location.href = 'provider-dashboard.html';
                    } else if (data.user.user_type === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'customer-dashboard.html';
                    }
                }, 500);
            } else {
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = data.error || data.message || 'Google Sign-In failed. Please try again.';
                errorMessage.classList.add('show');
            }
        })
        .catch(error => {
            console.error('Google login error:', error);
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'An error occurred during Google Sign-In. Check browser console for details.';
            errorMessage.classList.add('show');
        });
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}
