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

    // --- Chart Data ---

    // --- Chart Data (Category Based, No Trends) ---

    // 1. User Distribution (Customers vs Providers)
    $user_dist_stmt = $pdo->query("
        SELECT user_type, COUNT(*) as count 
        FROM users 
        GROUP BY user_type
    ");
    $stats['user_distribution'] = $user_dist_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Booking Status Distribution
    $status_stmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM bookings 
        GROUP BY status
    ");
    $stats['status_distribution'] = $status_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Earnings by Service
    $earnings_stmt = $pdo->query("
        SELECT 
            s.name as service_name, 
            SUM(b.total_amount) as earnings 
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'completed'
        GROUP BY s.name
        ORDER BY earnings DESC
    ");
    $stats['earnings_by_service'] = $earnings_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Services Popularity (Bookings count) - All Services (Limit 10 for UI)
    $services_stmt = $pdo->query("
        SELECT 
            s.name as service_name, 
            COUNT(b.id) as count 
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        GROUP BY s.name 
        ORDER BY count DESC 
        LIMIT 10
    ");
    $stats['service_popularity'] = $services_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'stats' => $stats]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
