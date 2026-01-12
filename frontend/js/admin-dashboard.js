// Check if user is logged in and is admin
document.addEventListener('DOMContentLoaded', function () {
    const user = localStorage.getItem('user');

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(user);
    if (userData.user_type !== 'admin') {
        alert('Unauthorized access');
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
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

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
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

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
        tbody.innerHTML = '<tr><td colspan="7">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        const statusClass = user.is_active != 0 ? 'status-confirmed' : 'status-cancelled'; // Using dashboard.css classes (confirmed=green, cancelled=red)
        const statusText = user.is_active != 0 ? '✅ Active' : '❌ Inactive';
        const badgeClass = user.is_active != 0 ? 'verified-badge' : 'status-badge status-cancelled'; // Use verified badge/status badge

        tr.innerHTML = `
            <td>#${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}</td>
            <td><span class="${badgeClass}" onclick="toggleUserStatus(${user.id}, ${user.is_active})" style="cursor: pointer;">${statusText}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})" title="Delete">🗑️ Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsList');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No bookings found</td></tr>';
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
            <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
            <td>₹${parseFloat(booking.total_amount).toFixed(2)}</td>
            <td>
                ${booking.status === 'pending' || booking.status === 'confirmed' ?
                `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${booking.id})" title="Cancel Booking">❌ Cancel</button>` :
                ''}
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
            // showNotification('User updated successfully', 'success'); // Assuming notification function exists
            alert('User updated successfully'); // Fallback
            loadUsers();
        } else {
            alert('Failed to update user: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user status');
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
            alert('User deleted successfully');
            loadUsers();
        } else {
            alert('Failed to delete user: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
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
            alert('Booking cancelled successfully');
            loadAllBookings();
        } else {
            alert('Failed to cancel booking: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking');
    }
}

// Ensure cancelBooking is globally available or handled in render
window.cancelBooking = cancelBooking;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;

