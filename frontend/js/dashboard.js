// Check if user is logged in on page load
let customerServicesCache = [];
let providerServiceCategory = '';

document.addEventListener('DOMContentLoaded', function () {
    const user = localStorage.getItem('user');

    if (!user) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(user);
    const userType = userData.user_type || userData.userType || 'customer';

    // Redirect admin to admin dashboard if they land here
    if (userType === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    console.log('User data from localStorage:', userData);

    // Populate user information (handle both snake_case from backend and camelCase from old data)
    const fullName = userData.full_name || userData.fullName || 'User';

    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('settingsName').value = fullName;
    document.getElementById('settingsEmail').value = userData.email;
    document.getElementById('settingsPhone').value = userData.phone || '';
    document.getElementById('settingsLocation').value = userData.location || '';

    // Initialize Autocomplete for Profile Location
    if (typeof window.initLocationAutocomplete === 'function') {
        window.initLocationAutocomplete('settingsLocation');
    }

    // Set Profile Image
    // Set Profile Image or Default Icon
    const img = document.getElementById('avatarImage');
    const initials = document.getElementById('avatarInitials');

    if (userData.profile_image) {
        if (img && initials) {
            img.src = userData.profile_image;
            img.style.display = 'block';
            initials.style.display = 'none';
        }
    } else {
        // Fallback to Icon based on Role
        if (img) img.style.display = 'none';
        if (initials) {
            initials.style.display = 'flex';
            // Set icon based on user type
            if (userType === 'provider') {
                initials.innerHTML = '🛠️'; // Tool/Worker icon for Provider
                initials.style.background = '#e0e7ff'; // Light Indigo
                initials.style.color = '#4338ca';
            } else {
                initials.innerHTML = '👤'; // User icon for Customer
                initials.style.background = '#f3f4f6'; // Light Gray
                initials.style.color = '#374151';
            }
            initials.style.fontSize = '2rem';
        }
    }

    // Store provider service category if available
    if (userType === 'provider') {
        if (userData.category) {
            providerServiceCategory = userData.category;
            const categoryEl = document.getElementById('serviceCategory');
            if (categoryEl) {
                categoryEl.textContent = userData.category;
            }
        } else {
            // Fallback if category not in user data
            const categoryEl = document.getElementById('serviceCategory');
            if (categoryEl) {
                categoryEl.textContent = 'Not set';
            }
        }
    }

    // Setup navigation click handlers
    setupNavigation();

    // Load dashboard data and bookings
    loadDashboardData();
    loadBookings();

    // Load services for the appropriate dashboard
    if (userType === 'customer') {
        loadCustomerServices();
    } else {
        loadProviderServices();
    }

    // Setup filter buttons if they exist - use event delegation
    setupBookingFilters();

    // Initialize Chat System
    if (typeof setupChatSystem === 'function') {
        setupChatSystem();
    }

    // Initialize Location Autocomplete
    if (typeof setupAddressAutocomplete === 'function') {
        console.log('Dashboard: Initializing Autocomplete for settingsLocation');
        setupAddressAutocomplete('settingsLocation', 'settingsLocationSuggestions');
    } else {
        console.warn('Dashboard: setupAddressAutocomplete not found');
    }
});

// Setup booking filters with event delegation
function setupBookingFilters() {
    // Use event delegation on the parent container
    const filterContainer = document.querySelector('.bookings-filters');

    if (filterContainer) {
        filterContainer.addEventListener('click', function (e) {
            const filterBtn = e.target.closest('.filter-btn');

            if (filterBtn) {
                e.preventDefault();

                // Update active button
                const allButtons = filterContainer.querySelectorAll('.filter-btn');
                allButtons.forEach(btn => btn.classList.remove('active'));
                filterBtn.classList.add('active');

                // Load bookings with filter
                const filter = filterBtn.getAttribute('data-filter');
                loadBookings(filter === 'all' ? null : filter);
            }
        });

        // Set initial active state
        const activeBtn = filterContainer.querySelector('.filter-btn.active');
        if (!activeBtn && filterContainer.querySelector('.filter-btn')) {
            filterContainer.querySelector('.filter-btn').classList.add('active');
        }
    }
}

// Load customer services
function loadCustomerServices() {
    const servicesContent = document.getElementById('servicesContent');
    if (!servicesContent) return;

    fetch('/HomeService/backend/api/services.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            return response.json();
        })
        .then(data => {
            // Handle both API response formats
            customerServicesCache = data.services || data.data || [];

            if (data.success && customerServicesCache && customerServicesCache.length > 0) {
                const categories = Array.from(new Set(customerServicesCache.map(s => s.category || s.name)));
                renderCustomerCategoryFilters(categories);
                renderCustomerServices(customerServicesCache);

                // Load providers after services but don't render them yet
                loadAllProviders();
            } else {
                servicesContent.innerHTML = '<p class="empty-state">No services available at the moment.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading services:', error);
            console.error('Fetch failed for services.php');
            servicesContent.innerHTML = `
                <div class="empty-state">
                    <p>Unable to load services.</p>
                    <small style="color:red;">${error.message}</small>
                    <br><br>
                    <button class="btn btn-primary" onclick="loadCustomerServices()">Try Again</button>
                </div>
            `;
        });
}

function renderCustomerCategoryFilters(categories) {
    const servicesSection = document.getElementById('services');
    if (!servicesSection) return;

    let filterBar = document.getElementById('serviceCategoryFilters');
    if (!filterBar) {
        filterBar = document.createElement('div');
        filterBar.id = 'serviceCategoryFilters';
        filterBar.className = 'bookings-filters';
        servicesSection.insertBefore(filterBar, servicesSection.querySelector('#servicesContent'));
    }

    filterBar.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'All';
    allBtn.dataset.category = 'all';
    filterBar.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat;
        btn.dataset.category = cat;
        filterBar.appendChild(btn);
    });

    filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        const selected = btn.dataset.category;

        filterByCategory(selected);
    });
}

function filterByCategory(category) {
    const filterBar = document.getElementById('serviceCategoryFilters');
    if (filterBar) {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = filterBar.querySelector(`button[data-category="${category}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    const professionalsHeader = document.getElementById('professionalsHeader');

    if (category === 'all') {
        renderCustomerServices(customerServicesCache);

        const providersContent = document.getElementById('professionalsContent');
        if (providersContent) {
            providersContent.innerHTML = '';
        }
        if (professionalsHeader) professionalsHeader.style.display = 'none';
    } else {
        const filteredServices = customerServicesCache.filter(s => (s.category || s.name) === category);
        renderCustomerServices(filteredServices);

        const filteredProviders = allProvidersCache.filter(p => (p.category || p.service_name) === category);

        if (professionalsHeader) professionalsHeader.style.display = 'block';
        renderProviders(filteredProviders);
    }
}

function renderCustomerServices(services) {
    const servicesContent = document.getElementById('servicesContent');
    if (!servicesContent) return;

    servicesContent.innerHTML = '';

    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-item';

        const icons = {
            'Plumbing': '🚰',
            'Carpentry': '🛠️',
            'Electrical': '💡',
            'Cleaning': '🧹',
            'Appliance Repair': '🔧',
            'Painting': '🎨'
        };

        const icon = icons[service.name] || icons[service.category] || '🔧';

        serviceCard.innerHTML = `
            <span class="category-badge">${service.category || service.name}</span>
            <h3>${icon} ${service.name}</h3>
            <p>${service.description || 'Professional service'}</p>
            <button class="btn btn-primary btn-sm" type="button" data-category="${service.category || service.name}">Select Professional</button>
        `;

        // Add event listener to the button
        const selectBtn = serviceCard.querySelector('button');
        selectBtn.addEventListener('click', function () {
            const category = this.dataset.category;
            filterByCategory(category);

            // Scroll to professionals section
            const professionalsSection = document.getElementById('professionalsContent');
            if (professionalsSection) {
                // Add a small delay to ensure rendering is complete
                setTimeout(() => {
                    professionalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });

        servicesContent.appendChild(serviceCard);
    });
}

// Load all providers
let allProvidersCache = [];

function loadAllProviders() {
    const providersContent = document.getElementById('professionalsContent');
    if (!providersContent) return;

    fetch('/HomeService/backend/api/get-all-providers.php')
        .then(response => response.json())
        .then(data => {
            allProvidersCache = data.data || [];
            if (data.success && allProvidersCache.length > 0) {
                // renderProviders(allProvidersCache); // Wait for user selection
                const providersContent = document.getElementById('professionalsContent');
                if (providersContent) {
                    providersContent.innerHTML = '<p class="empty-state">Select a service category above to view available professionals.</p>';
                }
            } else {
                providersContent.innerHTML = '<p class="empty-state">No professionals available at the moment.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading providers:', error);
            providersContent.innerHTML = '<p class="empty-state">Error loading professionals.</p>';
        });
}

function renderProviders(providers) {
    const providersContent = document.getElementById('professionalsContent');
    if (!providersContent) return;

    providersContent.innerHTML = '';

    if (providers.length === 0) {
        providersContent.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3>No professionals found</h3>
                <p>We couldn't find any professionals for this category at the moment.</p>
                <p style="margin-top: 0.5rem; font-size: 0.9em;">Please check back later or try a different category.</p>
            </div>
        `;
        return;
    }

    providers.forEach(provider => {
        const providerCard = document.createElement('div');
        providerCard.className = 'service-item provider-card';

        providerCard.innerHTML = `
            <div class="provider-header">
                <div class="provider-avatar">
                   ${provider.profile_image ? `<img src="${provider.profile_image}" alt="${provider.full_name}">` : '<div class="avatar-placeholder">' + provider.full_name.charAt(0) + '</div>'}
                </div>
                <h3 style="margin-bottom: 0.25rem;">${provider.full_name}</h3>
                <span class="category-badge">${provider.category || provider.service_name || 'Service'}</span>
                ${provider.is_verified ? '<div style="margin-top:4px;"><span class="verified-badge">✓ Verified</span></div>' : ''}
            </div>
            
            <div class="provider-stats">
                <div class="stat">
                    <span class="label">Experience</span>
                    <span class="value">${(provider.experience_years && provider.experience_years !== 'null') ? provider.experience_years + ' Years' : 'New Pro'}</span>
                </div>
                <div class="stat">
                    <span class="label">Rating</span>
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
                : `<span class="price" style="font-size: 1rem; color: #666;">Starts from ₹500<small>/hr</small></span>`}
            </div>
            
            <button class="btn btn-primary" style="width: 100%;" type="button" onclick="openBookingModal(${provider.service_id})">Book Now</button>
        `;
        // Note: passing provider.service_id to openBookingModal to pre-select the service.
        // Ideally we should also pre-select the provider, but the current modal logic needs updating to support provider pre-selection.
        // For now, this at least gets them to the right service form.

        providersContent.appendChild(providerCard);
    });
}

function renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Simple text stars for dashboard to avoid SVG complexity/clutter potential or missing defs
    // But aligning with service-loader means using SVGs.
    // Let's use simple SVGs inline.

    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<span style="color: #FFD700;">★</span>';
        } else if (i - 0.5 <= rating) {
            html += '<span style="color: #FFD700;">★</span>'; // Simpler half star fallback
        } else {
            html += '<span style="color: #e5e7eb;">★</span>';
        }
    }
    return html;
}

