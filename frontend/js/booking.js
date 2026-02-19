/**
 * Booking Modal System
 * Include this script in any page that needs booking functionality
 */

// Function declarations first (hoisted)




// Create booking modal HTML
function createBookingModal() {
    const modalHTML = `
        <div id="bookingModal" class="booking-modal" style="display: none;">
            <div class="booking-modal-content">
                <div class="booking-modal-header">
                    <h2 id="modalTitle">Book a Service</h2>
                    <button type="button" class="close-btn" onclick="closeBookingModal()">&times;</button>
                </div>
                <div class="booking-modal-body">
                    <div id="booking-step-form">
                        <form id="bookingForm">
                            <div class="form-group">
                                <label for="serviceSelect">Service</label>
                                <select id="serviceSelect" name="service_id" required>
                                    <option value="">Select a service...</option>
                                </select>
                            </div>

                            <div class="form-group" style="position: relative;">
                                <label for="bookingAddress">Service Address</label>
                                <textarea id="bookingAddress" name="address" placeholder="Start typing your address..." rows="3" required autocomplete="off"></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="bookingDate">Date</label>
                                    <input type="date" id="bookingDate" name="booking_date" required>
                                </div>
                                <div class="form-group">
                                    <label for="bookingTime">Time Slot</label>
                                    <select id="bookingTime" name="booking_time" required>
                                        <option value="">Select a time...</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="description">Description (Optional)</label>
                                <textarea id="description" name="description" placeholder="Describe your service needs..." rows="3"></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="duration">Duration (Hours)</label>
                                    <input type="number" id="duration" name="duration" min="1" step="0.5" value="1" required>
                                </div>
                                <div class="form-group">
                                    <label for="estimatedAmount">Estimated Amount (₹)</label>
                                    <input type="number" id="estimatedAmount" name="total_amount" readonly style="background-color: #f3f4f6; cursor: not-allowed;">
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="closeBookingModal()">Cancel</button>
                                <button type="button" class="btn btn-primary" id="proceedToPayBtn">Proceed to Pay</button>
                            </div>
                        </form>
                    </div>

                    <div id="booking-step-payment" style="display:none; text-align:center;">
                        <h3>Scan & Pay</h3>
                        <p>Scan the QR code with any UPI App (GPay, PhonePe, Paytm)</p>
                        
                        <div id="qrCodeContainer" style="margin: 20px 0;">
                            <img id="paymentQrCode" src="" alt="Payment QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 10px;">
                        </div>

                        <div class="amount-display" style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px;">
                            Amount: ₹<span id="payAmountDisplay">0.00</span>
                        </div>

                        <div class="form-group" style="text-align: left;">
                            <label>Transaction ID / UTR <span style="color:red">*</span></label>
                            <input type="text" id="transactionId" placeholder="Enter 12-digit UTR number" required style="width:100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <small id="txn-feedback" style="display:block; margin-top:5px; font-size:0.85rem; color:#666; transition: color 0.3s;">Enter the UTR number from your payment app.</small>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="button" id="backToBookingBtn" class="btn btn-secondary" style="flex:1;">Back</button>
                            <button type="button" id="confirmPaymentBtn" class="btn btn-primary" style="flex:1;">Confirm Payment</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to page if not already exists
    if (!document.getElementById('bookingModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupBookingForm();
        if (typeof setupModalClickHandler === 'function') {
            setupModalClickHandler();
        }

        // Explicitly attach close listener
        const closeBtn = document.querySelector('#bookingModal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeBookingModal);
        }
    }
}

// Load services into dropdown
function loadServices() {
    return fetch('/HomeService/backend/api/services.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            return response.json();
        })
        .then(data => {
            // Handle both API response formats
            const services = data.services || data.data || [];

            if (data.success && services.length > 0) {
                const select = document.getElementById('serviceSelect');
                if (select) {
                    select.innerHTML = '<option value="">Select a service...</option>';
                    services.forEach(service => {
                        const option = document.createElement('option');
                        option.value = service.id;
                        option.textContent = service.name;
                        option.dataset.rate = service.average_rate; // Store average rate
                        select.appendChild(option);
                    });
                }
            }
            return services;
        })
        .catch(error => {
            console.error('Error loading services:', error);
            const select = document.getElementById('serviceSelect');
            if (select) {
                select.innerHTML = '<option value="">Error loading services</option>';
            }
            return [];
        });
}



// Setup booking form submission and interactions
function setupBookingForm() {
    const serviceSelect = document.getElementById('serviceSelect');
    const durationInput = document.getElementById('duration');
    const totalInput = document.getElementById('estimatedAmount');

    // Payment UI Elements
    const bookingFormDiv = document.getElementById('booking-step-form');
    const paymentDiv = document.getElementById('booking-step-payment');
    const proceedBtn = document.getElementById('proceedToPayBtn');
    const backBtn = document.getElementById('backToBookingBtn');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const transactionInput = document.getElementById('transactionId');
    const payAmountDisplay = document.getElementById('payAmountDisplay');
    const qrImage = document.getElementById('paymentQrCode');

    // Merchant Config - UPDATE THIS
    const MERCHANT_UPI_ID = 'ashishyt100@oksbi';
    const MERCHANT_NAME = 'HomeService';

    // Initialize Autocomplete (Global Version)
    if (typeof window.initLocationAutocomplete === 'function') {
        window.initLocationAutocomplete('bookingAddress');
    }

    // Listeners attached below
    if (serviceSelect) {
        serviceSelect.addEventListener('change', () => { calculateTotal(); updateTimeSlots(); });
    }
    if (durationInput) {
        durationInput.addEventListener('input', calculateTotal);
    }
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.addEventListener('change', updateTimeSlots);
    }



    // --- PAYMENT HANDLERS ---

    if (proceedBtn) {
        proceedBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Validate inputs
            const address = document.getElementById('bookingAddress').value;
            const date = document.getElementById('bookingDate').value;
            const time = document.getElementById('bookingTime').value;

            if (!serviceSelect.value || !address || !date || !time) {
                showBookingNotification('Please fill all required fields.', 'error');
                return;
            }

            const amount = calculateTotal();
            if (amount <= 0) {
                showBookingNotification('Invalid amount.', 'error');
                return;
            }

            // Generate QR
            const upiLink = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&tn=BookingPayment&cu=INR`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;

            qrImage.src = qrApiUrl;
            payAmountDisplay.textContent = amount.toFixed(2);

            // Show Payment Step
            bookingFormDiv.style.display = 'none';
            paymentDiv.style.display = 'block';
            document.getElementById('modalTitle').textContent = 'Complete Payment';

            // Hide header close button to force back button use? Optional.
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            paymentDiv.style.display = 'none';
            bookingFormDiv.style.display = 'block';
            document.getElementById('modalTitle').textContent = 'Book a Service';
        });
    }

    if (confirmBtn && transactionInput) {
        // Real-time validation
        transactionInput.addEventListener('input', () => {
            const val = transactionInput.value.trim();
            const feedback = document.getElementById('txn-feedback');

            // Rules
            const isLengthOk = val.length >= 8 && val.length <= 30;
            const isNotZero = !/^0+$/.test(val);
            const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(val);

            if (val.length === 0) {
                transactionInput.style.borderColor = '#ddd';
                if (feedback) { feedback.textContent = 'Enter the UTR number from your payment app.'; feedback.style.color = '#666'; }
                confirmBtn.disabled = true;
                return;
            }

            if (!isLengthOk) {
                if (feedback) { feedback.textContent = 'Transaction ID must be between 8 and 30 characters.'; feedback.style.color = '#EF4444'; }
                transactionInput.style.borderColor = '#EF4444';
                confirmBtn.disabled = true;
            } else if (!isNotZero) {
                if (feedback) { feedback.textContent = 'Transaction ID cannot be all zeros.'; feedback.style.color = '#EF4444'; }
                transactionInput.style.borderColor = '#EF4444';
                confirmBtn.disabled = true;
            } else if (!isAlphanumeric) {
                if (feedback) { feedback.textContent = 'Transaction ID must be alphanumeric (letters and numbers only).'; feedback.style.color = '#EF4444'; }
                transactionInput.style.borderColor = '#EF4444';
                confirmBtn.disabled = true;
            } else {
                if (feedback) { feedback.textContent = 'Looks good!'; feedback.style.color = '#10B981'; }
                transactionInput.style.borderColor = '#10B981';
                confirmBtn.disabled = false;
            }
        });

        confirmBtn.addEventListener('click', async () => {
            const transactionId = transactionInput.value.trim();

            // Final check
            if (transactionId.length < 8 || /^0+$/.test(transactionId)) {
                showBookingNotification('Please enter a valid Transaction ID', 'error');
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Verifying...';

            await submitBookingRaw(transactionId);

            // Re-enable button (safe to do even if success/closed)
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Payment';
        });
    }
}

