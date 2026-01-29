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

    // Set Profile Image
    if (userData.profile_image) {
        const img = document.getElementById('avatarImage');
        const initials = document.getElementById('avatarInitials');
        if (img && initials) {
            img.src = userData.profile_image; // Ensure backend returns full or correct relative path
            img.style.display = 'block';
            initials.style.display = 'none';
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

    fetch('../backend/api/services.php')
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
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (selected === 'all') {
            renderCustomerServices(customerServicesCache);
        } else {
            const filtered = customerServicesCache.filter(s => (s.category || s.name) === selected);
            renderCustomerServices(filtered);
        }
    });
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
            <button class="btn btn-primary btn-sm" type="button" data-service-id="${service.id}">Book Now</button>
        `;

        // Add event listener to the button
        const bookBtn = serviceCard.querySelector('button');
        bookBtn.addEventListener('click', function () {
            if (typeof window.openBookingModal === 'function') {
                window.openBookingModal(service.id);
            } else {
                console.error('openBookingModal function not found');
            }
        });

        servicesContent.appendChild(serviceCard);
    });
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

    fetch('../backend/api/provider-services.php?token=' + encodeURIComponent(token), {
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

    let url = '../backend/api/bookings.php?token=' + encodeURIComponent(token);
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
                <button class="btn btn-sm btn-primary" style="background-color: #3b82f6; border-color: #3b82f6;" onclick="openChat(${booking.provider_user_id}, '${booking.provider_name}')">Chat</button>
                ${booking.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${booking.id})">Cancel Booking</button>` : ''}
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
        const response = await fetch('../backend/api/update-booking-status.php', {
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

// Handle Review Submit
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const bookingId = document.getElementById('reviewBookingId').value;
            const comment = document.getElementById('reviewComment').value;
            const ratingInput = document.querySelector('input[name="rating"]:checked');

            if (!ratingInput) {
                showNotification('Please select a rating', 'warning');
                return;
            }

            const rating = ratingInput.value;

            const token = localStorage.getItem('token');
            showLoadingState(true);

            fetch('../backend/api/submit-review.php', {
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
                    showLoadingState(false);
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
                    showLoadingState(false);
                    console.error(err);
                    showNotification('Error submitting review', 'error');
                });
        });
    }
});

// Update booking status (provider)
async function updateBookingStatus(bookingId, newStatus) {
    const action = newStatus === 'cancelled' ? 'reject' : newStatus;
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;

    const user = JSON.parse(localStorage.getItem('user'));

    try {
        showLoadingState(true);
        const response = await fetch('../backend/api/update-booking-status.php', {
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

    // Load available service types from backend
    fetch('../backend/api/services.php') // Using public services endpoint to get categories
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('newServiceId');
            select.innerHTML = '<option value="">Select a service...</option>';

            const services = data.services || data.data || [];
            // Remove duplicates if any
            const uniqueServices = Array.from(new Map(services.map(s => [s.name, s])).values());

            uniqueServices.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id; // Correct ID reference
                option.textContent = s.name;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error loading service types:', err));

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

            fetch('../backend/api/add-service.php', {
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

            fetch('../backend/api/update-service.php', { // Reusing update-service.php
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

    fetch('../backend/api/delete-service.php', {
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

function saveProfile() {
    const name = document.getElementById('settingsName').value;
    const phone = document.getElementById('settingsPhone').value;
    const location = document.getElementById('settingsLocation').value;

    const token = localStorage.getItem('token');

    // Removed the original validation for fullName and phone, as per the provided snippet.
    // If validation is still desired, it should be re-added here, potentially including location.

    showLoadingState(true);

    fetch('../backend/api/update-profile.php', {
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

    fetch('../backend/api/upload-profile-image.php', {
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

    fetch('../backend/api/get-schedule.php', {
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

    fetch('../backend/api/get-messages.php?contact_id=' + contactId, {
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

    fetch('../backend/api/send-message.php', {
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

    fetch('../backend/api/update-schedule.php', {
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
