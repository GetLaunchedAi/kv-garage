<?php
// save-packs.php (no auth required)
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

// POST only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$packsFile = __DIR__ . '/../data/packs.json';
$uploadDir = __DIR__ . '/../images/products/';

if (!file_exists($packsFile)) {
  file_put_contents($packsFile, json_encode(['packs' => []], JSON_PRETTY_PRINT));
}

$store = json_decode(file_get_contents($packsFile), true);
if (!isset($store['packs']) || !is_array($store['packs'])) $store = ['packs' => []];

// Accept JSON (API) or multipart form (admin UI)
if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
  $pack  = json_decode(file_get_contents('php://input'), true)['product'] ?? [];
  $files = [];
} else {
  $pack  = $_POST;
  $files = $_FILES;
}

// ---- IMAGE UPLOAD HANDLING (secure validation, no auth) ----
$newImageUrl = null;

if (isset($files['image']) && $files['image']['error'] === UPLOAD_ERR_OK) {
  // Validate size
  $maxBytes = 8 * 1024 * 1024;
  if ($files['image']['size'] > $maxBytes) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'File too large (max 8MB)']);
    exit;
  }

  // Validate MIME
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime  = $finfo->file($files['image']['tmp_name']);
  $allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
  ];
  if (!isset($allowed[$mime])) {
    http_response_code(415);
    echo json_encode(['ok' => false, 'error' => 'Unsupported image type']);
    exit;
  }

  // Slugify
  function slug($s) {
    $s = preg_replace('~[^\pL\d]+~u', '-', $s);
    $s = trim($s, '-');
    $s = @iconv('UTF-8', 'ASCII//TRANSLIT', $s);
    $s = preg_replace('~[^-\w]+~', '', $s);
    $s = strtolower($s);
    return $s ?: 'product';
  }

  // Use product name (various fallbacks)
  $slug = slug($pack['name'] ?? $pack['productName'] ?? 'pack');
  $ext  = $allowed[$mime];

  if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

  $filename  = "{$slug}_" . time() . ".{$ext}";
  $destPath  = $uploadDir . $filename;

  if (!move_uploaded_file($files['image']['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save file']);
    exit;
  }
  @chmod($destPath, 0644);
  $newImageUrl = '/images/products/' . $filename;
}

// ---- RESOLVE ID ----
$id = isset($pack['id']) && $pack['id'] !== '' ? (int)$pack['id'] : null;
if ($id === null) {
  $max = 0; foreach ($store['packs'] as $p) { $max = max($max, (int)$p['id']); }
  $id = $max + 1;
}
$pack['id'] = $id;

// Find existing pack (if any)
$idx = null;
foreach ($store['packs'] as $i => $p) {
  if ((int)$p['id'] === $id) { $idx = $i; break; }
}
$existing = $idx !== null ? $store['packs'][$idx] : [];

// ---- IMAGE FIELD ASSIGNMENT ----
if ($newImageUrl) {
  $pack['image_url'] = $newImageUrl;
  $pack['image']     = $newImageUrl;
} else {
  if (!isset($pack['image_url']) || $pack['image_url'] === '') {
    if (isset($existing['image_url'])) $pack['image_url'] = $existing['image_url'];
  }
  if (!isset($pack['image']) || $pack['image'] === '') {
    if (isset($existing['image'])) $pack['image'] = $existing['image'];
  }
}

// ---- NORMALIZE FIELDS ----
$pack['name']                  = $pack['name'] ?? ($existing['name'] ?? 'Untitled Pack');
$pack['slug']                  = strtolower(preg_replace('/[^a-z0-9]+/i','-', $pack['name']));
$pack['price']                 = isset($pack['price']) ? (float)$pack['price'] : (float)($existing['price'] ?? 0);
$pack['deposit_price']         = isset($pack['deposit_price']) ? (float)$pack['deposit_price'] : (float)($existing['deposit_price'] ?? 0);
$pack['number_of_units']       = isset($pack['number_of_units']) ? (int)$pack['number_of_units'] : (int)($existing['number_of_units'] ?? 0);
$pack['available_quantity']    = isset($pack['available_quantity']) ? (int)$pack['available_quantity'] : (int)($existing['available_quantity'] ?? $pack['number_of_units']);
$pack['status']                = $pack['status'] ?? ($existing['status'] ?? 'available');
$pack['estimated_resale_value']= $pack['estimated_resale_value'] ?? ($existing['estimated_resale_value'] ?? '');
$pack['short_description']     = $pack['short_description'] ?? ($existing['short_description'] ?? '');
$pack['description']           = $pack['description'] ?? ($existing['description'] ?? '');
$pack['created_at']            = $existing['created_at'] ?? date('c');
$pack['type']                  = $pack['type'] ?? ($existing['type'] ?? 'starter');

// ---- UPSERT ----
if ($idx !== null) {
  $store['packs'][$idx] = array_merge($existing, $pack);
} else {
  $store['packs'][] = $pack;
}

error_log('Saving packs file to ' . $packsFile);
error_log('JSON content: ' . json_encode($store));

// ---- SAVE ----
if (file_put_contents($packsFile, json_encode($store, JSON_PRETTY_PRINT))) {
  echo json_encode([
    'ok'      => true,
    'message' => $idx !== null ? 'Pack updated successfully' : 'Pack created successfully',
    'pack'    => $pack
  ]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Failed to save packs.json']);
}
