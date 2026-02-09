<?php
require_once 'backend/config.php';

try {
    $stmt = $pdo->query("SELECT p.id, u.full_name, u.is_active, p.is_verified FROM providers p JOIN users u ON p.user_id = u.id");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($providers);
    echo "</pre>";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