// Load provider services
function loadProviderServices() {
    const token = localStorage.getItem('token');
    const servicesContent = document.getElementById('servicesContent');

    if (!servicesContent) return;

    if (!token) {
        servicesContent.innerHTML = '<p class="empty-state">Authentication required. Please log in again.</p>';
        return;
    }

    fetch('/HomeService/backend/api/provider-services.php?token=' + encodeURIComponent(token), {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                console.error('Server Error:', text);
                throw new Error('Server Error: ' + text.substring(0, 100));
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.services && data.services.length > 0) {
                servicesContent.innerHTML = '';
                data.services.forEach(service => {
                    const serviceCard = document.createElement('div');
                    serviceCard.className = 'provider-service-item';

                    const verifiedBadge = service.is_verified ? '<span class="verified-badge">✓ Verified</span>' : '';
                    const ratingStars = '⭐'.repeat(Math.round(service.rating || 0));

                    serviceCard.innerHTML = `
                    <div class="service-card-header">
                        <div class="service-card-title">
                            <h3>${service.service_name}</h3>
                            ${(service.category && service.category !== service.service_name) ? `<span class="category-badge">${service.category}</span>` : ''}
                        </div>
                        ${verifiedBadge}
                    </div>
                    <div class="service-card-details">
                        <p><strong>Experience:</strong> ${service.experience_years || 0} years</p>
                        <p><strong>Rate:</strong> ₹${parseFloat(service.hourly_rate || 0).toFixed(2)}/hour</p>
                        <p><strong>Rating:</strong> ${ratingStars} (${service.total_reviews || 0} reviews)</p>
                    </div>
                    <div class="service-card-actions">
                        <button class="btn btn-sm btn-secondary" type="button" onclick="editService(${service.id}, ${service.hourly_rate}, ${service.experience_years}, '${service.service_name}')">Edit</button>
                        <button class="btn btn-sm btn-danger" type="button" onclick="deleteService(${service.id})">Delete</button>
                    </div>
                `;
                    servicesContent.appendChild(serviceCard);
                });

                // Calculate and update average rating
                const totalRating = data.services.reduce((acc, curr) => acc + (parseFloat(curr.rating) || 0), 0);
                const avgRating = data.services.length ? (totalRating / data.services.length).toFixed(1) : '0.0';

                const ratingElement = document.getElementById('rating');
                if (ratingElement) {
                    ratingElement.textContent = avgRating;
                }

            } else {
                servicesContent.innerHTML = '<p class="empty-state">No services added yet. <a href="#" onclick="showAddServiceModal()">Add your first service</a></p>';

                // Reset rating if no services
                const ratingElement = document.getElementById('rating');
                if (ratingElement) {
                    ratingElement.textContent = '0.0';
                }
            }
        })
        .catch(error => {
            console.error('Error loading provider services:', error);
            servicesContent.innerHTML = `<div class="empty-state"><p>Error loading services.</p><small>${error.message}</small></div>`;
        });
}

