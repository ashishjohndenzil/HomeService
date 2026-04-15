<?php
// A simple CLI script to test live endpoints and capture raw output
$url = 'http://homeservice.fwh.is/backend/api/admin/dashboard-stats.php';

// Login first to get a token
$loginUrl = 'http://homeservice.fwh.is/backend/api/login.php';
$loginData = json_encode(['email' => 'admin@homeservice.com', 'password' => 'admin123']);

$ch = curl_init($loginUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

$token = '';
$data = json_decode($response, true);
if (isset($data['token'])) {
    $token = $data['token'];
    echo "Login successful. Token acquired.\n";
} else {
    echo "Login failed. Raw response:\n" . $response . "\n";
    exit;
}

// Now hit the failing endpoint
echo "Testing $url...\n";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token
]);
$finalResponse = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpcode\n";
echo "Raw Response:\n";
echo $finalResponse . "\n";
?>
