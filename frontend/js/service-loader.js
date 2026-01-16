/**
 * Service Pages Loader
 * dynamically loads provider profiles for the specific service page
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Service Loader v3 Loaded');
    const serviceId = document.body.getAttribute('data-service-id');
    const providersContainer = document.getElementById('providers-container');

    if (serviceId && providersContainer) {
        loadProvidersForPage(serviceId, providersContainer);
    }
});

function loadProvidersForPage(serviceId, container) {
    container.innerHTML = '<div class="loading-spinner">Loading professionals...</div>';

    fetch(`../backend/api/get-providers.php?service_id=${serviceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                renderProviders(data.data, container);
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No professionals currently available for this service.</p>
                        <p>Please check back later.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading providers:', error);
            container.innerHTML = '<div class="error-message">Unable to load professionals. Please refresh the page.</div>';
        });
}

function renderProviders(providers, container) {
    container.innerHTML = ''; // Clear loading state

    // Create grid container if not exists
    const grid = document.createElement('div');
    grid.className = 'service-grid';

    providers.forEach(provider => {
        const card = document.createElement('div');
        card.className = 'service-item provider-card';
        card.innerHTML = `
            <div class="provider-header">
                <div class="provider-avatar">
                   ${provider.profile_image ? `<img src="${provider.profile_image}" alt="${provider.full_name}">` : '<div class="avatar-placeholder">' + provider.full_name.charAt(0) + '</div>'}
                </div>
                <h3>${provider.full_name}</h3>
                <span class="category-badge">${provider.category || provider.service_name || 'Service'}</span>
                ${provider.is_verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
            </div>
            
            <div class="provider-stats">
                <div class="stat">
                    <span class="label">Experience</span>
                    <span class="value">${(provider.experience_years && provider.experience_years !== 'null') ? provider.experience_years + ' Years' : 'New Pro'}</span>
                </div>
                <div class="stat">
                    <span class="value" style="display: flex; align-items: center; gap: 2px;">
                        ${renderStarRating(provider.rating || 0)} 
                        <span style="font-size: 0.85em; color: #666; margin-left: 4px;">(${parseFloat(provider.rating || 0).toFixed(1)})</span>
                    </span>
                </div>
            </div>
            
            <p class="provider-bio">${provider.bio || 'Professional service provider.'}</p>
            
            <div class="provider-pricing">
                ${parseFloat(provider.hourly_rate) > 0
                ? `<span class="price">₹${parseFloat(provider.hourly_rate).toFixed(0)}<small>/hr</small></span>`
                : `<span class="price" style="font-size: 1rem; color: #666;">Starts from ₹${parseFloat(provider.average_service_rate || 500).toFixed(0)}<small>/hr</small></span>`}
            </div>
            
            <button class="btn btn-primary" onclick="openBookingModal(${provider.service_id}, ${provider.provider_id})">
                Book Now
            </button>
        `;
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

function renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';

    // Full Stars
    for (let i = 0; i < fullStars; i++) {
        html += '<span style="color: #FFD700; font-size: 1.1em;">★</span>'; // Gold star
    }

    // Half Star (using simple text approximation or CSS, here simple unicode)
    // Precise half star is hard with just char, using a different color or char if possible, 
    // or just a full star with different style. Let's start with standard full/empty for MVP polish.
    // actually, for half star, let's just use a full star but maybe different opacity or a specific character if available.
    // Unicode doesn't have a reliable half-star across fonts. 
    // I previously used simple text. The user wants "do the ratings".
    // Let's stick to full stars for logical checking, but maybe I can use SVGs for perfection?
    // User asked for "do the ratings", implies visual.
    // I will use SVGs for best result.

    return generateStarSvgs(rating);
}

function generateStarSvgs(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            // Full Star
            html += `<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        } else if (i - 0.5 <= rating) {
            // Half Star (Gradient)
            html += `<svg width="16" height="16" viewBox="0 0 24 24" fill="url(#halfStar)" stroke="#B8860B" stroke-width="1">
                        <defs><linearGradient id="halfStar"><stop offset="50%" stop-color="#FFD700"/><stop offset="50%" stop-color="#E0E0E0"/></linearGradient></defs>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                     </svg>`;
        } else {
            // Empty Star
            html += `<svg width="16" height="16" viewBox="0 0 24 24" fill="#E0E0E0" stroke="#999" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        }
    }
    return html;
}
