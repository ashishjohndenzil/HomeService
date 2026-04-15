<?php
header('Content-Type: application/json');
require_once '../config.php';

// Setup Test Customer
$customerEmail = 'testcustomer@homeservice.com';
$customerPass = 'Test@123';
$customerName = 'Test Customer';

// Setup Test Provider
$providerEmail = 'testprovider@homeservice.com';
$providerPass = 'Test@123';
$providerName = 'Test Provider';

try {
    // 1. Create/Get Customer
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$customerEmail]);
    if ($stmt->rowCount() == 0) {
        $hash = password_hash($customerPass, PASSWORD_DEFAULT);
        $ins = $pdo->prepare("INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, '1231231234', 'customer')");
        $ins->execute([$customerName, $customerEmail, $hash]);
        $customerId = $pdo->lastInsertId();
    } else {
        $customerId = $stmt->fetchColumn();
    }

    // 2. Create/Get Provider
    $stmt->execute([$providerEmail]);
    if ($stmt->rowCount() == 0) {
        $hash = password_hash($providerPass, PASSWORD_DEFAULT);
        $ins = $pdo->prepare("INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, '9876543210', 'provider')");
        $ins->execute([$providerName, $providerEmail, $hash]);
        $providerUserId = $pdo->lastInsertId();
    } else {
        $providerUserId = $stmt->fetchColumn();
    }

    // 3. Create Service for Provider
    $chkSvc = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
    $chkSvc->execute([$providerUserId]);
    if ($chkSvc->rowCount() == 0) {
        $ins = $pdo->prepare("INSERT INTO providers (user_id, service_id, experience_years, hourly_rate, is_verified) VALUES (?, 1, 5, 500, 1)");
        $ins->execute([$providerUserId]);
        $providerId = $pdo->lastInsertId();
    } else {
        $providerId = $chkSvc->fetchColumn();
    }

    // 4. Create Completed Booking
    // Check if one exists
    $chkBk = $pdo->prepare("SELECT id FROM bookings WHERE customer_id = ? AND provider_id = ? AND status = 'completed'");
    $chkBk->execute([$customerId, $providerId]);
    
    if ($chkBk->rowCount() == 0) {
        $ins = $pdo->prepare("INSERT INTO bookings (customer_id, provider_id, service_id, booking_date, booking_time, description, status, total_amount, created_at) VALUES (?, ?, 1, DATE_ADD(CURDATE(), INTERVAL -1 DAY), '10:00:00', 'Test Booking for Review', 'completed', 1000, NOW())");
        $ins->execute([$customerId, $providerId]);
        $bookingId = $pdo->lastInsertId();
    } else {
        $bookingId = $chkBk->fetchColumn();
    }
    
    // Ensure no existing review
    $pdo->prepare("DELETE FROM reviews WHERE booking_id = ?")->execute([$bookingId]);

    echo json_encode(['success' => true, 'message' => 'Test data setup completed', 'customerId' => $customerId, 'bookingId' => $bookingId]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
