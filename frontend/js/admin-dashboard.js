// Check if user is logged in and is admin
document.addEventListener('DOMContentLoaded', function () {
    const user = localStorage.getItem('user');

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(user);
    if (userData.user_type !== 'admin') {
        alert('Unauthorized access: Redirecting to home...');
        window.location.href = 'index.html';
        return;
    }

    // Initialize Dashboard
    document.getElementById('adminName').textContent = userData.full_name;
    document.getElementById('settingsName').value = userData.full_name;
    document.getElementById('settingsEmail').value = userData.email;

    setupNavigation();
    setupFilters(); // Initialize filter buttons
    loadStats();
    loadUsers();
    loadAllBookings();
    loadReports();
    loadAllReviews();
    loadAdminServices();
});

// Setup Filter Buttons
function setupFilters() {
    // User Filters
    const userFilters = document.querySelectorAll('#userTypeFilters .filter-btn');
    userFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all siblings
            userFilters.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            // Trigger filter
            filterUsers();
        });
    });

    // Booking Filters
    const bookingFilters = document.querySelectorAll('#bookingStatusFilters .filter-btn');
    bookingFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all siblings
            bookingFilters.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            // Trigger filter
            filterBookings();
        });
    });
}

// Navigation Handling
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Show page
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        });
    });
}