// New helper to submit without form event default logic
async function submitBookingRaw(transactionId) {
    console.log('submitBookingRaw called with:', transactionId);
    const token = localStorage.getItem('token');
    const form = document.getElementById('bookingForm');
    const formData = new FormData(form);

    // Sanitize date to YYYY-MM-DD ensuring backend compatibility
    let rawDate = formData.get('booking_date');

    if (rawDate && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            rawDate = d.toISOString().split('T')[0];
        } else {
            showBookingNotification('Invalid date selected. Please pick a date from the calendar.', 'error');
            // Reset button state since we return early
            const confirmBtn = document.getElementById('confirmPaymentBtn');
            if (confirmBtn) {
                confirmBtn.textContent = 'Confirm Payment';
                confirmBtn.disabled = false;
            }
            return;
        }
    }

    const bookingData = {
        service_id: parseInt(formData.get('service_id')),
        booking_date: rawDate,
        booking_time: formData.get('booking_time'),
        description: formData.get('description'),
        address: formData.get('address'),
        total_amount: parseFloat(document.getElementById('estimatedAmount').value),
        transaction_id: transactionId
    };

    console.log('Sending Booking Data:', bookingData);

    try {
        const res = await fetch('/HomeService/backend/api/create-booking.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        console.log('Response Status:', res.status);
        const data = await res.json();
        console.log('Response Data:', data);

        if (res.ok) {
            console.log('Booking Success');

            // Close modal FIRST
            console.log('Closing Modal...');
            closeBookingModal();

            // Then show notification
            showBookingNotification('Booking Successful! Pending Verification.', 'success');

            // Refresh logic
            if (typeof loadCustomerBookings === 'function') {
                console.log('Refreshing bookings...');
                loadCustomerBookings();
            }
        } else {
            console.warn('Booking Failed', data);
            // Handle specific errors
            const errorMsg = (data.error || '').toLowerCase();
            if (res.status === 400 && errorMsg.includes('already booked')) {
                showBookingNotification('Someone just booked this slot! Please choose another time.', 'error');

                // Reset UI to form step
                document.getElementById('booking-step-payment').style.display = 'none';
                document.getElementById('booking-step-form').style.display = 'block';
                document.getElementById('modalTitle').textContent = 'Book a Service';

                // Refresh slots
                if (typeof window.updateTimeSlots === 'function') {
                    window.updateTimeSlots();
                }
                document.getElementById('bookingTime').value = '';
            } else {
                showBookingNotification(data.error || 'Booking Failed', 'error');
            }
        }
    } catch (err) {
        console.error('Submission Error:', err);
        showBookingNotification('Network Error', 'error');
    } finally {
        // Find button and reset if it's still stuck (except on success where we close)
        // Actually, button reset handles in event listener, but we can do it here too if needed?
        // The event listener waits for await submitBookingRaw to finish.
    }
}


