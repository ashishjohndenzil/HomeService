<?php
require_once '../config.php';

echo "<h2>Clearing Reviews Data...</h2>";

try {
    $pdo->beginTransaction();

    // 1. Delete all reviews
    $pdo->exec("DELETE FROM reviews");
    echo "Deleted all records from 'reviews' table.<br>";

    // 2. Reset provider ratings
    $pdo->exec("UPDATE providers SET rating = 0, total_reviews = 0");
    echo "Reset ratings and total_reviews for all providers.<br>";

    $pdo->commit();
    echo "<h3>Success! System ratings reset.</h3>";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error: " . $e->getMessage();
}
?>
