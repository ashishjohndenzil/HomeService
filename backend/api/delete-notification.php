<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Auth Token Verification
$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
} elseif (isset($_POST['token'])) {
    $token = $_POST['token'];
}

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

try {
    // Verify token
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid or expired token']));
    }

    $user_id = $session['user_id'];

    // Get Data
    $data = json_decode(file_get_contents("php://input"), true);
    $notification_id = isset($data['notification_id']) ? $data['notification_id'] : null;
    $delete_all = isset($data['delete_all']) ? $data['delete_all'] : false;

    if ($delete_all) {
        // Delete all notifications for this user
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true, 'message' => 'All notifications cleared']);

    } elseif ($notification_id) {
        // Delete specific notification (must belong to user)
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
        $stmt->execute([$notification_id, $user_id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Notification deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Notification not found']);
        }

    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing notification_id or delete_all flag']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
