// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = localStorage.getItem('user');
    
    if (!user) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(user);
    
    console.log('User data from localStorage:', userData);
    
    // Populate user information (handle both snake_case from backend and camelCase from old data)
    const fullName = userData.full_name || userData.fullName || 'User';
    const userType = userData.user_type || userData.userType || 'customer';
    
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('settingsName').value = fullName;
    document.getElementById('settingsEmail').value = userData.email;
    document.getElementById('settingsPhone').value = userData.phone || '';

    // Setup navigation click handlers
    setupNavigation();
});

// Setup sidebar navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
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
    
    // This is a basic template. In a real app, you would fetch data from your API
    if (userType === 'customer') {
        const upcomingElement = document.getElementById('upcomingCount');
        const completedElement = document.getElementById('completedCount');
        const spentElement = document.getElementById('totalSpent');
        
        if (upcomingElement) upcomingElement.textContent = '0';
        if (completedElement) completedElement.textContent = '0';
        if (spentElement) spentElement.textContent = '$0';
    } else {
        const pendingElement = document.getElementById('pendingCount');
        const completedElement = document.getElementById('completedCount');
        const ratingElement = document.getElementById('rating');
        const earningsElement = document.getElementById('earnings');
        
        if (pendingElement) pendingElement.textContent = '0';
        if (completedElement) completedElement.textContent = '0';
        if (ratingElement) ratingElement.textContent = '4.8';
        if (earningsElement) earningsElement.textContent = '$0';
    }
}

// Load dashboard data on page load
loadDashboardData();
