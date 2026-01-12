<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

// Basic Auth Check
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// TODO: Validate token strictly here. For now assuming middleware logic or similar.

try {
    $stats = [];
    
    // Total Users
    $stats['total_users'] = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    
    // Total Providers
    $stats['total_providers'] = $pdo->query("SELECT COUNT(*) FROM users WHERE user_type = 'provider'")->fetchColumn();
    
    // Total Bookings
    $stats['total_bookings'] = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
    
    // Total Revenue (Completed Bookings)
    $stats['total_revenue'] = $pdo->query("SELECT SUM(total_amount) FROM bookings WHERE status = 'completed'")->fetchColumn();
    
    echo json_encode(['success' => true, 'stats' => $stats]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
