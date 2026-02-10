<?php
require_once '../config.php';

try {
    $stmt = $pdo->query("DESCRIBE bookings");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns in bookings table: " . implode(", ", $columns) . "\n";
    
    if (!in_array('transaction_id', $columns)) {
        echo "transaction_id column is MISSING.\n";
    } else {
        echo "transaction_id column EXISTS.\n";
    }

    if (!in_array('payment_status', $columns)) {
        echo "payment_status column is MISSING.\n";
    } else {
        echo "payment_status column EXISTS.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
