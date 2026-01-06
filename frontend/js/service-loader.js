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
                    <span class="label">Rating</span>
                    <span class="value">⭐ ${provider.rating || 'New'}</span>
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
