<?php
require_once 'backend/config.php';

try {
    // 1. Add column if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM services LIKE 'base_price'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE services ADD COLUMN base_price DECIMAL(10,2) NOT NULL DEFAULT 500.00");
        echo "Added base_price column.\n";
    } else {
        echo "base_price column already exists.\n";
    }

    // 2. Update values
    $updates = [
        1 => 500,  // Plumbing
        2 => 600,  // Electrical
        3 => 800,  // Cleaning
        4 => 800,  // Carpentry
        5 => 1200, // Painting
        6 => 700,  // Appliance Repair
        7 => 500   // Other
    ];

    $stmt = $pdo->prepare("UPDATE services SET base_price = ? WHERE id = ?");
    foreach ($updates as $id => $price) {
        $stmt->execute([$price, $id]);
    }
    echo "Updated service prices.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
