<?php
require_once 'config.php';

header('Content-Type: text/plain');

$email = 'joseph@gmail.com'; // From screenshot
echo "Checking for user: $email\n";

$stmt = $pdo->prepare("SELECT id, full_name, user_type FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo "User not found.\n";
    exit;
}
echo "User ID: " . $user['id'] . "\n";

$stmt = $pdo->prepare("SELECT id, service_id FROM providers WHERE user_id = ?");
$stmt->execute([$user['id']]);
$provider = $stmt->fetch();

if (!$provider) {
    echo "Provider profile not found.\n";
    exit;
}
echo "Provider ID: " . $provider['id'] . ", Service ID: " . $provider['service_id'] . "\n";

echo "\n--- Schedule ---\n";
$stmt = $pdo->prepare("SELECT * FROM provider_schedule WHERE provider_id = ?");
$stmt->execute([$provider['id']]);
$schedule = $stmt->fetchAll();

foreach ($schedule as $day) {
    echo $day['day_of_week'] . ": " . ($day['is_active'] ? 'Active' : 'Inactive') . " (" . $day['start_time'] . " - " . $day['end_time'] . ")\n";
}

echo "\n--- Testing Availability API Logic ---\n";
$service_id = $provider['service_id'];
$date = '2026-01-22'; // Thursday

echo "Checking Date: $date for Service ID: $service_id\n";
$day_of_week = date('l', strtotime($date));
echo "Day: $day_of_week\n";

// Manual Logic check
$slotStart = '14:00:00';
$schedStart = '09:00:00';
$schedEnd = '17:00:00';
echo "Test Slot: $slotStart against Schedule: $schedStart - $schedEnd\n";
if ($slotStart < $schedStart || $slotStart > $schedEnd) { // logic in API was slotEnd > schedEnd
    echo "Slot OUTSIDE working hours\n";
} else {
    echo "Slot INSIDE working hours\n";
}

?>
