<?php
require_once __DIR__ . '/../config.php';

try {
    echo "Adding location column to users table...\n";
    
    // Check if column exists first
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'location'");
    if ($stmt->rowCount() > 0) {
        echo "Column 'location' already exists.\n";
    } else {
        $pdo->exec("ALTER TABLE users ADD COLUMN location VARCHAR(255) NULL AFTER phone");
        echo "Column 'location' added successfully.\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