function logout() {
    if (confirm('Logout from Admin Panel?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

// Data Loading
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/dashboard-stats.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.total_users;
            document.getElementById('totalProviders').textContent = data.stats.total_providers;
            document.getElementById('totalBookings').textContent = data.stats.total_bookings;
            document.getElementById('totalRevenue').textContent = '₹' + parseFloat(data.stats.total_revenue || 0).toFixed(2);
            document.getElementById('activeServices').textContent = data.stats.active_services || 0;
            document.getElementById('pendingReports').textContent = data.stats.pending_reports || 0;

            // Update sidebar badges
            updateSidebarBadge('badge-users', data.stats.total_users);
            updateSidebarBadge('badge-bookings', data.stats.total_bookings);
            updateSidebarBadge('badge-reports', data.stats.pending_reports);
            updateSidebarBadge('badge-services', data.stats.active_services);

            // Render Charts if data exists. Check for one of the new keys
            if (data.stats.user_distribution) {
                renderCharts(data.stats);
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('totalUsers').textContent = '-';
        document.getElementById('totalProviders').textContent = '-';
        document.getElementById('totalBookings').textContent = '-';
        document.getElementById('totalRevenue').textContent = '-';
        showNotification('Failed to load dashboard statistics', 'error');
    }
}

// Helper to update sidebar badge visibility and count
function updateSidebarBadge(id, count) {
    const badge = document.getElementById(id);
    if (!badge) return;

    const num = parseInt(count) || 0;
    if (num > 0) {
        badge.textContent = num > 99 ? '99+' : num;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderCharts(stats) {
    // 1. User Distribution (Pie Chart)
    const userDistCanvas = document.getElementById('userDistChart');
    if (userDistCanvas) {
        const existingChart = Chart.getChart(userDistCanvas);
        if (existingChart) existingChart.destroy();

        const userCtx = userDistCanvas.getContext('2d');
        const userLabels = stats.user_distribution.map(item => item.user_type.charAt(0).toUpperCase() + item.user_type.slice(1));
        const userCounts = stats.user_distribution.map(item => item.count);

        new Chart(userCtx, {
            type: 'pie',
            data: {
                labels: userLabels,
                datasets: [{
                    data: userCounts,
                    backgroundColor: ['#3B82F6', '#10B981', '#6B7280'], // Blue, Green, Gray
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }
                }
            }
        });
    }

    // 2. Earnings by Service (Bar Chart)
    const earningsCanvas = document.getElementById('earningsChart');
    if (earningsCanvas) {
        const existingChart = Chart.getChart(earningsCanvas);
        if (existingChart) existingChart.destroy();

        const earningsCtx = earningsCanvas.getContext('2d');
        const earningsLabels = stats.earnings_by_service.map(item => item.service_name);
        const earningsData = stats.earnings_by_service.map(item => item.earnings);

        new Chart(earningsCtx, {
            type: 'bar',
            data: {
                labels: earningsLabels,
                datasets: [{
                    label: 'Earnings (₹)',
                    data: earningsData,
                    backgroundColor: '#10B981', // Green
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }, // Hiding legend for single series
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: function (val) { return '₹' + val; } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Booking Status (Doughnut Chart)
    const statusCanvas = document.getElementById('statusChart');
    if (statusCanvas) {
        const existingChart = Chart.getChart(statusCanvas);
        if (existingChart) existingChart.destroy();

        const statusCtx = statusCanvas.getContext('2d');
        const statusColors = {
            'pending': '#F59E0B',
            'confirmed': '#3B82F6',
            'completed': '#10B981',
            'cancelled': '#EF4444'
        };

        const statusLabels = stats.status_distribution.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1));
        const statusCounts = stats.status_distribution.map(item => item.count);
        const backgroundColors = stats.status_distribution.map(item => statusColors[item.status] || '#9CA3AF');

        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusCounts,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }
                }
            }
        });
    }

    // 4. Service Popularity (Horizontal Bar Chart)
    const popularityCanvas = document.getElementById('popularityChart');
    if (popularityCanvas) {
        const existingChart = Chart.getChart(popularityCanvas);
        if (existingChart) existingChart.destroy();

        const popCtx = popularityCanvas.getContext('2d');
        const popLabels = (stats.service_popularity || []).map(item => item.service_name);
        const popCounts = (stats.service_popularity || []).map(item => item.count);

        new Chart(popCtx, {
            type: 'bar',
            data: {
                labels: popLabels,
                datasets: [{
                    label: 'Bookings',
                    data: popCounts,
                    backgroundColor: '#8B5CF6', // Purple
                    borderRadius: 4,
                    barPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 } },
                    y: { grid: { display: false } }
                }
            }
        });
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner-sm"></div> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/get-users.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();

        if (data.success) {
            allUsers = data.users; // Cache for filtering
            renderUsers(allUsers);
        } else {
            tbody.innerHTML = '<tr><td colspan="7">Failed to load users</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error loading users</td></tr>';
    }
}

async function loadAllBookings() {
    const tbody = document.getElementById('bookingsList');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner-sm"></div> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/get-all-bookings.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();

        if (data.success) {
            allBookings = data.bookings; // Cache for filtering
            renderBookings(allBookings);
        } else {
            tbody.innerHTML = '<tr><td colspan="7">Failed to load bookings</td></tr>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error loading bookings</td></tr>';
    }
}

// Helper Variables for filtering
let allUsers = [];
let allBookings = [];

// Rendering Functions
function renderUsers(users) {
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const active = user.is_active == 1;
        const statusClass = active ? 'active' : 'inactive';
        const statusText = active ? 'Active' : 'Inactive';

        // Verification Badge for Providers
        let verifiedBadge = '';
        let verifyBtn = '';

        if (user.user_type === 'provider') {
            const isVerified = user.is_verified == 1;
            verifiedBadge = isVerified
                ? '<span class="admin-badge" style="background-color: #10B981;">✓ Verified</span>'
                : '<span class="admin-badge" style="background-color: #9CA3AF;">Unverified</span>';

            const btnText = isVerified ? 'Unverify' : 'Verify';
            const btnClass = isVerified ? 'cancel-btn' : 'verify-btn'; // We'll add verify-btn style
            const newStatus = isVerified ? 0 : 1;

            verifyBtn = `<button class="action-btn ${btnClass}" onclick="toggleProviderVerification(${user.id}, ${newStatus})" style="margin-left: 5px;">${btnText}</button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${user.id}</td>
            <td>${user.full_name} ${verifiedBadge}</td>
            <td>${user.email}</td>
            <td>${user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}</td>
            <td><span class="status-badge ${statusClass}" onclick="toggleUserStatus(${user.id}, ${user.is_active})" style="cursor: pointer;">${statusText}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Delete</button>
                ${verifyBtn}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function toggleProviderVerification(userId, newStatus) {
    const action = newStatus ? 'verify' : 'unverify';
    if (!confirm(`Are you sure you want to ${action} this provider?`)) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/verify-provider.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ user_id: userId, is_verified: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Provider ${action}ed successfully`, 'success');
            loadUsers(); // Reload list to update UI
        } else {
            showNotification(data.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error connecting to server', 'error');
    }
}

// Make globally available
window.toggleProviderVerification = toggleProviderVerification;

function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsList');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No bookings found</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${booking.id}</td>
            <td>${booking.service_name}</td>
            <td>${booking.customer_name}</td>
            <td>${booking.provider_name}</td>
            <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
            <td><span class="status-badge ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
            <td>₹${parseFloat(booking.total_amount).toFixed(2)}</td>
            <td>
                ${booking.status === 'pending' || booking.status === 'confirmed' ?
                `<button class="action-btn cancel-btn" onclick="cancelBooking(${booking.id})">Cancel</button>` :
                '<span class="text-muted">-</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtering Logic
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();

    // Get active filter button
    const activeBtn = document.querySelector('#userTypeFilters .filter-btn.active');
    const typeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

    const filtered = allUsers.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || user.user_type === typeFilter;
        return matchesSearch && matchesType;
    });

    renderUsers(filtered);
}

