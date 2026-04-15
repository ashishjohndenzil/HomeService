<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

// Auth check placeholder (Should implement proper token validation)
// In a real app, you would validate the admin token here.

try {
    // Select is_active and is_verified (via JOIN)
    $stmt = $pdo->query("SELECT u.id, u.full_name, u.email, u.user_type, u.is_active, u.created_at, p.is_verified 
                         FROM users u 
                         LEFT JOIN providers p ON u.id = p.user_id 
                         ORDER BY u.created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'users' => $users]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
