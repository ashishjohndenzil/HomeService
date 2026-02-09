/**
 * Main JavaScript for HomeService Application
 * Handles global navigation, authentication state, and search functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeSearch();
});

// --- Authentication & Navigation ---

function initializeNavigation() {
    const user = localStorage.getItem('user');
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');

    // If elements don't exist (e.g. on pages without nav), skip
    if (!authLinks || !userLinks) return;

    if (user) {
        try {
            const userData = JSON.parse(user);
            authLinks.style.display = 'none';
            userLinks.style.display = 'flex';

            const greeting = document.getElementById('userGreeting');
            if (greeting) {
                greeting.textContent = `Welcome, ${userData.full_name}!`;
            }

            const dashboardLink = document.getElementById('dashboardLink');
            if (dashboardLink) {
                const currentPage = window.location.pathname.split('/').pop();
                if (currentPage.includes('dashboard')) {
                    dashboardLink.style.display = 'none';
                } else {
                    dashboardLink.style.display = 'inline-flex'; // Ensure it's visible otherwise
                    if (userData.user_type === 'provider') {
                        dashboardLink.href = 'provider-dashboard.html';
                    } else if (userData.user_type === 'admin') { // Handle admin case too
                        dashboardLink.href = 'admin-dashboard.html';
                    } else {
                        dashboardLink.href = 'customer-dashboard.html';
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
            // Fallback to logged out state
            authLinks.style.display = 'flex';
            userLinks.style.display = 'none';
        }
    } else {
        // User is logged out: show auth links, hide user links
        authLinks.style.display = 'flex';
        userLinks.style.display = 'none';

        // Hide redundant buttons based on current page
        const currentPage = window.location.pathname.split('/').pop();
        const loginBtn = authLinks.querySelector('a[href="login.html"]');
        const registerBtn = authLinks.querySelector('a[href="register.html"]');

        if (loginBtn && (currentPage === 'login.html' || currentPage === 'login')) {
            loginBtn.style.display = 'none';
        }
        if (registerBtn && (currentPage === 'register.html' || currentPage === 'register')) {
            registerBtn.style.display = 'none';
        }
    }
}

function handleLogout(event) {
    if (event) event.preventDefault();

    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Redirect to home if on a protected page, otherwise reload
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = 'index.html';
        } else {
            window.location.reload();
        }
    }
}

// Make handleLogout globally available for onclick events
window.handleLogout = handleLogout;


// --- Search Functionality ---

const services = [
    {
        name: 'Plumbing',
        icon: '🚰',
        description: 'Leak repair, faucet installation, drain cleaning',
        url: 'service-plumbing.html',
        keywords: ['plumber', 'leak', 'pipe', 'faucet', 'drain', 'toilet', 'water']
    },
    {
        name: 'Carpentry',
        icon: '🛠️',
        description: 'Door repair, furniture assembly, custom woodwork',
        url: 'service-carpentry.html',
        keywords: ['carpenter', 'wood', 'door', 'furniture', 'cabinet', 'shelving']
    },
    {
        name: 'Electrical',
        icon: '⚡',
        description: 'Wiring, socket installation, lighting upgrades',
        url: 'service-electrical.html',
        keywords: ['electrician', 'wiring', 'socket', 'light', 'power', 'switch']
    },
    {
        name: 'Cleaning',
        icon: '🧹',
        description: 'Deep cleaning, move-in/out, kitchen & bathroom',
        url: 'service-cleaning.html',
        keywords: ['clean', 'maid', 'sanitize', 'housekeeping', 'deep clean']
    },
    {
        name: 'Painting',
        icon: '🎨',
        description: 'Interior & exterior painting, wall preparation',
        url: 'service-painting.html',
        keywords: ['paint', 'painter', 'interior', 'exterior', 'wall', 'color']
    },
    {
        name: 'Appliance Repair',
        icon: '🔧',
        description: 'Refrigerator, washing machine, AC repair',
        url: 'service-appliance.html',
        keywords: ['appliance', 'fridge', 'refrigerator', 'washing machine', 'ac', 'repair']
    }
];

function filterServices(query) {
    if (!query) return [];

    query = query.toLowerCase();
    return services.filter(service => {
        return service.name.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query) ||
            service.keywords.some(keyword => keyword.includes(query));
    });
}

function initializeSearch() {
    const navSearchInput = document.getElementById('navServiceSearch');
    const navAutocompleteDiv = document.getElementById('navSearchAutocomplete');

    // Skip if search elements don't exist
    if (!navSearchInput || !navAutocompleteDiv) return;

    function displayNavAutocomplete(results) {
        if (results.length === 0) {
            navAutocompleteDiv.innerHTML = '<div class="autocomplete-empty-navbar">No services found</div>';
            navAutocompleteDiv.classList.add('active');
            return;
        }

        navAutocompleteDiv.innerHTML = results.map(service => `
            <div class="autocomplete-item-navbar" onclick="window.location.href='${service.url}'">
                <span class="autocomplete-icon-navbar">${service.icon}</span>
                <div>
                    <div class="autocomplete-title-navbar">${service.name}</div>
                    <div class="autocomplete-desc-navbar">${service.description}</div>
                </div>
            </div>
        `).join('');

        navAutocompleteDiv.classList.add('active');
    }

    navSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length < 1) {
            navAutocompleteDiv.classList.remove('active');
            return;
        }

        const results = filterServices(query);
        if (results.length > 0) {
            displayNavAutocomplete(results);
        } else {
            navAutocompleteDiv.classList.remove('active');
        }
    });

    navSearchInput.addEventListener('focus', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            const results = filterServices(query);
            if (results.length > 0) {
                displayNavAutocomplete(results);
            }
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper-navbar')) {
            navAutocompleteDiv.classList.remove('active');
        }
    });

    // Handle Enter key
    navSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            const results = filterServices(query);
            if (results.length > 0) {
                window.location.href = results[0].url;
            }
        }
    });
}