function filterBookings() {
    // Get active filter button
    const activeBtn = document.querySelector('#bookingStatusFilters .filter-btn.active');
    const statusFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

    const filtered = allBookings.filter(booking => {
        return statusFilter === 'all' || booking.status === statusFilter;
    });

    renderBookings(filtered);
}

// Actions
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus ? 0 : 1;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/update-user-status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ user_id: userId, is_active: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('User updated successfully', 'success');
            loadUsers();
        } else {
            showNotification('Failed to update user', 'error');
        }
    } catch (error) {
        showNotification('Error updating user status', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/delete-user.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('User deleted successfully', 'success');
            loadUsers();
        } else {
            showNotification('Failed to delete user', 'error');
        }
    } catch (error) {
        showNotification('Error deleting user', 'error');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/update-booking-status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ booking_id: bookingId, status: 'cancelled' })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Booking cancelled successfully', 'success');
            loadAllBookings();
        } else {
            showNotification('Failed to cancel booking', 'error');
        }
    } catch (error) {
        showNotification('Error cancelling booking', 'error');
    }
}


window.cancelBooking = cancelBooking;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;

function showNotification(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000;`;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6');

    toast.style.cssText = `
        background-color: ${bgColor}; color: white; padding: 16px 24px;
        border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        opacity: 0; transform: translateX(20px); transition: all 0.3s ease;
        display: flex; align-items: center; gap: 10px; min-width: 300px;
        font-family: inherit; font-size: 0.95rem;
    `;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Reports Logic
async function loadReports() {
    console.log('loadReports called');
    const tbody = document.getElementById('reportsList');
    if (!tbody) {
        console.error('reportsList not found');
        return;
    }
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner-sm"></div> Fetching reports (debug)...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            tbody.innerHTML = '<tr><td colspan="7">Please log in again.</td></tr>';
            return;
        }

        console.log('Fetching from API...');
        const response = await fetch('../backend/api/admin/get-reports.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('Response status:', response.status);

        const text = await response.text();
        console.log('Response text:', text.substring(0, 50));

        try {
            const data = JSON.parse(text);
            if (data.success) {
                renderReports(data.reports);
            } else {
                tbody.innerHTML = '<tr><td colspan="7">Failed: ' + (data.message || 'Unknown error') + '</td></tr>';
            }
        } catch (e) {
            console.error('JSON Parse Error:', e, text);
            tbody.innerHTML = '<tr><td colspan="7">Server Error: ' + text.substring(0, 100) + '...</td></tr>';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        tbody.innerHTML = '<tr><td colspan="7">Network Error: ' + error.message + '</td></tr>';
    }
}

function renderReports(reports) {
    const tbody = document.getElementById('reportsList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!reports || reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No reports found</td></tr>';
        return;
    }

    reports.forEach(r => {
        const tr = document.createElement('tr');
        const dateStr = new Date(r.created_at).toLocaleDateString();

        let statusBadge = '';
        if (r.status === 'pending') statusBadge = '<span class="status-badge" style="background:#F59E0B; color:white;">Pending</span>';
        else if (r.status === 'resolved') statusBadge = '<span class="status-badge" style="background:#10B981; color:white;">Resolved</span>';
        else if (r.status === 'dismissed') statusBadge = '<span class="status-badge" style="background:#9CA3AF; color:white;">Dismissed</span>';

        // Action Buttons
        let actions = '';
        if (r.status === 'pending') {
            actions = `
                <button class="action-btn" style="background:#10B981; color:white;" onclick="updateReportStatus(${r.id}, 'resolved')">Resolve</button>
                <button class="action-btn" style="background:#EF4444; color:white;" onclick="updateReportStatus(${r.id}, 'dismissed')">Dismiss</button>
            `;
        } else {
            actions = '<span class="text-muted">-</span>';
        }

        tr.innerHTML = `
            <td>#${r.id}</td>
            <td>${dateStr}</td>
            <td>
                <div><small>ID: #${r.booking_id}</small></div>
                <div>${r.service_name || 'Service'}</div>
            </td>
            <td>
                <div style="font-weight:bold;">${r.issue_type}</div>
                <div style="font-size:0.85rem; color:#6b7280; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.description}">${r.description}</div>
            </td>
            <td>
                <div>${r.customer_name}</div>
                <div style="font-size:0.8rem; color:#9ca3af;">${r.customer_email}</div>
            </td>
            <td>${statusBadge}</td>
            <td>${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateReportStatus(reportId, status) {
    if (!confirm(`Mark this report as ${status}?`)) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/update-report-status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ report_id: reportId, status: status })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Report marked as ${status}`, 'success');
            loadReports();
        } else {
            showNotification(data.message || 'Failed to update report', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error updating report', 'error');
    }
}

window.updateReportStatus = updateReportStatus;

// Reviews Logic
async function loadAllReviews() {
    console.log('loadAllReviews called');
    const tbody = document.getElementById('reviewsList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner-sm"></div> Fetching reviews...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/get-all-reviews.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data.success) {
                renderReviews(data.reviews);
            } else {
                tbody.innerHTML = '<tr><td colspan="7">Failed: ' + (data.message || 'Unknown error') + '</td></tr>';
            }
        } catch (e) {
            console.error('JSON Parse Error:', e, text);
            tbody.innerHTML = '<tr><td colspan="7">Server Error during parse</td></tr>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        tbody.innerHTML = '<tr><td colspan="7">Network Error</td></tr>';
    }
}

function renderReviews(reviews) {
    const tbody = document.getElementById('reviewsList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!reviews || reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No reviews found</td></tr>';
        return;
    }

    reviews.forEach(r => {
        const tr = document.createElement('tr');
        const dateStr = new Date(r.created_at).toLocaleDateString();

        // Stars
        let stars = '';
        const rating = parseFloat(r.rating);
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '⭐' : '☆';
        }

        tr.innerHTML = `
            <td>#${r.id}</td>
            <td>${dateStr}</td>
            <td>
                <div>${r.provider_name}</div>
                <div style="font-size:0.8rem; color:#9ca3af;">${r.service_name}</div>
            </td>
            <td>${r.customer_name}</td>
            <td><div style="color:#f59e0b;">${stars}</div></td>
            <td>
                <div style="font-size:0.9rem; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.comment || ''}">${r.comment || '<span class="text-muted">No comment</span>'}</div>
            </td>
            <td>
                <button class="action-btn" style="background:#EF4444; color:white;" onclick="deleteReview(${r.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review? This will recalculate the provider\'s rating.')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/delete-review.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ review_id: id })
        });

        const text = await response.text();
        const data = JSON.parse(text);

        if (data.success) {
            showNotification('Review deleted successfully', 'success');
            loadAllReviews();
        } else {
            showNotification(data.message || 'Failed to delete review', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error deleting review', 'error');
    }
}

