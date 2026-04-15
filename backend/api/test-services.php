<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    $stmt = $pdo->prepare('SELECT id, category, name FROM services');
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => count($results),
        'services' => $results
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