// Load and display bookings
function loadBookings(status = null) {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        const bookingsContent = document.getElementById('bookingsContent');
        if (bookingsContent) {
            bookingsContent.innerHTML = '<p class="empty-state">Please log in to view bookings</p>';
        }
        return;
    }

    let url = '/HomeService/backend/api/bookings.php?token=' + encodeURIComponent(token);
    if (status) {
        url += '&status=' + encodeURIComponent(status);
    }

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                console.error('Server Error:', text);
                throw new Error('Server Error: ' + text.substring(0, 100)); // Show first 100 chars of error
            }
            return response.json();
        })
        .then(data => {
            const bookingsContent = document.getElementById('bookingsContent');

            if (data.success && data.bookings && data.bookings.length > 0) {
                bookingsContent.innerHTML = '';

                data.bookings.forEach(booking => {
                    const bookingElement = createBookingElement(booking, user.user_type);
                    bookingsContent.appendChild(bookingElement);
                });

                // Update dashboard stats
                updateDashboardStats(data.bookings, user.user_type);

                if (user.user_type === 'provider') {
                    renderEarningsHistory(data.bookings);
                }
            } else {
                if (user.user_type === 'customer') {
                    bookingsContent.innerHTML = '<p class="empty-state">No bookings yet. <a href="#services" onclick="switchPage(\'services\')">Browse services</a></p>';
                } else {
                    bookingsContent.innerHTML = '<p class="empty-state">No service requests yet</p>';
                }
            }
        })
        .catch(error => {
            console.error('Error loading bookings:', error);
            const bookingsContent = document.getElementById('bookingsContent');
            bookingsContent.innerHTML = `<div class="empty-state"><p>Error loading bookings.</p><small>${error.message}</small></div>`;
        });
}// Create booking element for display
function createBookingElement(booking, userType) {
    const div = document.createElement('div');
    div.className = `booking-item booking-${booking.status}`;
    div.dataset.id = booking.id; // Add data-id for scrolling


    // Parse date manually to avoid timezone issues
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // Month is 0-indexed

    // Parse time
    const [hours, minutes] = booking.booking_time.split(':');
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);

    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const statusBadge = getStatusBadge(booking.status);

    if (userType === 'customer') {
        div.innerHTML = `
            <div class="booking-header">
                <div class="booking-info">
                    <h3>${booking.service_name} <span class="category-badge">${booking.service_category || booking.service_name}</span></h3>
                    <p class="provider-info">Provider: <strong>${booking.provider_name}</strong></p>
                </div>
                <span class="status-badge ${booking.status}">${statusBadge}</span>
            </div>
            <div class="booking-details">
                <div class="detail">
                    <span class="label">📅 Date & Time:</span>
                    <span class="value">${formattedDate} at ${formattedTime}</span>
                </div>
                <div class="detail">
                    <span class="label">💰 Amount:</span>
                    <span class="value">₹${parseFloat(booking.total_amount || 0).toFixed(2)}</span>
                </div>
                ${booking.description ? `
                <div class="detail">
                    <span class="label">📝 Description:</span>
                    <span class="value">${booking.description}</span>
                </div>
                ` : ''}
                <div class="detail">
                    <span class="label">📧 Contact:</span>
                    <span class="value">${booking.provider_email}</span>
                </div>
                <div class="detail">
                     <span class="label">📍 Location:</span>
                     <span class="value">${booking.customer_location || 'Not specified'}</span>
                 </div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-sm btn-primary" style="background-color: #3b82f6; border-color: #3b82f6;" onclick="openChat(${booking.provider_user_id}, '${booking.provider_name ? booking.provider_name.replace(/'/g, "\\'") : ''}')">Chat</button>
                ${booking.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${booking.id})">Cancel Booking</button>` : ''}
                
                ${['completed', 'cancelled'].includes(booking.status) ?
                `<button class="btn btn-sm btn-outline-danger" onclick="openReportModal(${booking.id})" style="border: 1px solid #ef4444; color: #ef4444; background: transparent;">Report Issue</button>` : ''}
                
                ${booking.status === 'completed' ?
                `<button class="btn btn-sm btn-outline-primary" onclick="openReceiptModal(${booking.id})" style="border: 1px solid #3b82f6; color: #3b82f6; background: transparent;">Receipt</button>` : ''}

                ${booking.status === 'completed' ?
                (booking.user_rating
                    ? `<div style="display: flex; align-items: center; justify-content: flex-start; gap: 10px; width: 100%;">
                           <div class="user-rating-display" style="display:inline-flex; align-items:center; gap:5px; background:#fef3c7; padding:4px 10px; border-radius:15px; border:1px solid #fcd34d; flex-shrink: 0;">
                               <span style="color:#d97706; font-weight:bold;">${booking.user_rating} ★</span>
                           </div>
                           ${booking.user_review ? `<div style="color: #4b5563; font-style: italic; font-size: 0.9rem; max-width: 400px; text-align: left;">"${booking.user_review}"</div>` : ''}
                       </div>`
                    : `<button class="btn btn-sm btn-primary" onclick="reviewBooking(${booking.id})">Leave Review</button>`
                ) : ''}
            </div>
        `;
    } else {
        // Provider view
        div.innerHTML = `
            <div class="booking-header">
                <div class="booking-info">
                    <h3>${booking.service_name} <span class="category-badge">${booking.service_category || booking.service_name}</span></h3>
                    <p class="customer-info">Customer: <strong>${booking.customer_name}</strong></p>
                </div>
                <span class="status-badge ${booking.status}">${statusBadge}</span>
            </div>
            <div class="booking-details">
                <div class="detail">
                    <span class="label">📅 Date & Time:</span>
                    <span class="value">${formattedDate} at ${formattedTime}</span>
                </div>
                <div class="detail">
                    <span class="label">💰 Amount:</span>
                    <span class="value">₹${parseFloat(booking.total_amount || 0).toFixed(2)}</span>
                </div>
                ${booking.description ? `
                <div class="detail">
                    <span class="label">📝 Description:</span>
                    <span class="value">${booking.description}</span>
                </div>
                ` : ''}
                <div class="detail">
                    <span class="label">📱 Contact:</span>
                    <span class="value">${booking.customer_phone || booking.customer_email}</span>
                </div>
                <div class="detail">
                    <span class="label">📍 Location:</span>
                    <span class="value">${booking.customer_location || 'Not specified'}</span>
                </div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-sm btn-primary" style="background-color: #3b82f6; border-color: #3b82f6;" onclick="openChat(${booking.customer_id}, '${booking.customer_name}')">Chat</button>
                ${booking.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="updateBookingStatus(${booking.id}, 'confirmed')">Confirm</button>
                    <button class="btn btn-sm btn-danger" onclick="updateBookingStatus(${booking.id}, 'cancelled')">Reject</button>
                ` : ''}
                ${booking.status === 'confirmed' ? `
                    <button class="btn btn-sm btn-success" onclick="updateBookingStatus(${booking.id}, 'completed')">Mark Complete</button>
                ` : ''}
                ${booking.status === 'completed' && booking.user_rating ? `
                    <div style="display: flex; align-items: center; justify-content: flex-start; gap: 10px; width: 100%;">
                        <div class="user-rating-display" style="display:inline-flex; align-items:center; gap:5px; background:#fef3c7; padding:4px 10px; border-radius:15px; border:1px solid #fcd34d; flex-shrink: 0;">
                            <span style="color:#d97706; font-weight:bold;">${booking.user_rating} ★</span>
                        </div>
                        ${booking.user_review ? `<div style="color: #4b5563; font-style: italic; font-size: 0.9rem; max-width: 400px; text-align: left;">"${booking.user_review}"</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    return div;
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'pending': '⏳ Pending',
        'confirmed': '✓ Confirmed',
        'completed': '✅ Completed',
        'cancelled': '✗ Cancelled'
    };
    return badges[status] || status;
}

// Update dashboard statistics
function updateDashboardStats(bookings, userType) {
    if (userType === 'customer') {
        const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const totalSpent = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

        const upcomingElement = document.getElementById('upcomingCount');
        const completedElement = document.getElementById('completedCount');
        const spentElement = document.getElementById('totalSpent');

        if (upcomingElement) upcomingElement.textContent = upcoming;
        if (completedElement) completedElement.textContent = completed;
        if (spentElement) spentElement.textContent = '₹' + totalSpent.toFixed(2);
    } else {
        const pending = bookings.filter(b => b.status === 'pending').length;
        const completed = bookings.filter(b => b.status === 'completed').length;

        const pendingElement = document.getElementById('pendingCount');
        const completedElement = document.getElementById('completedCount');

        if (pendingElement) pendingElement.textContent = pending;
        if (completedElement) completedElement.textContent = completed;

        // Calculate Earnings
        const totalEarnings = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

        const earningsElement = document.getElementById('earningsStat');
        if (earningsElement) earningsElement.textContent = '₹' + totalEarnings.toFixed(2);

        // Update Earnings Page Cards
        const earningsPageTotal = document.querySelector('#earnings .earnings-card:last-child .amount');
        if (earningsPageTotal) earningsPageTotal.textContent = '₹' + totalEarnings.toFixed(2);

        // For this version, we'll just show total as monthly logic is complex without date filtering
        const earningsPageMonthly = document.querySelector('#earnings .earnings-card:first-child .amount');
        if (earningsPageMonthly) earningsPageMonthly.textContent = '₹' + totalEarnings.toFixed(2);
    }
}

// Setup sidebar navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            switchPage(page);
        });
    });
}

// Switch between pages
function switchPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Mark nav item as active
    const activeNavItem = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Load data for dynamic pages
    if (pageId === 'notifications') loadNotificationsPage();
    if (pageId === 'calendar') loadCalendarPage();
    if (pageId === 'my-reviews') loadProviderReviews();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

// Load user data and populate dashboard
function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userType = user.user_type || user.userType || 'customer';

    // This will be updated when bookings are loaded
    if (userType === 'customer') {
        const upcomingElement = document.getElementById('upcomingCount');
        const completedElement = document.getElementById('completedCount');
        const spentElement = document.getElementById('totalSpent');

        if (upcomingElement) upcomingElement.textContent = '0';
        if (completedElement) completedElement.textContent = '0';
        if (spentElement) spentElement.textContent = '₹0';
    } else {
        const pendingElement = document.getElementById('pendingCount');
        const completedElement = document.getElementById('completedCount');
        const ratingElement = document.getElementById('rating');
        const earningsElement = document.getElementById('earningsStat');

        if (pendingElement) pendingElement.textContent = '0';
        if (completedElement) completedElement.textContent = '0';
        if (ratingElement) ratingElement.textContent = '4.8';
        if (earningsElement) earningsElement.textContent = '₹0';
        // Rating will be updated by loadProviderServices
        if (ratingElement) ratingElement.textContent = '...';
    }
}

// Cancel booking (customer)
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    const user = JSON.parse(localStorage.getItem('user'));

    try {
        showLoadingState(true);
        const response = await fetch('/HomeService/backend/api/update-booking-status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_id: bookingId,
                status: 'cancelled',
                user_id: user.id,
                user_type: user.user_type
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Booking cancelled successfully', 'success');
            loadBookings(); // Refresh list
            loadDashboardData(); // Refresh stats
        } else {
            showNotification(data.message || 'Failed to cancel booking', 'error');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('An error occurred. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

// Review booking (customer)
// Review booking (customer)
function reviewBooking(bookingId) {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;

    document.getElementById('reviewBookingId').value = bookingId;
    document.getElementById('reviewComment').value = '';

    // Reset stars
    const stars = document.querySelectorAll('input[name="rating"]');
    stars.forEach(s => s.checked = false);

    modal.style.display = 'block';
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) modal.style.display = 'none';
}

// Handle Review Submit (Explicit Function to prevent double-submit)
function handleReviewSubmit() {
    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;

    // Mutex check: If already submitting, stop here.
    if (reviewForm.dataset.submitting === "true") {
        console.warn('Review submission already in progress.');
        return;
    }

    const bookingId = document.getElementById('reviewBookingId').value;
    const comment = document.getElementById('reviewComment').value;
    const ratingInput = document.querySelector('input[name="rating"]:checked');

    if (!ratingInput) {
        showNotification('Please select a rating', 'warning');
        return;
    }

    const rating = ratingInput.value;

    const submitBtn = document.getElementById('btnSubmitReview');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    // Set mutex
    reviewForm.dataset.submitting = "true";

    const token = localStorage.getItem('token');

    fetch('/HomeService/backend/api/submit-review.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            booking_id: bookingId,
            rating: parseFloat(rating),
            review: comment
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showNotification('Review submitted successfully', 'success');
                closeReviewModal();
                // Reload based on current active filter
                const activeFilter = document.querySelector('.filter-btn.active');
                const currentStatus = activeFilter ? activeFilter.dataset.filter : 'all';
                loadBookings(currentStatus === 'all' ? null : currentStatus);
            } else {
                showNotification(data.message || 'Failed to submit review', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showNotification('Error submitting review', 'error');
        })
        .finally(() => {
            // Release mutex
            reviewForm.dataset.submitting = "false";

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
            }
        });
}

// Make it global
window.handleReviewSubmit = handleReviewSubmit;

// Update booking status (provider)
async function updateBookingStatus(bookingId, newStatus) {
    const action = newStatus === 'cancelled' ? 'reject' : newStatus;
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;

    const user = JSON.parse(localStorage.getItem('user'));

    try {
        showLoadingState(true);
        const response = await fetch('/HomeService/backend/api/update-booking-status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_id: bookingId,
                status: newStatus,
                user_id: user.id,
                user_type: user.user_type
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Booking ${action}ed successfully`, 'success');
            loadBookings(); // Refresh list
            loadDashboardData(); // Refresh stats
        } else {
            showNotification(data.message || 'Failed to update booking', 'error');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        showNotification('An error occurred. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

// Provider service management functions
// Provider service management functions
function showAddServiceModal() {
    const modal = document.getElementById('addServiceModal');
    if (!modal) return;

    // Reset form
    document.getElementById('addServiceForm').reset();

    const token = localStorage.getItem('token');
    const select = document.getElementById('newServiceId');
    select.innerHTML = '<option value="">Loading...</option>';

    // Fetch both provider's existing services and all available services
    Promise.all([
        fetch('/HomeService/backend/api/provider-services.php?token=' + encodeURIComponent(token), {
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(res => res.json()),
        fetch('/HomeService/backend/api/services.php').then(res => res.json())
    ])
        .then(([providerData, allServicesData]) => {
            select.innerHTML = '<option value="">Select a service...</option>';

            const existingServiceIds = new Set();
            if (providerData.success && providerData.services) {
                providerData.services.forEach(s => existingServiceIds.add(parseInt(s.service_id)));
            }

            const allServices = allServicesData.services || allServicesData.data || [];
            // Remove duplicates in allServices just in case, and filter out existing ones
            const uniqueAvailableServices = Array.from(new Map(allServices.map(s => [s.name, s])).values())
                .filter(s => !existingServiceIds.has(parseInt(s.id)));

            if (uniqueAvailableServices.length === 0) {
                select.innerHTML = '<option value="">No more services available to add</option>';
                return;
            }

            uniqueAvailableServices.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                if (s.base_price) {
                    option.dataset.rate = s.base_price;
                }
                select.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Error loading service types:', err);
            select.innerHTML = '<option value="">Error loading services</option>';
            showNotification('Failed to load services', 'error');
        });

    modal.style.display = 'block';
}

function closeAddServiceModal() {
    const modal = document.getElementById('addServiceModal');
    if (modal) modal.style.display = 'none';
}

// Handle Add Service Form Submit
document.addEventListener('DOMContentLoaded', () => {
    const addForm = document.getElementById('addServiceForm');
    if (addForm) {
        // Auto-fill rate on service selection
        const serviceSelect = document.getElementById('newServiceId');
        const rateInput = document.getElementById('newHourlyRate');

        if (serviceSelect && rateInput) {
            serviceSelect.addEventListener('change', function () {
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption && selectedOption.dataset.rate) {
                    rateInput.value = selectedOption.dataset.rate;
                }
            });
        }

        addForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const serviceId = document.getElementById('newServiceId').value;
            const rate = document.getElementById('newHourlyRate').value;
            const experience = document.getElementById('newExperience').value;
            const description = document.getElementById('newDescription').value;

            if (!serviceId) {
                showNotification('Please select a service type', 'warning');
                return;
            }

            const token = localStorage.getItem('token');
            showLoadingState(true);

            fetch('/HomeService/backend/api/add-service.php', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service_id: serviceId,
                    hourly_rate: parseFloat(rate),
                    experience_years: parseInt(experience),
                    description: description
                })
            })
                .then(res => res.json())
                .then(data => {
                    showLoadingState(false);
                    if (data.success) {
                        showNotification('Service added successfully', 'success');
                        closeAddServiceModal();
                        loadProviderServices();
                    } else {
                        showNotification(data.message || 'Failed to add service', 'error');
                    }
                })
                .catch(err => {
                    showLoadingState(false);
                    console.error(err);
                    showNotification('Error adding service', 'error');
                });
        });
    }

    // Edit Form Listener
    const editForm = document.getElementById('editServiceForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const serviceId = document.getElementById('editServiceId').value;
            const rate = document.getElementById('editHourlyRate').value;
            const exp = document.getElementById('editExperience').value;

            const token = localStorage.getItem('token');
            showLoadingState(true);

            fetch('/HomeService/backend/api/update-service.php', { // Reusing update-service.php
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service_id: serviceId,
                    hourly_rate: parseFloat(rate),
                    experience_years: parseInt(exp)
                })
            })
                .then(res => res.json())
                .then(data => {
                    showLoadingState(false);
                    if (data.success) {
                        showNotification('Service updated successfully', 'success');
                        closeEditServiceModal();
                        loadProviderServices();
                    } else {
                        showNotification(data.message || 'Failed to update service', 'error');
                    }
                })
                .catch(err => {
                    showLoadingState(false);
                    console.error(err);
                    showNotification('Error updating service', 'error');
                });
        });
    }
});


// Edit Service Logic Handled in Modal now, this opens it
function editService(serviceId, currentRate, currentExp, serviceName) {
    const modal = document.getElementById('editServiceModal');
    if (!modal) return;

    document.getElementById('editServiceId').value = serviceId;
    document.getElementById('editServiceName').value = serviceName;
    document.getElementById('editHourlyRate').value = currentRate;
    document.getElementById('editExperience').value = currentExp;

    modal.style.display = 'block';
}

function closeEditServiceModal() {
    const modal = document.getElementById('editServiceModal');
    if (modal) modal.style.display = 'none';
}


function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
        return;
    }

    const token = localStorage.getItem('token');
    showLoadingState(true);

    fetch('/HomeService/backend/api/delete-service.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service_id: serviceId })
    })
        .then(res => res.json())
        .then(data => {
            showLoadingState(false);
            if (data.success) {
                showNotification('Service deleted successfully', 'success');
                loadProviderServices();
            } else {
                showNotification(data.message || 'Failed to delete service', 'error');
            }
        })
        .catch(err => {
            showLoadingState(false);
            console.error('Error deleting service', err);
            showNotification('Error deleting service', 'error');
        });
}

// Show Loading Overlay
function showLoadingState(isLoading) {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.7); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = '<div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>';

        // Add spinner keyframes
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(styleSheet);

        document.body.appendChild(overlay);
    }
    overlay.style.display = isLoading ? 'flex' : 'none';
}

// Toast Notification System
function showNotification(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6');

    toast.style.cssText = `
        background-color: ${bgColor}; color: white; padding: 16px 24px;
        border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        opacity: 0; transform: translateX(20px); transition: all 0.3s ease;
        display: flex; align-items: center; gap: 10px; min-width: 300px;
    `;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Profile Editing Functions
function enableProfileEditing() {
    document.getElementById('settingsName').removeAttribute('readonly');
    document.getElementById('settingsPhone').removeAttribute('readonly');
    document.getElementById('settingsLocation').removeAttribute('readonly');
    document.getElementById('settingsName').focus();

    document.getElementById('editProfileBtn').style.display = 'none';
    document.getElementById('saveProfileBtn').style.display = 'block';
}

// Real-time Phone Validation
document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('settingsPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            // Remove non-numeric characters
            this.value = this.value.replace(/\D/g, '');

            // Limit to 10 digits
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    }
});