window.deleteReview = deleteReview;
window.loadAllReviews = loadAllReviews;

// ==========================================
// SERVICES MANAGEMENT
// ==========================================

let adminServicesCache = [];

async function loadAdminServices() {
    const list = document.getElementById('servicesList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner-sm"></div> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('../backend/api/admin/get-services.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();

        if (data.success) {
            adminServicesCache = data.services;
            renderAdminServices();
        } else {
            list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Failed to load services: ${data.message}</td></tr>`;
        }
    } catch (err) {
        console.error('Error loading admin services:', err);
        list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error loading services.</td></tr>`;
    }
}

function renderAdminServices() {
    const list = document.getElementById('servicesList');
    if (!list) return;

    if (adminServicesCache.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center;">No services found.</td></tr>';
        return;
    }

    let html = '';
    adminServicesCache.forEach(service => {
        html += `
            <tr>
                <td>#${service.id}</td>
                <td style="font-size: 1.5rem;">${service.icon || '🛠️'}</td>
                <td><span class="provider-badge">${escapeHtml(service.category)}</span></td>
                <td style="font-weight: 600;">${escapeHtml(service.name)}</td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(service.description)}">
                    ${escapeHtml(service.description)}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEditServiceModal(${service.id})">Edit</button>
                    <button class="btn btn-sm btn-danger margin-left-sm" onclick="deleteService(${service.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    list.innerHTML = html;
}

function openAddServiceModal() {
    document.getElementById('addServiceForm').reset();
    document.getElementById('addServiceModal').classList.add('active');
    document.getElementById('addServiceModal').style.display = 'flex';
}

function openEditServiceModal(id) {
    const service = adminServicesCache.find(s => s.id == id);
    if (!service) return;

    document.getElementById('editServiceId').value = service.id;
    document.getElementById('editServiceName').value = service.name;
    document.getElementById('editServiceCategory').value = service.category;
    document.getElementById('editServiceDescription').value = service.description;
    document.getElementById('editServiceIcon').value = service.icon || '';

    document.getElementById('editServiceModal').classList.add('active');
    document.getElementById('editServiceModal').style.display = 'flex';
}

function closeServiceModal(type) {
    const modal = document.getElementById(type + 'ServiceModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

async function saveService(type) {
    const isEdit = type === 'edit';
    const formPrefix = isEdit ? 'editService' : 'addService';

    // Explicitly grab the submit button from the event if possible, or query it
    const form = document.getElementById(formPrefix + 'Form');
    const submitBtn = form.querySelector('button[type="submit"]');

    const payload = {
        name: document.getElementById(formPrefix + 'Name').value,
        category: document.getElementById(formPrefix + 'Category').value,
        description: document.getElementById(formPrefix + 'Description').value,
        icon: document.getElementById(formPrefix + 'Icon').value
    };

    if (isEdit) {
        payload.id = document.getElementById('editServiceId').value;
    }

    const endpoint = isEdit ? 'update-service.php' : 'add-service.php';
    const token = localStorage.getItem('token');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    try {
        const response = await fetch(`../backend/api/admin/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(isEdit ? 'Service updated successfully' : 'Service added successfully', 'success');
            closeServiceModal(type);
            loadAdminServices(); // Refresh list
            loadStats(); // Update dashboard stats
        } else {
            showNotification(data.message || 'Action failed', 'error');
        }
    } catch (err) {
        console.error('Error saving service:', err);
        showNotification('Network error saving service', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Add Service';
        }
    }
}

async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service? This may affect providers offering it.')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('../backend/api/admin/delete-service.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ id: id })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Service deleted successfully', 'success');
            loadAdminServices(); // Refresh list
            loadStats(); // Update dashboard stats
        } else {
            showNotification(data.message || 'Failed to delete service', 'error');
        }
    } catch (err) {
        console.error('Error deleting service:', err);
        showNotification('Network error deleting service', 'error');
    }
}

// Expose functions globally for HTML triggers
window.openAddServiceModal = openAddServiceModal;
window.openEditServiceModal = openEditServiceModal;
window.closeServiceModal = closeServiceModal;
window.saveService = saveService;
window.deleteService = deleteService;
window.loadAdminServices = loadAdminServices;

// Helper Function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
