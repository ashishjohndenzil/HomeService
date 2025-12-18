// Main JavaScript file for Home Service Booking

document.addEventListener('DOMContentLoaded', function() {
    console.log('Home Service Booking Application Loaded');
    
    // Add event listeners and initialize components here
    initializeApp();
});

function initializeApp() {
    // Initialize application
    console.log('App initialized');
}

// API Helper Functions
async function fetchAPI(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`../backend/api/${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// Utility Functions
function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]: ${message}`);
}