function saveProfile() {
    const name = document.getElementById('settingsName').value;
    const phone = document.getElementById('settingsPhone').value;
    const location = document.getElementById('settingsLocation').value;

    const token = localStorage.getItem('token');

    // Phone Validation
    if (!/^\d{10}$/.test(phone)) {
        showNotification('Phone number must be exactly 10 digits', 'error');
        return;
    }

    showLoadingState(true);

    fetch('/HomeService/backend/api/update-profile.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            full_name: name,
            phone: phone,
            location: location
        })
    })
        .then(res => res.json())
        .then(data => {
            showLoadingState(false);
            if (data.success) {
                showNotification('Profile updated successfully', 'success');

                // Update LocalStorage
                const user = JSON.parse(localStorage.getItem('user'));
                user.full_name = name;
                user.phone = phone;
                user.location = location;
                localStorage.setItem('user', JSON.stringify(user));

                // Update UI
                document.getElementById('userName').textContent = name;
                document.getElementById('settingsName').setAttribute('readonly', true);
                document.getElementById('settingsPhone').setAttribute('readonly', true);
                document.getElementById('settingsLocation').setAttribute('readonly', true);

                document.getElementById('editProfileBtn').style.display = 'block';
                document.getElementById('saveProfileBtn').style.display = 'none';
            } else {
                showNotification(data.message || 'Failed to update profile', 'error');
            }
        })
        .catch(err => {
            showLoadingState(false);
            console.error(err);
            showNotification('Error updating profile', 'error');
        });
}

// Render Earnings History
function renderEarningsHistory(bookings) {
    const earningsContent = document.getElementById('earningsContent');
    if (!earningsContent) return;

    const completedBookings = bookings.filter(b => b.status === 'completed');

    if (completedBookings.length === 0) {
        earningsContent.innerHTML = '<p class="empty-state">No earnings yet</p>';
        return;
    }

    let html = `
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background:#f3f4f6; text-align:left; border-bottom: 2px solid #e5e7eb;">
                        <th style="padding:12px; color: #4b5563;">Date</th>
                        <th style="padding:12px; color: #4b5563;">Service</th>
                        <th style="padding:12px; color: #4b5563;">Customer</th>
                        <th style="padding:12px; color: #4b5563; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
    `;

    completedBookings.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));

    completedBookings.forEach(b => {
        const date = new Date(b.booking_date).toLocaleDateString();
        html += `
            <tr style="border-bottom:1px solid #eee; hover:bg-gray-50;">
                <td style="padding:12px;">${date}</td>
                <td style="padding:12px;">${b.service_name}</td>
                <td style="padding:12px;">
                    <div>${b.customer_name}</div>
                    <div style="font-size: 0.85em; color: #6b7280;">${b.customer_phone || ''}</div>
                </td>
                <td style="padding:12px; font-weight:bold; color:#10B981; text-align: right;">₹${parseFloat(b.total_amount).toFixed(2)}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    earningsContent.innerHTML = html;
}

// Load dashboard stats on page load
loadDashboardData();
// Profile Image Upload
function uploadProfileImage(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('profile_image', file);

    const token = localStorage.getItem('token');

    // Show uploading ...
    showNotification('Uploading image...', 'info');

    fetch('/HomeService/backend/api/upload-profile-image.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Profile image updated!', 'success');
                // Update UI
                const img = document.getElementById('avatarImage');
                const initials = document.getElementById('avatarInitials');

                // Add cache buster
                img.src = data.image_url + '?t=' + new Date().getTime();
                img.style.display = 'block';
                initials.style.display = 'none';

                // Update local storage
                const user = JSON.parse(localStorage.getItem('user'));
                user.profile_image = data.image_url;
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                showNotification(data.message || 'Upload failed', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Upload failed', 'error');
        });
}

// Expose functions to window
window.reviewBooking = reviewBooking;
window.closeReviewModal = closeReviewModal;
window.cancelBooking = cancelBooking;

// --- Schedule Management ---
function loadSchedule() {
    const list = document.getElementById('scheduleList');
    if (!list) return; // Only for provider dashboard

    const token = localStorage.getItem('token');

    // Initial loading state
    list.innerHTML = '<p>Loading schedule...</p>';

    fetch('/HomeService/backend/api/get-schedule.php', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderSchedule(data.schedule);
            } else {
                list.innerHTML = '<p class="error">Failed to load schedule.</p>';
            }
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<p class="error">Error loading schedule.</p>';
        });
}

function renderSchedule(schedule) {
    const list = document.getElementById('scheduleList');
    list.innerHTML = '';

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Sort schedule based on daysOrder
    schedule.sort((a, b) => daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week));

    schedule.forEach(day => {
        const row = document.createElement('div');
        row.className = 'schedule-row';
        row.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee;';

        const isActive = day.is_active == 1;

        row.innerHTML = `
            <div style="width: 120px; font-weight: bold;">${day.day_of_week}</div>
            <div style="flex: 1;">
                <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                    <input type="checkbox" class="day-toggle" data-day="${day.day_of_week}" ${isActive ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                    <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                </label>
            </div>
            <div class="time-inputs" style="display: flex; gap: 10px; opacity: ${isActive ? '1' : '0.5'}; pointer-events: ${isActive ? 'auto' : 'none'};">
                <input type="time" class="start-time" value="${day.start_time}" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                <span>to</span>
                <input type="time" class="end-time" value="${day.end_time}" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        `;

        // Toggle logic
        const toggle = row.querySelector('.day-toggle');
        const slider = row.querySelector('.slider');
        const timeInputs = row.querySelector('.time-inputs');

        // Initial style
        slider.style.backgroundColor = isActive ? '#2196F3' : '#ccc';

        toggle.addEventListener('change', function () {
            const checked = this.checked;
            slider.style.backgroundColor = checked ? '#2196F3' : '#ccc';
            timeInputs.style.opacity = checked ? '1' : '0.5';
            timeInputs.style.pointerEvents = checked ? 'auto' : 'none';
        });

        list.appendChild(row);
    });

    // Inject style for slider pseudo-element hack
    if (!document.getElementById('sliderStyles')) {
        const style = document.createElement('style');
        style.id = 'sliderStyles';
        style.textContent = `
            .slider.round:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            input:checked + .slider:before {
                transform: translateX(26px);
            }
        `;
        document.head.appendChild(style);
    }
}

// --- Chat System ---
let chatPollInterval = null;
let currentChatContactId = null;

function setupChatSystem() {
    if (document.getElementById('chatModal')) return;

    const chatHTML = `
        <div id="chatModal" class="chat-modal" style="display: none;">
            <div class="chat-content">
                <div class="chat-header">
                    <h3 id="chatContactName">Chat</h3>
                    <button class="close-chat" onclick="closeChat()">&times;</button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-loading">Loading messages...</div>
                </div>
                <form id="chatForm" class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off">
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const style = document.createElement('style');
    style.textContent = `
        .chat-modal { position: fixed; bottom: 20px; right: 20px; width: 350px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); z-index: 2000; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e5e7eb; animation: slideUp 0.3s ease; }
        .chat-content { display: flex; flex-direction: column; height: 100%; }
        .chat-header { background: #3b82f6; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
        .chat-header h3 { margin: 0; font-size: 1rem; }
        .close-chat { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
        .chat-messages { flex: 1; padding: 12px; overflow-y: auto; background: #f9fafb; display: flex; flex-direction: column; gap: 8px; }
        .message { max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; word-wrap: break-word; }
        .message.sent { align-self: flex-end; background: #3b82f6; color: white; border-bottom-right-radius: 2px; }
        .message.received { align-self: flex-start; background: #e5e7eb; color: #1f2937; border-bottom-left-radius: 2px; }
        .chat-input-area { padding: 12px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; background: white; }
        .chat-input-area input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 20px; outline: none; }
        .chat-input-area button { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; }
        .chat-input-area button:hover { background: #2563eb; }
        .chat-date { text-align: center; font-size: 0.75rem; color: #9ca3af; margin: 8px 0; width: 100%; }
        .chat-loading { text-align: center; color: #9ca3af; margin-top: 20px; width: 100%; }
    `;
    document.head.appendChild(style);

    document.getElementById('chatForm').addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage();
    });
}

function openChat(contactId, contactName) {
    if (!localStorage.getItem('token')) return;

    // Ensure setup
    setupChatSystem();

    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('chatContactName').textContent = contactName || 'Chat';

        // Reset and Load
        document.getElementById('chatMessages').innerHTML = '<div class="chat-loading">Loading messages...</div>';
        currentChatContactId = contactId;
        loadMessages(contactId);

        setTimeout(() => document.getElementById('chatInput').focus(), 100);

        // Start polling
        if (chatPollInterval) clearInterval(chatPollInterval);
        chatPollInterval = setInterval(() => loadMessages(contactId, true), 3000);
    }
}

function closeChat() {
    const modal = document.getElementById('chatModal');
    if (modal) modal.style.display = 'none';
    if (chatPollInterval) clearInterval(chatPollInterval);
    currentChatContactId = null;
}

function loadMessages(contactId, isPoll = false) {
    if (!currentChatContactId || currentChatContactId !== contactId) return;

    fetch('/HomeService/backend/api/get-messages.php?contact_id=' + contactId, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderMessages(data.messages, isPoll);
            }
        })
        .catch(err => console.error(err));
}

function renderMessages(messages, isPoll) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('user'));

    // If polling, check if new messages arrived to avoid scroll jump
    // For now, simple re-render

    const wasScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#9ca3af; margin-top:20px;">No messages yet. Say hi!</div>';
        return;
    }

    let lastDate = null;
    messages.forEach(msg => {
        const date = new Date(msg.created_at).toLocaleDateString();
        if (date !== lastDate) {
            container.innerHTML += `<div class="chat-date">${date}</div>`;
            lastDate = date;
        }

        const isMe = msg.sender_id == user.id;
        const className = isMe ? 'sent' : 'received';

        container.innerHTML += `<div class="message ${className}" title="${new Date(msg.created_at).toLocaleTimeString()}">${msg.message}</div>`;
    });

    if (!isPoll || wasScrolledToBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || !currentChatContactId) return;

    input.value = ''; // Optimistic clear

    fetch('/HomeService/backend/api/send-message.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            receiver_id: currentChatContactId,
            message: message
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Refresh immediately logic controlled by loadMessages, but let's just trigger it
                loadMessages(currentChatContactId);
            }
        })
        .catch(err => console.error(err));
}

// Expose openChat
// Expose openChat
window.openChat = openChat;
window.closeChat = closeChat;
window.setupChatSystem = setupChatSystem;

