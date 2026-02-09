<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../config.php';

if (!isset($_GET['email'])) {
    echo json_encode(['success' => false, 'message' => 'Email is required']);
    exit;
}

$email = trim($_GET['email']);

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'exists' => true, 'message' => 'Email already registered']);
    } else {
        echo json_encode(['success' => true, 'exists' => false, 'message' => 'Email available']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>
