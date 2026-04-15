<?php
require_once '../config.php';

header('Content-Type: text/plain');

$email = 'joseph@gmail.com'; // The user from the screenshot

echo "Debugging Reviews for $email\n\n";

// 1. Get User and Provider ID
$stmt = $pdo->prepare("SELECT id, full_name, user_type FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    die("User not found.\n");
}

echo "User ID: " . $user['id'] . "\n";
echo "Name: " . $user['full_name'] . "\n";

$pStmt = $pdo->prepare("SELECT * FROM providers WHERE user_id = ?");
$pStmt->execute([$user['id']]);
$provider = $pStmt->fetch(PDO::FETCH_ASSOC);

if (!$provider) {
    die("Provider profile not found.\n");
}

echo "Provider ID: " . $provider['id'] . "\n";
echo "Current Stats in 'providers' table:\n";
echo "  Rating: " . $provider['rating'] . "\n";
echo "  Total Reviews: " . $provider['total_reviews'] . "\n\n";

// 2. Get All Reviews (Raw)
$rStmt = $pdo->prepare("
    SELECT r.*, b.status as booking_status, b.id as booking_id
    FROM reviews r
    JOIN bookings b ON r.booking_id = b.id
    WHERE b.provider_id = ?
");
$rStmt->execute([$provider['id']]);
$reviews = $rStmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($reviews) . " reviews in 'reviews' table linked to this provider:\n";

foreach ($reviews as $r) {
    echo "  Review ID: " . $r['id'] . "\n";
    echo "  Booking ID: " . $r['booking_id'] . " (Status: " . $r['booking_status'] . ")\n";
    echo "  Rating: " . $r['rating'] . "\n";
    echo "  Comment: " . $r['comment'] . "\n";
    echo "--------------------------------------------------\n";
}

// 3. Independent Calculation
$count = 0;
$totalRating = 0;
$fiveStar = 0;

foreach ($reviews as $r) {
    // Mimic the get-provider-reviews.php filter
    if ($r['booking_status'] === 'completed') {
        $count++;
        $totalRating += (float)$r['rating'];
        if ((float)$r['rating'] >= 5) {
            $fiveStar++;
        }
    }
}

echo "\nCalculated Stats (using ONLY 'completed' bookings):\n";
echo "  Count: $count\n";
echo "  Avg: " . ($count ? ($totalRating / $count) : 0) . "\n";
echo "  Five Star: $fiveStar\n";

echo "\nAnalysis:\n";
if ($count != $provider['total_reviews']) {
    echo "MISMATCH: Provider table says " . $provider['total_reviews'] . ", but actual completed reviews are $count.\n";
} else {
    echo "Counts match.\n";
}

?>
