<?php
require_once '../config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        customer_id INT NOT NULL,
        issue_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (customer_id) REFERENCES users(id)
    )";

    $pdo->exec($sql);
    echo "Table 'reports' created successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