function saveSchedule() {
    const list = document.getElementById('scheduleList');
    if (!list) return;

    const rows = list.querySelectorAll('.schedule-row');
    const scheduleData = [];

    rows.forEach(row => {
        const toggle = row.querySelector('.day-toggle');
        const start = row.querySelector('.start-time').value;
        const end = row.querySelector('.end-time').value;

        scheduleData.push({
            day_of_week: toggle.dataset.day,
            is_active: toggle.checked ? 1 : 0,
            start_time: start,
            end_time: end
        });
    });

    const token = localStorage.getItem('token');
    showLoadingState(true);

    fetch('/HomeService/backend/api/update-schedule.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schedule: scheduleData })
    })
        .then(res => res.json())
        .then(data => {
            showLoadingState(false);
            if (data.success) {
                showNotification('Schedule updated successfully', 'success');
            } else {
                showNotification(data.message || 'Failed to update schedule', 'error');
            }
        })
        .catch(err => {
            showLoadingState(false);
            console.error(err);
            showNotification('Error saving schedule', 'error');
        });
}

// Hook into page switch to load schedule
const originalSwitchPage = window.switchPage; // Backup existing
window.switchPage = function (pageId) {
    if (pageId === 'schedule') {
        loadSchedule();
    } else if (pageId === 'transactions') {
        loadTransactions();
    } else if (pageId === 'notifications') {
        if (typeof loadNotificationsPage === 'function') loadNotificationsPage();
    } else if (pageId === 'calendar') {
        if (typeof loadCalendarPage === 'function') loadCalendarPage();
    } else if (pageId === 'my-reviews') {
        if (typeof loadProviderReviews === 'function') loadProviderReviews();
    }

    // Call original logic (duplicated here since `switchPage` is defined in scope but easy to just replicate basic logic or assume global)
    // Re-implementing basic switch logic to be safe since `originalSwitchPage` reference might be tricky with hoisting

    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) selectedPage.classList.add('active');

    const activeNavItem = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');
};

// --- Transaction History ---
function loadTransactions() {
    const content = document.getElementById('transactionsContent');
    if (!content) return;

    content.innerHTML = '<p class="empty-state">Loading transactions...</p>';

    const token = localStorage.getItem('token');
    fetch('/HomeService/backend/api/get-transactions.php', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderTransactions(data.transactions);
            } else {
                content.innerHTML = '<p class="empty-state">Failed to load transactions.</p>';
            }
        })
        .catch(err => {
            console.error(err);
            content.innerHTML = '<p class="empty-state">Error loading transactions.</p>';
        });
}


function renderTransactions(transactions) {
    const content = document.getElementById('transactionsContent');
    if (!content) return;

    if (!transactions || transactions.length === 0) {
        content.innerHTML = '<p class="empty-state">No completed transactions found.</p>';
        return;
    }

    let html = `
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background:#f9fafb; text-align:left; border-bottom: 2px solid #e5e7eb;">
                        <th style="padding:15px; color: #4b5563; font-weight: 600;">Date</th>
                        <th style="padding:15px; color: #4b5563; font-weight: 600;">Service</th>
                        <th style="padding:15px; color: #4b5563; font-weight: 600;">Provider</th>
                        <th style="padding:15px; color: #4b5563; font-weight: 600; text-align: right;">Amount</th>
                        <th style="padding:15px; color: #4b5563; font-weight: 600; text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    transactions.forEach(t => {
        const date = new Date(t.booking_date).toLocaleDateString();
        const time = t.booking_time ? new Date('1970-01-01T' + t.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        html += `
            <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:15px;">
                    <div style="font-weight: 500;">${date}</div>
                    <div style="font-size: 0.85em; color: #9ca3af;">${time}</div>
                </td>
                <td style="padding:15px;">${t.service_name}</td>
                <td style="padding:15px;">${t.provider_name}</td>
                <td style="padding:15px; text-align: right; font-weight: bold; color: #10B981;">₹${parseFloat(t.total_amount).toFixed(2)}</td>
                <td style="padding:15px; text-align: center;">
                    <span style="background: #D1FAE5; color: #065F46; padding: 4px 8px; borderRadius: 4px; font-size: 0.85em;">Paid</span>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    content.innerHTML = html;
}

/* ==================== NOTIFICATIONS LOGIC ==================== */
let notificationPollInterval;
let lastSeenNotificationId = 0; // Track the latest ID to detect new ones

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Notifications
    initNotifications();
});

function initNotifications() {
    const bellWrapper = document.getElementById('notificationWrapper');
    const dropdown = document.getElementById('notificationDropdown');

    // Create Toast Container if not exists
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    if (!bellWrapper || !dropdown) return;

    // Toggle Dropdown
    bellWrapper.addEventListener('click', function (e) {
        // Prevent closing when clicking inside
        if (e.target.closest('.notification-dropdown')) return;

        e.stopPropagation();
        dropdown.classList.toggle('active');

        // If opening, fetch latest
        if (dropdown.classList.contains('active')) {
            fetchNotifications(false);  // Don't show toast on manual open
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!bellWrapper.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Initial Fetch (don't show toast on first load)
    fetchNotifications(false);

    // Start Polling (every 30 seconds)
    if (notificationPollInterval) clearInterval(notificationPollInterval);
    notificationPollInterval = setInterval(() => fetchNotifications(true), 5000); // Poll every 5 seconds
}

function fetchNotifications(allowToast = false) {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/HomeService/backend/api/get-notifications.php', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateNotificationUI(data.notifications, data.unread_count);

                // Check for new notifications to show Toast
                if (allowToast && data.notifications.length > 0) {
                    const latest = data.notifications[0];

                    // If it's different and newer than what we had, show it.
                    // Ensure numeric comparison to handle string IDs from backend
                    const latestId = parseInt(latest.id);
                    const lastId = parseInt(lastSeenNotificationId);

                    if (latestId > lastId) {
                        console.log('New notification detected!', latest);
                        const icon = getNotificationIcon(latest.type);
                        const title = getNotificationTitle(latest.type);
                        showToast(title, latest.message, icon, latest);

                        // Refresh Dashboard Data (Bookings, Requests, Stats)
                        console.log('Refreshing dashboard data...');
                        loadBookings();
                    }
                }

                if (data.notifications.length > 0) {
                    lastSeenNotificationId = data.notifications[0].id;
                }
            }
        })
        .catch(err => console.error('Error fetching notifications:', err));
}

function getNotificationIcon(type) {
    if (type.includes('booking')) return '📅';
    if (type.includes('cancel')) return '❌';
    if (type.includes('confirm')) return '✅';
    if (type.includes('complete')) return '🎉';
    if (type.includes('chat')) return '💬';
    if (type.includes('review')) return '⭐';
    if (type.includes('payment')) return '💰';
    if (type.includes('system')) return '🔔';
    return '🔔';
}

function getNotificationTitle(type) {
    if (type.includes('booking')) return 'Booking Update';
    if (type.includes('chat')) return 'New Message';
    if (type.includes('cancel')) return 'Booking Cancelled';
    if (type.includes('confirm')) return 'Booking Confirmed';
    return 'Notification';
}

function updateNotificationUI(notifications, unreadCount) {
    const badge = document.getElementById('notificationBadge');
    const dropdownList = document.getElementById('notificationList');
    const fullList = document.getElementById('fullNotificationList'); // The main page list
    const markAllBtn = document.getElementById('markAllReadBtn');

    // Update Badge & Mark All Button
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'block';
            if (markAllBtn) markAllBtn.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
            if (markAllBtn) markAllBtn.style.display = 'none';
        }
    }

    // Helper to generate HTML
    const generateHtml = (listElement) => {
        if (!notifications || notifications.length === 0) {
            listElement.innerHTML = '<li class="notification-empty" style="padding: 20px; text-align: center; color: #6b7280;">No notifications yet</li>';
            return;
        }

        listElement.innerHTML = '';
        notifications.forEach(notif => {
            const li = document.createElement('li');
            li.className = `notification-item ${notif.is_read == 0 ? 'unread' : ''}`;
            li.onclick = (e) => window.handleNotificationClick(notif.id, notif.type, notif.related_id); // Use global handler

            // Highlight unread
            if (notif.is_read == 0) {
                li.style.backgroundColor = '#eff6ff';
                li.style.borderLeft = '4px solid #3b82f6';
            } else {
                li.style.backgroundColor = '#fff';
                li.style.borderLeft = '4px solid transparent';
            }

            const date = new Date(notif.created_at);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const icon = getNotificationIcon(notif.type || 'system');

            li.innerHTML = `
                <div style="display:flex; gap:15px; align-items:flex-start; padding: 10px;">
                    <div style="font-size:1.5rem; line-height:1; min-width: 40px; text-align: center;">${icon}</div>
                    <div style="flex-grow: 1;">
                        <div class="notification-message" style="font-weight: ${notif.is_read == 0 ? '600' : '400'}; color: #1f2937;">${escapeHtml(notif.message)}</div>
                        <div class="notification-time" style="font-size:0.85rem; color:#9ca3af; margin-top:4px;">${timeStr}</div>
                    </div>
                     ${notif.is_read == 0 ? '<span style="width:10px; height:10px; background:#2563eb; border-radius:50%; display:inline-block; margin-top: 5px;"></span>' : ''}
                </div>
            `;
            listElement.appendChild(li);
        });
    };

    // Update Dropdown (limit to 5?)
    if (dropdownList) {
        // We can pass a sliced array if we want specific limit, or CSS handles scroll
        // For dropdown, maybe just top 5
        const recent = notifications.slice(0, 5);

        // Custom generation for dropdown (simpler)
        if (recent.length === 0) {
            dropdownList.innerHTML = '<li class="notification-empty">No notifications yet</li>';
        } else {
            dropdownList.innerHTML = '';
            recent.forEach(notif => {
                const li = document.createElement('li');
                li.className = `notification-item ${notif.is_read == 0 ? 'unread' : ''}`;
                li.onclick = (e) => window.handleNotificationClick(notif.id, notif.type, notif.related_id);

                const icon = getNotificationIcon(notif.type || 'system');
                const timeAgo = getTimeAgo(new Date(notif.created_at));

                li.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:flex-start;">
                        <div style="font-size:1.2rem;">${icon}</div>
                        <div>
                            <div class="notification-message">${escapeHtml(notif.message)}</div>
                            <div class="notification-time">${timeAgo}</div>
                        </div>
                    </div>
                 `;
                dropdownList.appendChild(li);
            });
        }
    }

    // Update Full List (Active page)
    if (fullList) {
        if (!notifications || notifications.length === 0) {
            fullList.innerHTML = '<div class="empty-state"><div style="font-size: 3rem; margin-bottom: 1rem;">🔔</div><h3>No Notifications</h3><p>You have no notifications yet.</p></div>';
            return;
        }

        fullList.innerHTML = '';
        notifications.forEach(notif => {
            const div = document.createElement('div');
            // Do NOT use booking-item class as it forces column layout (lines 720-732 in dashboard.css)
            div.className = `notification-item ${notif.is_read == 0 ? 'unread' : ''}`;
            div.onclick = (e) => window.handleNotificationClick(notif.id, notif.type, notif.related_id);

            // Inline styles to match bookings list + notification specifics
            let bg = '#fff';
            let borderLeft = '1px solid #e5e7eb'; // Default border

            if (notif.is_read == 0) {
                bg = '#eff6ff';
                borderLeft = '4px solid #3b82f6';
            }

            div.style.cssText = `
                padding: 16px; 
                margin-bottom: 0; 
                border: 1px solid #e5e7eb; 
                border-left: ${borderLeft}; 
                border-radius: 8px; 
                background: ${bg}; 
                cursor: pointer; 
                transition: transform 0.2s, box-shadow 0.2s;
                display: flex;
                flex-direction: row; /* Explicitly set to row */
                align-items: center;
                gap: 15px;
                text-align: left; /* Reset text align */
            `;

            const date = new Date(notif.created_at);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const icon = getNotificationIcon(notif.type || 'system');

            div.innerHTML = `
                <div style="font-size:1.5rem; line-height:1; min-width: 40px; text-align: center;">${icon}</div>
                <div style="flex-grow: 1;">
                    <div style="font-weight: ${notif.is_read == 0 ? '700' : '500'}; color: #1f2937; font-size: 1rem; margin-bottom: 4px;">${escapeHtml(notif.message)}</div>
                    <div style="font-size:0.85rem; color:#6b7280;">${timeStr}</div>
                </div>
                 ${notif.is_read == 0 ? '<span style="width:10px; height:10px; background:#2563eb; border-radius:50%; display:inline-block; margin-left: auto;"></span>' : ''}
            `;
            fullList.appendChild(div);
        });
    }
}

function showToast(title, message, icon, notification = null) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="event.stopPropagation(); this.parentElement.remove()">×</button>
    `;

    // Make toast clickable if notification object is provided
    if (notification) {
        toast.style.cursor = 'pointer';
        toast.onclick = (e) => {
            window.handleNotificationClick(notification.id, notification.type, notification.related_id);
            toast.remove();
        };
    }

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);
}


// Old handleNotificationClick removed. New one is defined below.

function markNotificationRead(id) {
    var token = localStorage.getItem('token');
    if (!token) return;
    fetch('/HomeService/backend/api/mark-notification-read.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_id: id })
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success) {
                if (typeof fetchNotifications === 'function') fetchNotifications(false);
                if (typeof loadNotificationsPage === 'function') loadNotificationsPage();
            }
        })
        .catch(function () { });
}

