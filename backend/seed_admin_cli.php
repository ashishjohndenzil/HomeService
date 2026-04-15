<?php
require_once 'config.php';

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
        echo "Admin user already exists. Verified as 'admin' type.\n";
    } else {
        // Create new admin
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $insert = $pdo->prepare("INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, ?, 'admin')");
        $insert->execute([$fullName, $email, $hashedPassword, '1234567890']);
        
        echo "Admin user created successfully.\n";
    }
    echo "Email: $email\n";
    echo "Password: $password\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
