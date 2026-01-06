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

    console.log('User data from localStorage:', userData);

    // Populate user information (handle both snake_case from backend and camelCase from old data)
    const fullName = userData.full_name || userData.fullName || 'User';

    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('settingsName').value = fullName;
    document.getElementById('settingsEmail').value = userData.email;
    document.getElementById('settingsPhone').value = userData.phone || '';

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
                            <span class="category-badge">${service.category || service.service_name}</span>
                        </div>
                        ${verifiedBadge}
                    </div>
                    <div class="service-card-details">
                        <p><strong>Experience:</strong> ${service.experience_years || 0} years</p>
                        <p><strong>Rate:</strong> ₹${parseFloat(service.hourly_rate || 0).toFixed(2)}/hour</p>
                        <p><strong>Rating:</strong> ${ratingStars} (${service.total_reviews || 0} reviews)</p>
                    </div>
                    <div class="service-card-actions">
                        <button class="btn btn-sm btn-secondary" type="button" onclick="editService(${service.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" type="button" onclick="deleteService(${service.id})">Delete</button>
                    </div>
                `;
                    servicesContent.appendChild(serviceCard);
                });
            } else {
                servicesContent.innerHTML = '<p class="empty-state">No services added yet. <a href="#" onclick="showAddServiceModal()">Add your first service</a></p>';
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

    const dateObj = new Date(booking.booking_date + ' ' + booking.booking_time);
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
            </div>
            <div class="booking-actions">
                ${booking.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${booking.id})">Cancel Booking</button>` : ''}
                ${booking.status === 'completed' ? `<button class="btn btn-sm btn-primary" onclick="reviewBooking(${booking.id})">Leave Review</button>` : ''}
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
            </div>
            <div class="booking-actions">
                ${booking.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="updateBookingStatus(${booking.id}, 'confirmed')">Confirm</button>
                    <button class="btn btn-sm btn-danger" onclick="updateBookingStatus(${booking.id}, 'cancelled')">Reject</button>
                ` : ''}
                ${booking.status === 'confirmed' ? `
                    <button class="btn btn-sm btn-success" onclick="updateBookingStatus(${booking.id}, 'completed')">Mark Complete</button>
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
        const earningsElement = document.getElementById('earnings');

        if (pendingElement) pendingElement.textContent = '0';
        if (completedElement) completedElement.textContent = '0';
        if (ratingElement) ratingElement.textContent = '4.8';
        if (earningsElement) earningsElement.textContent = '₹0';
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
function reviewBooking(bookingId) {
    console.log('Reviewing booking:', bookingId);
    // TODO: Implement review modal
    alert('Review feature coming soon!');
}

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
function showAddServiceModal() {
    alert('Add Service feature coming soon!');
}

function editService(serviceId) {
    alert('Edit Service feature coming soon!');
}

function deleteService(serviceId) {
    if (confirm('Are you sure you want to delete this service?')) {
        alert('Delete Service feature coming soon!');
    }
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

// Load dashboard data on page load
loadDashboardData();
