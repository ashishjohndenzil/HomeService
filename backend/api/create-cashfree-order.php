<?php
require_once '../config.php';
require_once 'cashfree_config.php';

header('Content-Type: application/json');

// Get User from Token (Security)
$headers = apache_request_headers();
$token = null;
if (isset($headers['Authorization'])) {
    $matches = [];
    if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Simplify user verification for speed (In prod, use full check)
$user_id = null;
$stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
$stmt->execute([$token]);
$user_id = $stmt->fetchColumn();

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid Token']);
    exit;
}

// Get User Info for Customer Details
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Get Request Data
$data = json_decode(file_get_contents('php://input'), true);
$amount = $data['amount'] ?? 0;
$service_id = $data['service_id'] ?? 0;

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Amount']);
    exit;
}

// Generate Unique Order ID
$order_id = 'ORDER_' . $user_id . '_' . time();

// Prepare Cashfree Payload
$payload = [
    'order_amount' => (float)$amount,
    'order_currency' => 'INR',
    'order_id' => $order_id,
    'customer_details' => [
        'customer_id' => (string)$user_id,
        'customer_phone' => $user['phone'] ?? '9999999999', // Sandbox needs valid looking phone
        'customer_name' => $user['full_name'] ?? 'Guest User',
        'customer_email' => $user['email'] ?? 'test@example.com'
    ],
    'order_meta' => [
        'return_url' => 'http://localhost/HomeService/frontend/customer-dashboard.html?order_id={order_id}',
        'notify_url' => 'http://localhost/HomeService/backend/api/webhook-cashfree.php' // Optional for localhost
    ]
];

// Call Cashfree API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, CASHFREE_BASE_URL . '/orders');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, getCashfreeHeaders());

$response = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . $err]);
} else {
    $result = json_decode($response, true);
    if (isset($result['payment_session_id'])) {
        echo json_encode([
            'success' => true,
            'payment_session_id' => $result['payment_session_id'],
            'order_id' => $order_id
        ]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Cashfree Error', 'details' => $result]);
    }
}
?>
