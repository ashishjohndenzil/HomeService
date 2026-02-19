<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "Script Starting...\n";
require_once '../config.php';
echo "Config Loaded...\n";

// Simulate a booking request
$mockData = [
    'service_id' => 1, // Assume service ID 1 exists
    'booking_date' => date('Y-m-d', strtotime('+1 day')),
    'booking_time' => '10:00',
    'description' => 'Test booking',
    'address' => 'Test Address',
    'total_amount' => 500,
    'transaction_id' => 'TEST12345678'
];

// Mock user session (assuming user ID 1 is a customer)
// We need to generate a valid token or bypass auth for this test.
// Bypassing auth is risky for a test script unless we modify create-booking temporarily.
// Better: Insert a dummy session token.

$token = 'test_token_' . time();
$user_id = 38; // Use a known customer ID if possible, or create one.

if (!isset($pdo)) {
    die("PDO not set!");
}

try {
    // Insert session
    $stmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))");
    $stmt->execute([$user_id, $token]);
    echo "Session created...\n";
} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage());
}

// Initialize cURL
$ch = curl_init('http://localhost/HomeService/backend/api/create-booking.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($mockData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";

// Cleanup
$pdo->prepare("DELETE FROM user_sessions WHERE token = ?")->execute([$token]);
$pdo->prepare("DELETE FROM bookings WHERE transaction_id = 'TEST12345678'")->execute();
?>
