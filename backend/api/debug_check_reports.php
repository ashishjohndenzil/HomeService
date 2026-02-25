<?php
require_once '../config.php';

echo "Checking Reports table...\n";

try {
    // 1. Check Count
    $stmt = $pdo->query("SELECT COUNT(*) FROM reports");
    $count = $stmt->fetchColumn();
    echo "Current Report Count: $count\n";

    if ($count == 0) {
        echo "No reports found. Attempting to insert a test report...\n";

        // 2. Find a valid booking (completed preferrably)
        $bStmt = $pdo->query("SELECT id, customer_id FROM bookings WHERE status = 'completed' LIMIT 1");
        $booking = $bStmt->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            // Fallback to any booking
            $bStmt = $pdo->query("SELECT id, customer_id FROM bookings LIMIT 1");
            $booking = $bStmt->fetch(PDO::FETCH_ASSOC);
        }

        if ($booking) {
            echo "Found Booking ID: " . $booking['id'] . " (Customer ID: " . $booking['customer_id'] . ")\n";

            // 3. Insert Report
            $sql = "INSERT INTO reports (booking_id, customer_id, issue_type, description, status) VALUES (?, ?, ?, ?, ?)";
            $insert = $pdo->prepare($sql);
            $insert->execute([
                $booking['id'],
                $booking['customer_id'],
                'Service Quality',
                'Provider arrived late and was rude.',
                'pending'
            ]);
            
            echo "Test report inserted successfully!\n";
        } else {
            echo "No bookings found to link a report to.\n";
        }
    } else {
        echo "Reports already exist.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
