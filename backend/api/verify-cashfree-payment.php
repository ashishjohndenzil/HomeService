<?php
require_once '../config.php';
require_once 'cashfree_config.php';

header('Content-Type: application/json');

$order_id = $_GET['order_id'] ?? null;

if (!$order_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing Order ID']);
    exit;
}

// Verify with Cashfree
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, CASHFREE_BASE_URL . '/orders/' . $order_id);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, getCashfreeHeaders());

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

if (isset($result['order_status'])) {
    $status = $result['order_status']; // PAID, ACTIVE, EXPIRED
    
    // Check if PAYMENT is successful
    if ($status === 'PAID') {
        // Find existing booking? 
        // NOTE: In our flow, we create the booking *after* payment success or *before*?
        // If we create it BEFORE (pending), we update it. 
        // If we create it AFTER, we need the booking details.
        // For simplicity, we will stick to: 
        // 1. Frontend: Create Order -> Pay. 
        // 2. Frontend: On Success -> Call `create-booking.php` with `transaction_id` = `order_id` and `payment_status` = 'paid'.
        
        // However, `create-booking.php` logic needs to trust this. 
        // A better security model is to Verify *inside* `create-booking.php`.
        
        echo json_encode(['success' => true, 'status' => 'PAID']);
    } else {
        echo json_encode(['success' => false, 'status' => $status]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Verification Failed', 'details' => $result]);
}
?>
