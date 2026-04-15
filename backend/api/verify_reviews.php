<?php
require_once '../config.php';

try {
    // Get all providers with names from users table
    $stmt = $pdo->query("
        SELECT p.id, p.user_id, u.full_name, p.total_reviews, p.rating 
        FROM providers p
        JOIN users u ON p.user_id = u.id
    ");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<h1>Provider Review Stats Verification</h1>";
    echo "<table border='1' cellpadding='5'>
            <tr>
                <th>Provider ID</th>
                <th>Name</th>
                <th>Stored Total Reviews</th>
                <th>Actual Reviews Count</th>
                <th>Stored Rating</th>
                <th>Actual Avg Rating</th>
                <th>Status</th>
            </tr>";

    foreach ($providers as $p) {
        $pid = $p['id'];
        
        // Count actual reviews
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as count, AVG(rating) as avg_rating 
            FROM reviews r 
            JOIN bookings b ON r.booking_id = b.id 
            WHERE b.provider_id = ?
        ");
        $countStmt->execute([$pid]);
        $actual = $countStmt->fetch(PDO::FETCH_ASSOC);
        
        $actualCount = $actual['count'];
        $actualAvg = $actual['avg_rating'] ? round($actual['avg_rating'], 1) : 0;
        
        $totalReviews = isset($p['total_reviews']) ? $p['total_reviews'] : 'NULL';
        $storedRating = isset($p['rating']) ? $p['rating'] : 'NULL';

        $status = ($totalReviews == $actualCount) ? "MATCH" : "<b style='color:red'>MISMATCH</b>";

        echo "<tr>
                <td>{$p['id']}</td>
                <td>{$p['full_name']}</td>
                <td>{$totalReviews}</td>
                <td>{$actualCount}</td>
                <td>{$storedRating}</td>
                <td>{$actualAvg}</td>
                <td>{$status}</td>
              </tr>";
    }
    echo "</table>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
