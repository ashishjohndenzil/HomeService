<?php
require_once '../config.php';

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS favorites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        provider_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_favorite (customer_id, provider_id)
    )";

    $pdo->exec($sql);
    echo "Favorites table created successfully.";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage());
}
?>
