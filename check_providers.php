<?php
require_once 'backend/config.php';

try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM providers");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Total Providers: " . $count . "\n";

    if ($count > 0) {
        $stmt = $pdo->query("SELECT p.id, u.full_name, s.name as service_name FROM providers p JOIN users u ON p.user_id = u.id JOIN services s ON p.service_id = s.id LIMIT 5");
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($providers);
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
