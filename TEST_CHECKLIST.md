# 🧪 Master Test Checklist & Verification Guide

Use this checklist to verify that all critical features of the HomeService application are working correctly.

---

## 1. Authentication & Registration (Google + Standard)
- [ ] **Google Sign-Up**: Click "Sign up with Google" -> Select Role -> Redirect to Dashboard.
- [ ] **Standard Register**: Fill form -> Verify immediate email/phone validation -> Submit -> Redirect to Login.
- [ ] **Email Validation**: Enter existing email `test@example.com` -> Verify "Email already registered" error appears.
- [ ] **Phone Validation**: Enter 9 digits (Error) -> Enter 10 digits (Success).
- [ ] **Location Autocomplete**: Start typing "New York" in location field -> Select suggestion.

## 2. Booking Flow (Customer)
- [ ] **View Services**: Login as Customer -> Verify "Services" tab loads.
- [ ] **Book Service**: Click "Book Now" -> Modal Opens.
- [ ] **Booking Modal**:
    - [ ] Select Service (if not pre-selected).
    - [ ] **Address Autocomplete**: Type address -> Select suggestion.
    - [ ] **Date/Time**: Select valid future date -> Select time slot.
    - [ ] **Price**: Verify Estimated Amount updates based on duration.
- [ ] **Payment (Razorpay)**: Click Confirm -> Verify Razorpay Modal opens -> Completement/Cancel Payment.
- [ ] **Confirmation**: Verify "Booking created successfully" message.

## 3. Provider Dashboard
- [ ] **View Requests**: Login as Provider -> "Service Requests" tab.
- [ ] **New Request**: Verify the booking created in step 2 appears here.
- [ ] **Action**: Click "Confirm" -> Verify status changes to "Confirmed".
- [ ] **My Services**: Verify services list loads -> Try "Edit" button.

## 4. In-App Chat 💬
- [ ] **Customer Chat**: Go to "My Bookings" -> Click "Chat" on a booking.
- [ ] **Send Message**: Type "Hello" -> Send -> Verify message appears.
- [ ] **Provider Chat**: Login as Provider -> Open Chat for same booking -> Verify message received.

## 5. Dashboard Features
- [ ] **Filters**: Click "Pending"/"Confirmed"/"Completed" buttons -> Verify list updates.
- [ ] **Stats**: Verify "Total Bookings" / "Earnings" numbers update.
- [ ] **Logout**: Click Logout -> Redirect to Index.

---

## 🐞 Troubleshooting

| Issue | Potential Check |
|-------|----------------|
| **Google Login Fail** | Check console for "gapi" errors. Verify `config.php` credentials. |
| **Email Check Fail** | Inspect Network tab for `check-email.php` response. |
| **Autocomplete Fail** | Check console for `Nominatim` network errors. |
| **Payment Fail** | Verify Razorpay Key ID in `booking.js`. |
| **Chat Not Updating** | Check `get-messages.php` in Network tab (polling is every 3s). |
