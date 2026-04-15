<?php
require_once '../config.php';

try {
    // Activate all users correctly (using 1 for TINYINT)
    $stmt = $pdo->query("UPDATE users SET is_active = 1 WHERE user_type = 'provider'");
    echo "Updated " . $stmt->rowCount() . " providers to active status (1).<br>";
    
    // Check results
    $stmt = $pdo->query("SELECT id, full_name, user_type, is_active FROM users WHERE user_type='provider'");
    $users = $stmt->fetchAll();
    
    echo "<pre>";
    print_r($users);
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
