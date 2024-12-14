<?php
header("Content-Type: application/json");
$eventsFile = "events.json";

if (!file_exists($eventsFile)) {
    file_put_contents($eventsFile, json_encode([]));
}

$storedEvents = json_decode(file_get_contents($eventsFile), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (isset($input['events']) && is_array($input['events'])) {
        foreach ($input['events'] as $event) {
            if (isset($event['id'], $event['time'], $event['message'])) {
                $storedEvents[] = $event;
            }
        }
        file_put_contents($eventsFile, json_encode($storedEvents, JSON_PRETTY_PRINT));
        echo json_encode(["status" => "success", "message" => "Events saved successfully"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Incorrect data"]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(["events" => $storedEvents]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    file_put_contents($eventsFile, json_encode([]));
    echo json_encode(["status" => "success", "message" => "Events successfully deleted"]);
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Request method not supported"]);
}