// Open booking modal with optional service and provider preset
async function openBookingModal(serviceId = null, providerId = null) {
    const user = localStorage.getItem('user');

    if (!user) {
        if (confirm('Please login to book a service. Redirecting to login page...')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const userData = JSON.parse(user);
    if (userData.user_type === 'provider') {
        showBookingNotification('Service providers cannot book services.', 'error');
        return;
    }

    createBookingModal();
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    // Set minimum date to today (Local Time)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.setAttribute('min', today);
        dateInput.value = today;
        dateInput.dispatchEvent(new Event('change'));
    }

    // Pre-fill address if available in user profile
    const addressInput = document.getElementById('bookingAddress');
    if (addressInput && userData.location) {
        addressInput.value = userData.location;
    }

    // Load services
    await loadServices();

    // Preset service if provided
    if (serviceId) {
        const serviceSelect = document.getElementById('serviceSelect');
        if (serviceSelect) {
            serviceSelect.value = serviceId;
            // Trigger calculation
            serviceSelect.dispatchEvent(new Event('change'));

            // Explicitly update time slots after setting service
            // We need to find the updateTimeSlots function scope or trigger it via the date input which has the listener?
            // Actually, the listener above we just added on serviceSelect will trigger updateTimeSlots via the 'change' event dispatch!
            // But let's be safe and ensure the date input listener logic fires too if needed, 
            // though the service select change event is sufficient now.
        } else {
            // If no service pre-selected, we still might want to load slots for "no service" (which will show empty/error) or just wait.
            // But if we want it to work when user selects manually, the listener above handles it.
        }
    }
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.classList.remove('show');
    // Force hide immediately
    modal.style.setProperty('display', 'none', 'important');

    try {
        // Reset state
        const form = document.getElementById('bookingForm');
        if (form) form.reset();

        const stepPayment = document.getElementById('booking-step-payment');
        if (stepPayment) stepPayment.style.display = 'none';

        const stepForm = document.getElementById('booking-step-form');
        if (stepForm) stepForm.style.display = 'block';

        const title = document.getElementById('modalTitle');
        if (title) title.textContent = 'Book a Service';

        const qr = document.getElementById('paymentQrCode');
        if (qr) qr.src = '';

        const txn = document.getElementById('transactionId');
        if (txn) {
            txn.value = '';
            txn.style.borderColor = '#ddd';
        }

        const feedback = document.getElementById('txn-feedback');
        if (feedback) {
            feedback.textContent = 'Enter the UTR number from your payment app.';
            feedback.style.color = '#666';
        }

        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Payment';
        }
    } catch (e) {
        console.error('Error resetting modal:', e);
    }
}


