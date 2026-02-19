<?php
require_once '../config.php';

try {
    echo "<h1>Fixing Provider Review Stats...</h1>";
    
    // Get all providers
    $stmt = $pdo->query("SELECT id FROM providers");
    $providers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $updatedCount = 0;

    foreach ($providers as $pid) {
        // Calculate actual stats from reviews table
        $statsStmt = $pdo->prepare("
            SELECT COUNT(*) as count, AVG(rating) as avg_rating 
            FROM reviews r 
            JOIN bookings b ON r.booking_id = b.id 
            WHERE b.provider_id = ?
        ");
        $statsStmt->execute([$pid]);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
        
        $actualCount = $stats['count'];
        $actualAvg = $stats['avg_rating'] ? $stats['avg_rating'] : 0;

        // Update providers table
        $updateStmt = $pdo->prepare("UPDATE providers SET total_reviews = ?, rating = ? WHERE id = ?");
        $updateStmt->execute([$actualCount, $actualAvg, $pid]);
        
        echo "Updated Provider ID {$pid}: Count = {$actualCount}, Rating = {$actualAvg}<br>";
        $updatedCount++;
    }

    echo "<h2>Done! Updated {$updatedCount} providers.</h2>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
