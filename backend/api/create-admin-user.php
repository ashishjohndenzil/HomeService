<?php
header('Content-Type: application/json');
require_once '../config.php';

// Check if secret key matches (simple security for this script)
if (!isset($_GET['key']) || $_GET['key'] !== 'admin_setup_secret_123') {
    die(json_encode(['error' => 'Unauthorized']));
}

$email = 'admin@homeservice.com';
$password = 'Admin@123';
$fullName = 'System Administrator';

try {
    // Check if admin already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();
        // Update to ensure it is admin
        $update = $pdo->prepare("UPDATE users SET user_type = 'admin' WHERE id = ?");
        $update->execute([$user['id']]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Admin user updated',
            'credentials' => ['email' => $email, 'password' => 'Existing Password']
        ]);
    } else {
        // Create new admin
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $insert = $pdo->prepare("INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, ?, 'admin')");
        $insert->execute([$fullName, $email, $hashedPassword, '1234567890']);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Admin user created',
            'credentials' => ['email' => $email, 'password' => $password]
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
