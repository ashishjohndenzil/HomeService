<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Auth Check
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

if (!$token) {
    handleError('Unauthorized', 401);
}

try {
    // Verify token
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        handleError('Invalid or expired token', 401);
    }

    $user_id = $session['user_id'];

    // Check file upload
    if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
        handleError('No file uploaded or upload error');
    }

    $file = $_FILES['profile_image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    // Validation
    if (!in_array($file['type'], $allowedTypes)) {
        handleError('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
    }

    if ($file['size'] > $maxSize) {
        handleError('File too large. Maximum size is 5MB.');
    }

    // Prepare upload directory
    $uploadDir = '../uploads/profiles/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'user_' . $user_id . '_' . time() . '.' . $extension;
    $targetPath = $uploadDir . $filename;
    
    // Relative path for storage (accessible via URL)
    $dbPath = 'uploads/profiles/' . $filename; // Depending on how you serve files, this might need adjustment (e.g. absolute URL)
    // Actually, let's store relative to root, so frontend can prepend domain or relative path
    // But frontend is in 'frontend/', backend is in 'backend/'. 
    // Best to store: '../backend/uploads/profiles/filename' relative to frontend? 
    // Or just absolute URL 'http://localhost/HomeService/backend/uploads/profiles/...'
    
    // Let's use flexible path storage: 'backend/uploads/profiles/...'
    // And ensure frontend knows to look there.
    // Actually, `../backend/uploads/profiles/$filename` is good for frontend relative path if generic.
    // Let's stick to storing the relative path from the project root or the full URL.
    $publicPath = '../backend/uploads/profiles/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Update DB
        $update = $pdo->prepare("UPDATE users SET profile_image = ? WHERE id = ?");
        $update->execute([$publicPath, $user_id]);

        sendResponse([
            'success' => true, 
            'message' => 'Profile image updated successfully',
            'image_url' => $publicPath
        ]);
    } else {
        handleError('Failed to move uploaded file');
    }

} catch (Exception $e) {
    handleError('Server error: ' . $e->getMessage(), 500);
}
?>
