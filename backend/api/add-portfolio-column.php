<?php
require_once '../config.php';

try {
    $stmt = $pdo->exec("ALTER TABLE providers ADD COLUMN portfolio_image VARCHAR(255) DEFAULT NULL AFTER bio");
    echo "Column 'portfolio_image' added successfully.";
} catch (PDOException $e) {
    echo "Error (might already exist): " . $e->getMessage();
}
?>
