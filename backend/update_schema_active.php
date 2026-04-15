<?php
require_once 'config.php';

try {
    echo "Checking if is_active column exists...\n";
    
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_active'");
    $exists = $stmt->fetch();

    if (!$exists) {
        echo "Adding is_active column...\n";
        $pdo->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER user_type");
        echo "Column added successfully.\n";
    } else {
        echo "Column is_active already exists.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
