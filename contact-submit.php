<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

function json_response($status_code, $success, $message) {
    http_response_code($status_code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Method not allowed.');
}

function field_value($key) {
    return trim($_POST[$key] ?? '');
}

function header_value($value) {
    return preg_replace('/[\r\n]+/', ' ', $value);
}

$name = field_value('name');
$email = field_value('email');
$phone = field_value('phone');
$business = field_value('business');
$topic = field_value('topic');
$message = field_value('message');

if (strlen($name) < 2) {
    json_response(422, false, 'Please enter your full name.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, false, 'Please enter a valid email address.');
}

if (strlen($message) < 10) {
    json_response(422, false, 'Please enter a message with at least 10 characters.');
}

$topic_labels = [
    'demo' => 'Book a Product Demo',
    'fudo' => 'FUDO - Restaurant POS',
    'repos' => 'RePOS - Retail POS',
    'pricing' => 'Pricing Enquiry',
    'support' => 'Technical Support',
    'other' => 'General Enquiry',
];

$topic_label = $topic_labels[$topic] ?? 'General enquiry';
$recipient = 'sales@magnexsolutions.com';
$safe_name = header_value($name);
$subject = 'Website enquiry from ' . $safe_name;

$body = implode("\n", [
    'New enquiry from the Magnex Solutions website:',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
    'Phone: ' . ($phone !== '' ? $phone : 'Not provided'),
    'Business: ' . ($business !== '' ? $business : 'Not provided'),
    'Topic: ' . $topic_label,
    '',
    'Message:',
    $message,
    '',
    'Please reply to the customer using the email address above.',
]);

$headers = [
    'From: Magnex Solutions Website <noreply@magnexsolutions.com>',
    'Reply-To: ' . $safe_name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail($recipient, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    json_response(
        500,
        false,
        'The server could not send the email. Please confirm PHP mail is enabled by your hosting provider.'
    );
}

json_response(200, true, 'Message sent successfully.');
