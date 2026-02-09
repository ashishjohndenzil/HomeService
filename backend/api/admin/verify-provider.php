<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

// In a real app, strict Admin Token Validation should be here.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->user_id) || !isset($data->is_verified)) {
        echo json_encode(['success' => false, 'message' => 'Missing ID or Status']);
        exit;
    }

    $userId = $data->user_id;
    $isVerified = $data->is_verified; // 1 or 0

    try {
        // Query to update local provider
        // We update based on user_id as that's what the frontend passes
        $stmt = $pdo->prepare("UPDATE providers SET is_verified = ? WHERE user_id = ?");
        $stmt->execute([$isVerified, $userId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Provider status updated']);
        } else {
            // It might return 0 if the value was already the same, check validity
            // Check if provider exists
            $check = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
            $check->execute([$userId]);
            if ($check->fetch()) {
                 echo json_encode(['success' => true, 'message' => 'Status already set or updated']);
            } else {
                 echo json_encode(['success' => false, 'message' => 'Provider not found']);
            }
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
