<?php
require_once 'backend/config.php';

try {
    $id = 29; // The plumber ID from previous check
    $stmt = $pdo->prepare("UPDATE providers SET is_verified = 1 WHERE id = ?");
    $stmt->execute([$id]);
    echo "Updated provider $id. Rows affected: " . $stmt->rowCount();
    
    // Check again
    $stmt = $pdo->prepare("SELECT is_verified FROM providers WHERE id = ?");
    $stmt->execute([$id]);
    echo " New status: " . $stmt->fetchColumn();
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
