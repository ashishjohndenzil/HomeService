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
                    <h2>Book a Service</h2>
                    <button type="button" class="close-btn" onclick="closeBookingModal()">&times;</button>
                </div>
                <div class="booking-modal-body">
                    <form id="bookingForm">
                        <div class="form-group">
                            <label for="serviceSelect">Service</label>
                            <select id="serviceSelect" name="service_id" required>
                                <option value="">Select a service...</option>
                            </select>
                        </div>

                        <!-- Provider selection removed as per user request -->

                        <div class="form-row">
                            <div class="form-group">
                                <label for="bookingDate">Date</label>
                                <input type="date" id="bookingDate" name="booking_date" required>
                            </div>
                            <div class="form-group">
                                <label for="bookingTime">Time</label>
                                <input type="time" id="bookingTime" name="booking_time" required>
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
                            <button type="submit" class="btn btn-primary" id="confirmBookingBtn">Confirm Booking</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Add modal to page if not already exists
    if (!document.getElementById('bookingModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupBookingForm();
        setupModalClickHandler();
    }
}

// Load services into dropdown
function loadServices() {
    return fetch('../backend/api/services.php')
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
    const form = document.getElementById('bookingForm');
    const serviceSelect = document.getElementById('serviceSelect');
    const durationInput = document.getElementById('duration');
    const totalInput = document.getElementById('estimatedAmount');

    function calculateTotal() {
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        const rate = selectedOption ? parseFloat(selectedOption.dataset.rate) : 0;
        const duration = parseFloat(durationInput.value) || 0;

        if (rate > 0 && duration > 0) {
            const total = rate * duration;
            totalInput.value = total.toFixed(2);
        } else {
            totalInput.value = '';
        }
    }

    if (form) {
        if (serviceSelect) {
            serviceSelect.addEventListener('change', calculateTotal);
        }
        if (durationInput) {
            durationInput.addEventListener('input', calculateTotal);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitBooking();
        });
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
        alert('Service providers cannot book services.');
        return;
    }

    createBookingModal();
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.setAttribute('min', today);
        dateInput.value = today;
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
        }
    }
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Submit booking
function submitBooking() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('bookingForm');
    const formData = new FormData(form);

    const bookingData = {
        service_id: parseInt(formData.get('service_id')),
        booking_date: formData.get('booking_date'),
        booking_time: formData.get('booking_time'),
        description: formData.get('description'),
        total_amount: parseFloat(formData.get('total_amount'))
    };

    // Validate
    if (!bookingData.service_id || !bookingData.booking_date || !bookingData.booking_time || !bookingData.total_amount) {
        alert('Please fill in all required fields');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Booking...';
    submitBtn.disabled = true;

    fetch('../backend/api/create-booking.php', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
    })
        .then(async response => {
            const data = await response.json().catch(() => ({})); // Handle non-JSON responses gracefully
            if (!response.ok) {
                // If response is not ok, throw the error from the response body or a default message
                throw new Error(data.error || 'Failed to create booking (Status: ' + response.status + ')');
            }
            return data;
        })
        .then(data => {
            if (data.success) {
                alert('✅ Booking created successfully! Your booking ID is: ' + data.booking_id);
                closeBookingModal();
                form.reset();

                // Reload bookings if on dashboard
                if (typeof loadBookings === 'function') {
                    loadBookings();
                }
            } else {
                alert('❌ Error: ' + (data.error || 'Failed to create booking'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('❌ ' + error.message);
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Setup modal click handler to close when clicking outside
function setupModalClickHandler() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
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

// Expose functions to global window object for inline onclick handlers
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.createBookingModal = createBookingModal;
