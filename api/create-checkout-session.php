<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../vendor/autoload.php';
header('Content-Type: application/json');

\Stripe\Stripe::setApiKey('sk_test_51SIugHRTEiNjfzF8N8zMrBYuVgL8AkoDbvv6nFbNMlWIbmI8EcrFare32qkRIhXYi2g0UuXl7GigHse0ZqFceHc100xTPdXfg2');

try {
  $json = json_decode(file_get_contents('php://input'), true);
  if (empty($json['items'])) {
    throw new Exception('No items in cart payload.');
  }

  $baseUrl = 'https://kvgarage.com';
  $line_items = [];

  foreach ($json['items'] as $item) {
    $price = isset($item['price']) ? (float)$item['price'] : 0;
    $qty   = isset($item['quantity']) ? (int)$item['quantity'] : 1;
    if ($price <= 0) continue;

    // ✅ ensure image URLs are absolute HTTPS (Stripe requires this)
    $image = '';
    if (!empty($item['image'])) {
      $img = trim($item['image']);
      if (!preg_match('/^https?:\/\//i', $img)) {
        $img = $baseUrl . $img; // prepend domain to relative paths
      }
      $image = $img;
    }

    // Extract metadata for reservations
    $metadata = isset($item['metadata']) ? $item['metadata'] : [];
    $itemType = $metadata['type'] ?? 'purchase';
    $originalAction = $metadata['originalAction'] ?? 'buy';
    $fullAmount = $metadata['fullAmount'] ?? $price;
    $depositAmount = $metadata['depositAmount'] ?? 0;

    $line_items[] = [
      'price_data' => [
        'currency' => 'usd',
        'product_data' => [
          'name'   => $item['name'] ?? 'Untitled Item',
          'images' => $image ? [$image] : [],
          'metadata' => [
            'type' => $itemType,
            'original_action' => $originalAction,
            'full_amount' => $fullAmount,
            'deposit_amount' => $depositAmount
          ]
        ],
        'unit_amount' => round($price * 100),
      ],
      'quantity' => max(1, $qty),
    ];
  }

  if (empty($line_items)) {
    throw new Exception('No valid line items found.');
  }

  // ✅ Use absolute HTTPS URLs for redirect pages
  $session = \Stripe\Checkout\Session::create([
    'mode' => 'payment',
    'line_items' => $line_items,
    'success_url' => $baseUrl . '/success.html?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url'  => $baseUrl . '/cancel.html',
  ]);

  echo json_encode(['ok' => true, 'url' => $session->url]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