function markAllNotificationsRead() {
    var token = localStorage.getItem('token');
    if (!token) return;
    fetch('/HomeService/backend/api/mark-notification-read.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mark_all: true })
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success) {
                if (typeof fetchNotifications === 'function') fetchNotifications(false);
                if (typeof loadNotificationsPage === 'function') loadNotificationsPage();
            }
        })
        .catch(function () { });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== NOTIFICATIONS PAGE ====================
// ==================== NOTIFICATIONS PAGE ====================
function loadNotificationsPage() {
    // Simply fetch notifications, which will update the UI via updateNotificationUI
    // We pass 'false' to avoid showing a toast for every item on page load
    fetchNotifications(false);
}

function getTimeAgo(date) {
    var now = new Date();
    var diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}



// ==================== CALENDAR PAGE ====================
var calCurrentMonth = new Date().getMonth();
var calCurrentYear = new Date().getFullYear();
var calBookings = [];

function loadCalendarPage(month = null, year = null) {
    if (month !== null) calCurrentMonth = month;
    if (year !== null) calCurrentYear = year;

    var token = localStorage.getItem('token');

    // Update Header UI immediately
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    var label = document.getElementById('calMonthYear');
    if (label) label.textContent = monthNames[calCurrentMonth] + ' ' + calCurrentYear;

    if (!token) {
        renderCalendarGrid();
        return;
    }

    // Fetch data for specific month (month is 0-indexed in JS, but 1-indexed in MySQL normally? 
    // PHP intval($_GET['month']) usually expects 1-12.
    // Let's pass 1-based month to API.
    var apiMonth = calCurrentMonth + 1;

    fetch('/HomeService/backend/api/bookings.php?token=' + token + '&month=' + apiMonth + '&year=' + calCurrentYear)
        .then(function (r) { return r.json(); })
        .then(function (data) {
            calBookings = (data.success && data.bookings) ? data.bookings : [];
            renderCalendarGrid();
            renderCalendarUpcoming(); // Update simple list below too? OR maybe remove it if modal rules.
            // User said "Clicking a date opens a side panel or modal".
            // "Upcoming" list might still be useful as a summary.
        })
        .catch(function () {
            calBookings = [];
            renderCalendarGrid();
        });
}

// Helper for safe date parsing (Global scope for calendar functions)
function getBookingDateParts(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1, // 0-indexed
        day: parseInt(parts[2], 10)
    };
}

function renderCalendarGrid() {
    var grid = document.getElementById('calendarGrid');
    if (!grid) return;

    // Clear old days
    var oldDays = grid.querySelectorAll('.cal-day');
    oldDays.forEach(day => day.remove());

    var firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay(); // 0=Sun
    var daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
    var today = new Date();
    var isCurrentMonth = (today.getMonth() === calCurrentMonth && today.getFullYear() === calCurrentYear);

    // Group bookings by day
    var bookedDayMap = {};
    for (var b = 0; b < calBookings.length; b++) {
        var bk = calBookings[b];
        if (bk.booking_date) {
            const dateParts = getBookingDateParts(bk.booking_date);
            if (dateParts && dateParts.month === calCurrentMonth && dateParts.year === calCurrentYear) {
                var dayNum = dateParts.day;
                if (!bookedDayMap[dayNum]) bookedDayMap[dayNum] = [];
                bookedDayMap[dayNum].push(bk);
            }
        }
    }

    // Empty cells
    for (var e = 0; e < firstDay; e++) {
        var empty = document.createElement('div');
        empty.className = 'cal-day empty';
        grid.appendChild(empty);
    }

    // Days start
    for (var d = 1; d <= daysInMonth; d++) {
        var cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.style.cursor = 'pointer';

        // Cell Click
        cell.onclick = (function (day) {
            return function (e) {
                if (e) e.stopPropagation();
                openBookingDetails(day);
            }
        })(d);

        var dayNumber = document.createElement('span');
        dayNumber.className = 'cal-day-number';
        dayNumber.textContent = d;
        cell.appendChild(dayNumber);

        if (isCurrentMonth && d === today.getDate()) {
            cell.classList.add('today');
        }

        if (bookedDayMap[d]) {
            cell.classList.add('booked');

            var bookings = bookedDayMap[d];
            bookings.sort((a, b) => (a.booking_time || '00:00').localeCompare(b.booking_time || '00:00'));

            var maxEvents = 3;
            for (var s = 0; s < bookings.length && s < maxEvents; s++) {
                var bk = bookings[s];
                var row = document.createElement('div');
                row.className = 'cal-event-row status-' + bk.status;

                // Row Click
                row.onclick = (function (day) {
                    return function (e) {
                        e.stopPropagation();
                        openBookingDetails(day);
                    }
                })(d);

                var dot = document.createElement('div');
                dot.className = 'cal-event-dot';
                row.appendChild(dot);

                if (bk.booking_time) {
                    var timeSpan = document.createElement('span');
                    timeSpan.className = 'cal-event-time';
                    var timeParts = bk.booking_time.split(':');
                    timeSpan.textContent = timeParts[0] + ':' + timeParts[1];
                    row.appendChild(timeSpan);
                }

                var titleSpan = document.createElement('span');
                titleSpan.className = 'cal-event-title';
                titleSpan.textContent = (bk.service_name || 'Service').substring(0, 15);
                row.appendChild(titleSpan);

                cell.appendChild(row);
            }

            if (bookings.length > maxEvents) {
                var more = document.createElement('div');
                more.className = 'cal-more-tag';
                more.textContent = '+' + (bookings.length - maxEvents) + ' more';
                cell.appendChild(more);
            }
        }
        grid.appendChild(cell);
    }
}

function openBookingDetails(day) {
    console.log('Opening booking details for day:', day);
    var modal = document.getElementById('bookingDetailsModal');
    var list = document.getElementById('modalBookingsList');
    var title = document.getElementById('modalDateTitle');

    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    // Set date title
    var dateObj = new Date(calCurrentYear, calCurrentMonth, day);
    title.textContent = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Filter bookings - Use same date parsing as render
    // Helper must be available here too (create separate or inline)

    var bookings = calBookings.filter(b => {
        const parts = getBookingDateParts(b.booking_date);
        return parts && parts.day === day && parts.month === calCurrentMonth && parts.year === calCurrentYear;
    });

    console.log('Bookings found for day:', bookings.length);

    if (bookings.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 2rem 0;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📅</div>
                <p>No bookings scheduled for this day.</p>
            </div>`;
    } else {
        var html = '';
        bookings.forEach(bk => {
            var statusClass = bk.status === 'confirmed' ? 'status-confirmed'
                : bk.status === 'completed' ? 'status-completed'
                    : bk.status === 'cancelled' ? 'status-cancelled' : 'status-pending';

            var phoneLink = bk.customer_phone ? `<a href="tel:${bk.customer_phone}" style="color:#3b82f6; text-decoration:none;">${escapeHtml(bk.customer_phone)}</a>` : 'N/A';
            var emailLink = bk.customer_email ? `<a href="mailto:${bk.customer_email}" style="color:#3b82f6; text-decoration:none;">${escapeHtml(bk.customer_email)}</a>` : 'N/A';
            var mapLink = bk.customer_location ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bk.customer_location)}" target="_blank" style="color:#3b82f6; text-decoration:none;">${escapeHtml(bk.customer_location)}</a>` : 'Not specified';

            html += `
            <div class="modal-booking-item" style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:12px; background:#f9fafb;">
                <div class="modal-booking-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div>
                        <div style="font-weight:700; font-size:1.1rem; color:#111827;">${escapeHtml(bk.service_name)}</div>
                        <div style="font-size:0.9rem; color:#6b7280;">${escapeHtml(bk.service_category || '')}</div>
                        <div style="font-size:0.8rem; color:#9ca3af; margin-top:2px;">ID: #${bk.id}</div>
                    </div>
                    <div style="text-align:right;">
                        <span class="status-badge ${statusClass}" style="margin-bottom:4px; display:inline-block;">${bk.status}</span>
                        <div style="font-weight:600; color:#374151;">🕒 ${escapeHtml(bk.booking_time || 'TBD')}</div>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.9rem; border-top:1px solid #e5e7eb; padding-top:12px;">
                    <div>
                        <div style="color:#6b7280; font-size:0.8rem; margin-bottom:2px;">Customer</div>
                        <div style="font-weight:600; color:#374151;">${escapeHtml(bk.customer_name || 'Unknown')}</div>
                        <div style="margin-top:2px;">📞 ${phoneLink}</div>
                        <div style="margin-top:2px;">✉️ ${emailLink}</div>
                    </div>
                    <div>
                        <div style="color:#6b7280; font-size:0.8rem; margin-bottom:2px;">Location</div>
                        <div>📍 ${mapLink}</div>
                        <div style="color:#6b7280; font-size:0.8rem; margin-top:8px; margin-bottom:2px;">Payment</div>
                        <div style="font-weight:700; color:#10b981;">₹${parseFloat(bk.total_amount).toFixed(2)}</div>
                    </div>
                </div>

                ${bk.description ? `
                <div style="margin-top:12px; background:white; padding:10px; border-radius:6px; border:1px solid #e5e7eb;">
                    <div style="color:#6b7280; font-size:0.8rem; margin-bottom:2px;">Notes</div>
                    <div style="color:#4b5563; font-style:italic;">"${escapeHtml(bk.description)}"</div>
                </div>` : ''}
            </div>`;
        });
        list.innerHTML = html;
    }

    // Force display
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closeBookingDetailsModal() {
    var modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        // Clear list to prevent stale data briefly showing next time
        // document.getElementById('modalBookingsList').innerHTML = '';
    }
} window.onclick = function (event) {
    var modal = document.getElementById('bookingDetailsModal');
    if (event.target == modal) {
        closeBookingDetailsModal();
    }
}