// --- Helper Functions for Polish ---
function showBookingNotification(message, type = 'info') {
    // Check if global showNotification exists (from dashboard.js or admin-dashboard.js)
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback implementation if specific dashboard JS isn't loaded
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000;`;
        document.body.appendChild(container);
    }

    // Prevent duplicate toasts (Robust check)
    if (container.children.length > 0) {
        Array.from(container.children).forEach(t => {
            if (t.innerText.includes(message)) t.remove();
        });
    }

    // Limit max toasts
    while (container.children.length >= 3) {
        container.firstChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'booking-toast';
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

// Submit booking
function submitBooking() {
    const token = localStorage.getItem('token');

    if (!token) {
        showBookingNotification('Session expired. Please login again.', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const form = document.getElementById('bookingForm');
    const formData = new FormData(form);

    const bookingData = {
        service_id: parseInt(formData.get('service_id')),
        booking_date: formData.get('booking_date'),
        booking_time: formData.get('booking_time'),
        description: formData.get('description'),
        address: formData.get('address'),
        total_amount: parseFloat(formData.get('total_amount'))
    };

    // Validate
    if (!bookingData.service_id || !bookingData.booking_date || !bookingData.booking_time || !bookingData.total_amount || !bookingData.address) {
        showBookingNotification('Please fill in all required fields, including Address', 'error');
        return;
    }

    // Time Validation
    const now = new Date();
    const selectedDate = new Date(bookingData.booking_date + 'T' + bookingData.booking_time);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // 1. Past Check
    if (selectedDate < now) {
        showBookingNotification('Please select a future date and time', 'error');
        return;
    }

    // 2. 1-Hour Minimum Notice
    if (selectedDate < oneHourLater) {
        showBookingNotification('Please book at least 1 hour in advance.', 'error');
        return;
    }

    // 3. Business Hours (08:00 - 20:00)
    const hours = selectedDate.getHours();
    if (hours < 8 || hours >= 20) {
        showBookingNotification('Service hours are 08:00 AM to 08:00 PM', 'error');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Booking...';
    submitBtn.disabled = true;

    fetch('/HomeService/backend/api/create-booking.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
    })
        .then(async response => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create booking (Status: ' + response.status + ')');
            }
            return data;
        })
        .then(data => {
            if (data.success) {
                showBookingNotification('Booking created successfully! ID: ' + data.booking_id, 'success');
                closeBookingModal();
                form.reset();

                // Reload bookings if on dashboard
                if (typeof loadBookings === 'function') {
                    loadBookings();
                }
            } else {
                showBookingNotification('Error: ' + (data.error || 'Failed to create booking'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showBookingNotification(error.message, 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Setup modal click handler to close when clicking outside or on close button
function setupModalClickHandler() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeBookingModal();
            }
        });

        // Delegation for close button
        modal.addEventListener('click', function (e) {
            if (e.target.closest('.close-btn')) {
                closeBookingModal();
            }
        });
    }
}

// Close modal when clicking outside
document.addEventListener('click', function (event) {
    const modal = document.getElementById('bookingModal');
    if (modal && event.target === modal) {
        closeBookingModal();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Add this to ensure modal styles are loaded
    if (!document.getElementById('bookingModalStyles')) {
        const style = document.createElement('style');
        style.id = 'bookingModalStyles';
        style.textContent = `
            /* Booking Modal */
            .booking-modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                flex-direction: column;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .booking-modal.show {
                display: flex !important;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            .booking-modal-content {
                background-color: white;
                padding: 2.5rem;
                border-radius: 14px;
                max-width: 550px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .booking-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 1.25rem;
            }

            .booking-modal-header h2 {
                margin: 0;
                font-size: 1.75rem;
                color: #1f2937;
                font-weight: 700;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
                color: #9ca3af;
                padding: 0;
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
                font-weight: 300;
                position: relative;
                z-index: 10001;
            }

            .close-btn:hover {
                background-color: #f3f4f6;
                color: #1f2937;
            }

            .booking-modal-body {
                padding: 0;
            }

            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.25rem;
            }

            .form-group label {
                display: block;
                margin-bottom: 0.6rem;
                font-weight: 600;
                color: #374151;
                font-size: 0.95rem;
                letter-spacing: 0.3px;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 0.85rem;
                border: 1.5px solid #d1d5db;
                border-radius: 8px;
                font-size: 1rem;
                font-family: inherit;
                transition: all 0.3s ease;
                background-color: #f9fafb;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #3b82f6;
                background-color: white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
            }

            .form-group textarea {
                resize: vertical;
                font-family: inherit;
            }

            .form-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e5e7eb;
            }

            .form-actions .btn {
                flex: 1;
                padding: 0.85rem 1.5rem;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                border: none;
                transition: all 0.3s ease;
                font-size: 0.95rem;
                letter-spacing: 0.3px;
            }

            .form-actions .btn-primary {
                background-color: #3b82f6;
                color: white;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .form-actions .btn-primary:hover {
                background-color: #2563eb;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }

            .form-actions .btn-secondary {
                background-color: #e5e7eb;
                color: #374151;
                border: none;
            }

            .form-actions .btn-secondary:hover {
                background-color: #d1d5db;
                transform: translateY(-2px);
            }

            @media (max-width: 600px) {
                .booking-modal-content {
                    width: 95%;
                    padding: 1.5rem;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .form-actions {
                    flex-direction: column;
                }

                .booking-modal-header h2 {
                    font-size: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.createBookingModal = createBookingModal;

// Global helper functions for booking logic
window.calculateTotal = function () {
    const serviceSelect = document.getElementById('serviceSelect');
    const durationInput = document.getElementById('duration');
    const totalInput = document.getElementById('estimatedAmount');

    if (!serviceSelect || !durationInput) return 0;

    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const rate = selectedOption ? parseFloat(selectedOption.dataset.rate) : 0;
    const duration = parseFloat(durationInput.value) || 0;

    if (rate > 0 && duration > 0) {
        const total = rate * duration;
        if (totalInput) totalInput.value = total.toFixed(2);
        return total;
    } else {
        if (totalInput) totalInput.value = '';
        return 0;
    }
}

window.updateTimeSlots = function () {
    const dateVal = document.getElementById('bookingDate').value;
    const serviceSelect = document.getElementById('serviceSelect');
    const serviceId = serviceSelect ? serviceSelect.value : null;
    const timeSelect = document.getElementById('bookingTime');

    if (!dateVal || !serviceId || !timeSelect) return;

    timeSelect.innerHTML = '<option value="">Loading slots...</option>';
    timeSelect.disabled = true;

    const params = new URLSearchParams({ date: dateVal, service_id: serviceId });

    fetch(`/HomeService/backend/api/get-available-slots.php?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            timeSelect.innerHTML = '<option value="">Select a time...</option>';
            timeSelect.disabled = false;

            if (data.success && data.slots.length > 0) {
                data.slots.forEach(slot => {
                    const [hours, minutes] = slot.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes));
                    const displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                    // Past check logic (simplified)
                    const now = new Date();
                    const checkDate = new Date(dateVal + 'T' + slot);
                    if (checkDate.toDateString() === now.toDateString() && checkDate.getHours() <= now.getHours() + 1) return;

                    const option = document.createElement('option');
                    option.value = slot;
                    option.textContent = displayTime;
                    timeSelect.appendChild(option);
                });
            }
        })
        .catch(err => {
            console.error(err);
            timeSelect.innerHTML = '<option value="">Error loading slots</option>';
        });
}
