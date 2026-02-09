<?php
require_once 'backend/config.php';

try {
    $stmt = $pdo->query("SELECT user_id, service_id, COUNT(*) as count FROM providers GROUP BY user_id, service_id HAVING count > 1");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    if (count($duplicates) > 0) {
        print_r($duplicates);
    } else {
        echo "No duplicates found in providers table.";
    }
    echo "</pre>";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