function renderCalendarUpcoming() {
    // Optional: Keep duplicate list below or remove. User requirement didn't explicitly delete it.
    // But "No fake reviews, no mock data" implies accuracy.
    // Let's keep it as an implementation detal, but filter strictly from calBookings (which is now only 1 month).
    // So this will show "Upcoming bookings IN THIS MONTH".
    var container = document.getElementById('calendarBookings');
    if (!container) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = calBookings.filter(b => new Date(b.booking_date) >= today);
    upcoming.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

    // ... same render logic as before ...
    // To save tokens, I'll trust the previous renderCalendarUpcoming logic is mostly fine, 
    // BUT I should overwrite it to use the new filtered array correctly.

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="empty-state">No upcoming bookings for this month.</p>';
        return;
    }

    var html = '';
    // Limit to 5
    upcoming.slice(0, 5).forEach(bk => {
        var dateObj = new Date(bk.booking_date);
        var dateStr = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        var timeStr = bk.booking_time ? bk.booking_time.substring(0, 5) : '';
        var dayOfMonth = dateObj.getDate();

        var statusClass = bk.status === 'confirmed' ? 'status-confirmed'
            : bk.status === 'completed' ? 'status-completed'
                : bk.status === 'cancelled' ? 'status-cancelled' : 'status-pending';

        var phoneLink = bk.customer_phone ? `<a href="tel:${bk.customer_phone}" onclick="event.stopPropagation()" style="color:#3b82f6; text-decoration:none;">${escapeHtml(bk.customer_phone)}</a>` : 'N/A';
        var emailLink = bk.customer_email ? `<a href="mailto:${bk.customer_email}" onclick="event.stopPropagation()" style="color:#3b82f6; text-decoration:none;">${escapeHtml(bk.customer_email)}</a>` : 'N/A';
        var mapLink = bk.customer_location ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bk.customer_location)}" target="_blank" onclick="event.stopPropagation()" style="color:#3b82f6; text-decoration:none;">${escapeHtml(bk.customer_location)}</a>` : 'Not specified';

        html += `
        <div class="booking-item" onclick="openBookingDetails(${dayOfMonth})" style="padding: 16px; margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
             <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                <div>
                    <h4 style="margin:0; font-size:1.1rem; color:#1f2937; font-weight: 700;">${escapeHtml(bk.service_name)}</h4>
                    <div style="color:#6b7280; font-size: 0.9rem; margin-top: 2px;">${dateStr} • ${timeStr}</div>
                </div>
                <div style="text-align:right;">
                    <span class="status-badge ${statusClass}">${bk.status}</span>
                    <div style="font-size:0.75rem; color:#9ca3af; margin-top: 4px;">#${bk.id}</div>
                </div>
             </div>

             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                 <div>
                    <div style="font-size:0.75rem; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:4px;">Customer</div>
                    <div style="font-weight:600; color:#374151;">${escapeHtml(bk.customer_name)}</div>
                    <div style="font-size:0.9rem; margin-top:2px;">📞 ${phoneLink}</div>
                    <div style="font-size:0.9rem; margin-top:2px;">✉️ ${emailLink}</div>
                 </div>
                 <div>
                    <div style="font-size:0.75rem; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:4px;">Location</div>
                    <div style="font-size:0.9rem;">📍 ${mapLink}</div>
                    
                    <div style="font-size:0.75rem; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-top:8px; margin-bottom:4px;">Amount</div>
                    <div style="font-weight:700; color:#10b981; font-size:1rem;">₹${parseFloat(bk.total_amount).toFixed(2)}</div>
                 </div>
             </div>
        </div>`;
    });

    container.innerHTML = html;
}

// Calendar Navigation
document.addEventListener('DOMContentLoaded', function () {
    var prevBtn = document.getElementById('calPrev');
    var nextBtn = document.getElementById('calNext');
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            calCurrentMonth--;
            if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
            loadCalendarPage(calCurrentMonth, calCurrentYear);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            calCurrentMonth++;
            if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
            loadCalendarPage(calCurrentMonth, calCurrentYear);
        });
    }
    // Initial Render
    // loadCalendarPage(); // Called by switchPage or direct load? 
    // dashboard.js structure calls specific load functions when switching tabs. 
    // We should rely on switchPage('calendar') calling loadCalendarPage().
});

// ==================== MY REVIEWS PAGE ====================
function loadProviderReviews() {
    var statsContainer = document.getElementById('reviewsStats');
    var contentContainer = document.getElementById('reviewsContent');
    if (!contentContainer) return;

    var token = localStorage.getItem('token');
    if (!token) {
        if (statsContainer) statsContainer.innerHTML = '';
        contentContainer.innerHTML = '<p class="empty-state">Please log in to view reviews.</p>';
        return;
    }

    // Show loading state
    contentContainer.innerHTML = '<div class="loading-spinner"></div>';

    fetch('/HomeService/backend/api/get-provider-reviews.php?token=' + encodeURIComponent(token), {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
        .then(function (r) {
            if (!r.ok) throw new Error('Network response was not ok: ' + r.statusText);
            return r.json();
        })
        .then(function (data) {
            if (!data.success) {
                if (statsContainer) statsContainer.innerHTML = '';
                contentContainer.innerHTML = '<div class="empty-state">' + (data.message || 'No reviews found.') + '</div>';
                return;
            }

            // Render stats
            if (statsContainer) {
                var reviews = data.reviews || [];
                var fiveStarCount = 0;

                if (typeof data.five_star_count !== 'undefined') {
                    fiveStarCount = data.five_star_count;
                } else {
                    // Fallback
                    for (var i = 0; i < reviews.length; i++) {
                        if (parseFloat(reviews[i].rating) >= 5) fiveStarCount++;
                    }
                }

                // Calculate real average from fetched reviews if needed, or use backend provided
                var avg = data.avg_rating || '0.0';

                statsContainer.innerHTML =
                    '<div class="stat-card">' +
                    '<div class="stat-icon" style="background:rgba(251, 191, 36, 0.1); color:#f59e0b;">⭐</div>' +
                    '<div class="stat-content">' +
                    '<h3>' + avg + '</h3>' +
                    '<p>Average Rating</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                    '<div class="stat-icon" style="background:rgba(59, 130, 246, 0.1); color:#3b82f6;">📝</div>' +
                    '<div class="stat-content">' +
                    '<h3>' + (data.total_reviews || 0) + '</h3>' +
                    '<p>Total Reviews</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                    '<div class="stat-icon" style="background:rgba(16, 185, 129, 0.1); color:#10b981;">👍</div>' +
                    '<div class="stat-content">' +
                    '<h3>' + fiveStarCount + '</h3>' +
                    '<p>5-Star Reviews</p>' +
                    '</div>' +
                    '</div>';
            }

            // Render reviews list
            if (!data.reviews || data.reviews.length === 0) {
                contentContainer.innerHTML = `
                    <div class="empty-state">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
                        <h3>No Reviews Yet</h3>
                        <p>You haven't received any reviews yet. Complete more jobs to get rated!</p>
                    </div>`;
                return;
            }

            var html = '';
            for (var j = 0; j < data.reviews.length; j++) {
                var rv = data.reviews[j];
                var ratingNum = parseFloat(rv.rating) || 0;

                // Star generation
                var starsHtml = '<div class="star-rating-display">';
                for (var k = 1; k <= 5; k++) {
                    if (k <= Math.round(ratingNum)) starsHtml += '<span style="color:#fbbf24">★</span>';
                    else starsHtml += '<span style="color:#d1d5db">★</span>';
                }
                starsHtml += '</div>';

                var date = new Date(rv.created_at);
                var dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                // Customer Initials
                var customerName = escapeHtml(rv.customer_name || 'Customer');
                var initials = customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                html += `
                <div class="review-card" style="background:white; padding:1.5rem; border-radius:12px; margin-bottom:1rem; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                        <div style="display:flex; gap:1rem; align-items:center;">
                            <div style="width:48px; height:48px; background:#e0e7ff; color:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.1rem;">${initials}</div>
                            <div>
                                <h4 style="margin:0; color:#1f2937; font-size:1rem;">${customerName}</h4>
                                <p style="margin:0; color:#6b7280; font-size:0.85rem;">${escapeHtml(rv.service_name || 'Service')}</p>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            ${starsHtml}
                            <div style="font-size:0.8rem; color:#9ca3af; margin-top:4px;">${dateStr}</div>
                        </div>
                    </div>
                    ${rv.comment ? `<div style="background:#f9fafb; padding:1rem; border-radius:8px; color:#4b5563; font-style:italic; line-height:1.5;">"${escapeHtml(rv.comment)}"</div>` : ''}
                </div>`;
            }
            contentContainer.innerHTML = html;
        })
        .catch(function (err) {
            console.error('Error loading reviews:', err);
            if (statsContainer) statsContainer.innerHTML = '';
            contentContainer.innerHTML = '<div class="empty-state"><p>Failed to load reviews.</p></div>';
        });
}

// Report Modal Logic
function openReportModal(bookingId) {
    const modal = document.getElementById('reportModal');
    if (modal) {
        document.getElementById('reportBookingId').value = bookingId;
        modal.style.display = 'block';
    }
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('reportForm');
        if (form) form.reset();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const bookingId = document.getElementById('reportBookingId').value;
            const issueType = document.getElementById('reportIssueType').value;
            const description = document.getElementById('reportDescription').value;

            if (!issueType || !description) {
                showNotification('Please fill in all fields', 'warning');
                return;
            }

            const token = localStorage.getItem('token');
            showLoadingState(true);

            fetch('/HomeService/backend/api/report-issue.php', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    booking_id: bookingId,
                    issue_type: issueType,
                    description: description
                })
            })
                .then(res => res.json())
                .then(data => {
                    showLoadingState(false);
                    if (data.success) {
                        showNotification('Report submitted successfully', 'success');
                        closeReportModal();
                    } else {
                        showNotification(data.error || 'Failed to submit report', 'error');
                    }
                })
                .catch(err => {
                    showLoadingState(false);
                    console.error(err);
                    showNotification('Error submitting report', 'error');
                });
        });
    }
});

// Receipt Modal Logic
// Review Modal Logic
function reviewBooking(bookingId) {
    const modal = document.getElementById('reviewModal');
    const bookingIdInput = document.getElementById('reviewBookingId');
    if (modal && bookingIdInput) {
        bookingIdInput.value = bookingId;
        modal.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const bookingId = document.getElementById('reviewBookingId').value;
            const rating = document.querySelector('input[name="rating"]:checked')?.value;
            const comment = document.getElementById('reviewComment').value;

            if (!rating) {
                showNotification('Please select a rating', 'warning');
                return;
            }

            const token = localStorage.getItem('token');
            showLoadingState(true);

            fetch('/HomeService/backend/api/submit-review.php', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    booking_id: bookingId,
                    rating: rating,
                    comment: comment
                })
            })
                .then(res => res.json())
                .then(data => {
                    showLoadingState(false);
                    if (data.success) {
                        showNotification('Review submitted!', 'success');
                        document.getElementById('reviewModal').style.display = 'none';
                        loadBookings(); // Refresh list to update button state
                    } else {
                        showNotification(data.message || 'Failed to submit review', 'error');
                    }
                })
                .catch(err => {
                    showLoadingState(false);
                    console.error(err);
                    showNotification('Error submitting review', 'error');
                });
        });
    }
});

