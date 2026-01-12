<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

// Auth check placeholder (Should implement proper token validation)
// In a real app, you would validate the admin token here.

try {
    // Select is_active now that it exists
    $stmt = $pdo->query("SELECT id, full_name, email, user_type, is_active, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'users' => $users]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
