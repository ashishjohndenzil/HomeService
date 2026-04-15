<?php
require_once 'config.php';

$reviews = $pdo->query("SELECT id, booking_id, rating FROM reviews")->fetchAll(PDO::FETCH_ASSOC);
echo "REVIEWS:\n" . json_encode($reviews) . "\n\n";

$bookings = $pdo->query("SELECT id, status FROM bookings ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "BOOKINGS:\n" . json_encode($bookings) . "\n\n";
?>
