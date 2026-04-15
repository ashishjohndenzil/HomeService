<?php
require_once __DIR__ . '/../config.php';

try {
    // Add transaction_id column
    try {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(100) AFTER status");
        echo "Added transaction_id column.\n";
    } catch (PDOException $e) {
        // Ignore if exists, or handle specific error code
        echo "Column transaction_id might already exist or error: " . $e->getMessage() . "\n";
    }

    // Add payment_method column
    try {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN payment_method ENUM('cash', 'upi', 'card') DEFAULT 'cash' AFTER transaction_id");
        echo "Added payment_method column.\n";
    } catch (PDOException $e) {
        echo "Column payment_method might already exist or error: " . $e->getMessage() . "\n";
    }

    // Add payment_status column
    try {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending' AFTER payment_method");
        echo "Added payment_status column.\n";
    } catch (PDOException $e) {
        echo "Column payment_status might already exist or error: " . $e->getMessage() . "\n";
    }

    echo "Schema update complete.\n";

} catch (PDOException $e) {
    echo "General Error: " . $e->getMessage();
}
?>
