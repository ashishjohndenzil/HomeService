<?php
require_once '../config.php';

try {
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'address'");
    if ($stmt->rowCount() > 0) {
        echo "Column 'address' already exists in 'bookings' table.\n";
    } else {
        // Add column
        $sql = "ALTER TABLE bookings ADD COLUMN address TEXT NOT NULL AFTER status";
        $pdo->exec($sql);
        echo "Successfully added 'address' column to 'bookings' table.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
