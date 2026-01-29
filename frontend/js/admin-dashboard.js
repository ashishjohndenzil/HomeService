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
    loadStats();
    loadUsers();
    loadAllBookings();
});

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

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}</td>
            <td><span class="status-badge ${statusClass}" onclick="toggleUserStatus(${user.id}, ${user.is_active})" style="cursor: pointer;">${statusText}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

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
    const typeFilter = document.getElementById('userTypeFilter').value;

    const filtered = allUsers.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || user.user_type === typeFilter;
        return matchesSearch && matchesType;
    });

    renderUsers(filtered);
}

function filterBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter').value;

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
