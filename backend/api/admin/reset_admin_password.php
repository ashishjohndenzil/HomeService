<?php
require_once '../../config.php';

$email = 'admin@homeservice.com';
$password = 'Admin@123';
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Attempting to reset admin password...\n";

try {
    // 1. Check if exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();
        echo "Admin user found (ID: " . $user['id'] . "). Updating password...\n";
        
        $update = $pdo->prepare("UPDATE users SET password = ?, user_type = 'admin', is_active = 1 WHERE id = ?");
        $update->execute([$hash, $user['id']]);
        echo "Password updated successfully.\n";
    } else {
        echo "Admin user NOT found. Creating new admin...\n";
        
        $insert = $pdo->prepare("INSERT INTO users (full_name, email, password, phone, user_type, is_active) VALUES (?, ?, ?, ?, 'admin', 1)");
        $insert->execute(['System Administrator', $email, $hash, '1234567890']);
        echo "Admin user created successfully.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