function openReceiptModal(bookingId) {
    const token = localStorage.getItem('token');
    showLoadingState(true);

    fetch(`/HomeService/backend/api/bookings.php?user_type=customer`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(res => res.json())
        .then(data => {
            showLoadingState(false);
            if (data.success) {
                const booking = data.bookings.find(b => b.id == bookingId);
                if (booking) {
                    populateReceipt(booking);
                } else {
                    showNotification('Booking details not found', 'error');
                }
            } else {
                showNotification('Failed to load bookings', 'error');
            }
        })
        .catch(err => {
            showLoadingState(false);
            console.error(err);
            showNotification('Error loading receipt', 'error');
        });
}

function populateReceipt(booking) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    // Basic Info
    document.getElementById('receiptId').textContent = '#' + booking.id;
    document.getElementById('receiptDate').textContent = new Date(booking.booking_date).toLocaleDateString() + ' ' + (booking.booking_time ? booking.booking_time.substring(0, 5) : '');
    document.getElementById('receiptStatus').textContent = booking.status;
    document.getElementById('receiptAmount').textContent = '₹' + parseFloat(booking.total_amount).toFixed(2);

    // Service Info
    document.getElementById('receiptService').textContent = booking.service_name;
    document.getElementById('receiptCategory').textContent = booking.service_category || 'General Service';

    // Duration & Payment
    const hourlyRate = parseFloat(booking.hourly_rate || 0);
    const totalAmount = parseFloat(booking.total_amount || 0);
    let duration = booking.duration ? parseFloat(booking.duration) : 0;

    // Fallback calculation if duration missing but we have rate
    if (!duration && hourlyRate > 0) {
        duration = totalAmount / hourlyRate;
    }
    // Fallback default
    if (!duration) duration = 1;

    // Update Receipt Info Section
    document.getElementById('receiptPaymentMethod').textContent = (booking.payment_method || 'Cash').toUpperCase();
    const txnId = booking.transaction_id || 'N/A';
    // Add Transaction ID line if not exists or update it
    let txnRow = document.getElementById('receiptTxnRow');
    if (!txnRow) {
        const infoDiv = document.getElementById('receiptPaymentMethod').parentNode.parentNode;
        txnRow = document.createElement('p');
        txnRow.id = 'receiptTxnRow';
        txnRow.style.cssText = "margin: 5px 0 0; font-size: 14px;";
        txnRow.innerHTML = `<strong>Txn ID:</strong> <span id="receiptTxnId"></span>`;
        infoDiv.insertBefore(txnRow, document.getElementById('receiptStatus').parentNode);
    }
    document.getElementById('receiptTxnId').textContent = txnId;

    // Service Info & Line Items
    document.getElementById('receiptService').textContent = booking.service_name;
    document.getElementById('receiptCategory').textContent = booking.service_category || 'General Service';

    document.getElementById('receiptDuration').innerHTML = `
        <div style="margin-top:4px; font-size:13px; color:#4b5563;">
            Rate: ₹${hourlyRate.toFixed(2)} / hr
        </div>
        <div style="font-size:13px; color:#4b5563;">
            Duration: ${duration.toFixed(1)} hrs
        </div>
    `;

    // Provider Info
    document.getElementById('receiptProvider').textContent = booking.provider_name || 'Assigned Provider';
    let contactInfo = booking.provider_email || '';
    if (booking.provider_phone) contactInfo += (contactInfo ? ' / ' : '') + booking.provider_phone;
    document.getElementById('receiptProviderContact').textContent = contactInfo;

    // Customer Info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('receiptCustomerName').textContent = user.full_name || 'Customer';
    document.getElementById('receiptCustomerLocation').textContent = booking.customer_location || user.location || 'Not specified';

    // Notes
    const notesSec = document.getElementById('receiptNotesSection');
    if (booking.description) {
        document.getElementById('receiptNotes').textContent = booking.description;
        notesSec.style.display = 'block';
    } else {
        notesSec.style.display = 'none';
    }

    modal.style.display = 'block';
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

function printReceipt() {
    const printContent = document.getElementById('receiptArea').innerHTML;

    // Create a hidden iframe or new window for printing to avoid reloading
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Receipt #' + document.getElementById('receiptId').textContent + '</title>');
    printWindow.document.write('</head><body style="font-family: sans-serif;">');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// Ensure initNotifications is called (it's already called in the main DOMContentLoaded block at line ~1887)
// We removed the duplicate DOMContentLoaded block that was here.
// Ensure initNotifications is called (it's already called in the main DOMContentLoaded block at line ~1887)
// We removed the duplicate DOMContentLoaded block that was here.
window.handleNotificationClick = function (id, type, relatedId) {
    console.log('Notification clicked:', id, type, relatedId);

    // Navigation Logic (Immediate)
    if (['booking_status', 'booking_new', 'booking_update', 'booking_confirmed', 'booking'].includes(type) && relatedId) {
        if (typeof switchPage === 'function') {
            switchPage('bookings');
            // Give time for view to switch before opening modal
            setTimeout(() => {
                if (typeof openBookingDetailsById === 'function') {
                    openBookingDetailsById(relatedId);
                }
            }, 500);
        } else {
            window.location.href = 'customer-dashboard.html#bookings';
        }
    }
    else if (type === 'review' || type === 'rating') {
        if (typeof switchPage === 'function') switchPage('my-reviews');
    }
    else if (type === 'chat_message') {
        if (typeof openChat === 'function') openChat(relatedId || id, 'Chat'); // Fallback to ID if related missing? relatedId should be sender_id/booking_id
    }
    else if (type === 'payment') {
        if (typeof switchPage === 'function') switchPage('earnings'); // Or transactions
    }

    // Mark as read (Background)
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/HomeService/backend/api/mark-notification-read.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notification_id: id })
        })
            .then(() => {
                console.log('Notification marked read');
                // Optimistically update UI if we are still on the same page/view
                const row = document.getElementById('notif-' + id);
                if (row) {
                    row.classList.remove('unread');
                    row.style.background = '#fff';
                    row.style.borderLeft = '1px solid #e5e7eb';
                }
                loadNotifications(); // Refresh counters
            })
            .catch(console.error);
    }
};

// New function to open details by ID (independent of calendar)
// New function to open details by ID (independent of calendar)
function openBookingDetailsById(bookingId) {
    // Retry finding the element a few times since loadBookings is async
    let attempts = 0;
    const maxAttempts = 5;

    function findAndScroll() {
        const existingItem = document.querySelector(`.booking-item[data-id="${bookingId}"]`);

        if (existingItem) {
            existingItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            existingItem.style.transition = "all 0.5s ease";
            existingItem.style.border = "2px solid #3b82f6";
            existingItem.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.4)";

            setTimeout(() => {
                existingItem.style.border = "1px solid #e5e7eb";
                existingItem.style.boxShadow = "none";
            }, 3000);
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(findAndScroll, 500); // Retry every 500ms
        }
    }

    findAndScroll();
}

function showSingleBookingModal(booking) {
    // Reuses the modal structure from calendar but populates directly
    var modal = document.getElementById('bookingDetailsModal');
    var list = document.getElementById('modalBookingsList');
    var title = document.getElementById('modalDateTitle');

    if (!modal) return;

    title.textContent = "Booking Details #" + booking.id;

    var statusClass = booking.status === 'confirmed' ? 'status-confirmed'
        : booking.status === 'completed' ? 'status-completed'
            : booking.status === 'cancelled' ? 'status-cancelled' : 'status-pending';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCustomer = user.user_type === 'customer';

    // Dynamic fields based on user type
    const otherPartyLabel = isCustomer ? 'Provider' : 'Customer';
    const otherPartyName = isCustomer ? (booking.provider_name || 'Pending Assignment') : (booking.customer_name || 'Unknown');
    const contactLabel = isCustomer ? 'Contact' : 'Customer Contact';

    // For contact, provider sees customer phone/email. Customer sees provider email (or phone if available).
    let otherPartyContact = '';
    if (isCustomer) {
        otherPartyContact = booking.provider_email || 'N/A';
        if (booking.provider_phone) otherPartyContact += ` / ${booking.provider_phone}`;
    } else {
        otherPartyContact = booking.customer_phone || 'N/A';
    }

    var phoneLink = otherPartyContact !== 'N/A' ? `<a href="tel:${otherPartyContact}" style="color:#3b82f6;">${escapeHtml(otherPartyContact)}</a>` : 'N/A';
    var mapLink = booking.customer_location ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.customer_location)}" target="_blank" style="color:#3b82f6;">${escapeHtml(booking.customer_location)}</a>` : 'Not specified';

    var html = `
    <div class="modal-booking-item" style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; background:#f9fafb;">
        <div class="modal-booking-header" style="display:flex; justify-content:space-between; margin-bottom:12px;">
            <div>
                <div style="font-weight:700; font-size:1.1rem;">${escapeHtml(booking.service_name)}</div>
                <div style="font-size:0.9rem; color:#6b7280;">${escapeHtml(booking.service_category || '')}</div>
            </div>
            <div style="text-align:right;">
                <span class="status-badge ${statusClass}">${booking.status}</span>
                <div style="font-weight:600;">🕒 ${escapeHtml(booking.booking_time || 'TBD')}</div>
                <div style="font-size:0.8rem; color:#6b7280;">${new Date(booking.booking_date).toLocaleDateString()}</div>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.9rem; border-top:1px solid #e5e7eb; padding-top:12px;">
            <div>
                <div style="color:#6b7280; font-size:0.8rem; text-transform:uppercase;">${otherPartyLabel}</div>
                <div style="font-weight:600;">${escapeHtml(otherPartyName)}</div>
                <div style="margin-top:4px;">📞 ${phoneLink}</div>
            </div>
            <div>
                <div style="color:#6b7280; font-size:0.8rem; text-transform:uppercase;">Location</div>
                <div>📍 ${mapLink}</div>
                <div style="color:#6b7280; font-size:0.8rem; margin-top:8px; text-transform:uppercase;">Amount</div>
                <div style="font-weight:700; color:#10b981;">₹${parseFloat(booking.total_amount || 0).toFixed(2)}</div>
            </div>
        </div>
        ${booking.description ? `<div style="margin-top:12px; font-style:italic; color:#4b5563;">"${escapeHtml(booking.description)}"</div>` : ''}
        
        <div style="margin-top:16px; border-top:1px solid #e5e7eb; padding-top:12px; text-align:right;">
            ${isCustomer && booking.status === 'completed' ? `<button class="btn btn-sm btn-primary" onclick="openReceiptModal(${booking.id})">View Receipt</button>` : ''}
            ${isCustomer && ['completed', 'cancelled'].includes(booking.status) ? `<button class="btn btn-sm btn-danger" onclick="openReportModal(${booking.id})">Report Issue</button>` : ''}
        </div>
    </div>`;

    list.innerHTML = html;

    // Force display flex to override any previous display:none
    modal.style.display = 'flex';
    // Add active class for animations if any
    modal.classList.add('active');
}

function closeBookingDetailsModal() {
    var modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

/* ==================== MODAL HELPERS ==================== */
window.closeBookingDetailsModal = function () {
    const modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// Global Click Listener for Modals (Click Outside to Close)
window.addEventListener('click', function (event) {
    const bookingModal = document.getElementById('bookingDetailsModal');
    if (bookingModal && event.target === bookingModal) {
        closeBookingDetailsModal();
    }

    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal && event.target === receiptModal) {
        if (typeof closeReceiptModal === 'function') closeReceiptModal();
    }
});
