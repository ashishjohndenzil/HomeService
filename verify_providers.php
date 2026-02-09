<?php
require_once 'backend/config.php';

try {
    $stmt = $pdo->prepare("UPDATE providers SET is_verified = 1 WHERE is_verified = 0");
    $stmt->execute();
    echo "Updated " . $stmt->rowCount() . " providers to be verified.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
