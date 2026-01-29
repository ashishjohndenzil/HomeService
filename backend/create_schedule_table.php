<?php
require_once 'config.php';

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS provider_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
        start_time TIME DEFAULT '09:00:00',
        end_time TIME DEFAULT '17:00:00',
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_provider_day (provider_id, day_of_week)
    )";

    $pdo->exec($sql);
    echo "Table 'provider_schedule' created successfully (or already exists).";
} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage();
}
?>
