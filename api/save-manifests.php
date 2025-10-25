<?php
header('Content-Type: application/json');

// ✅ Correct relative path for your setup
$manifestFile = __DIR__ . '/../data/manifests.json';
$packsFile = __DIR__ . '/../data/packs.json';

// --- Ensure manifests.json exists ---
if (!file_exists($manifestFile)) {
    file_put_contents($manifestFile, json_encode(['manifests' => new stdClass()], JSON_PRETTY_PRINT));
}
$manifestsData = json_decode(file_get_contents($manifestFile), true);
if (!isset($manifestsData['manifests']) || !is_array($manifestsData['manifests'])) {
    $manifestsData = ['manifests' => []];
}

// --- Load packs.json and verify ID exists ---
if (!file_exists($packsFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'packs.json not found']);
    exit;
}
$packsData = json_decode(file_get_contents($packsFile), true);
if (!isset($packsData['packs']) || !is_array($packsData['packs'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid packs.json structure']);
    exit;
}

// --- Validate request ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_POST['pack_id']) || $_POST['pack_id'] === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing pack_id']);
    exit;
}

if (!isset($_FILES['manifest']) || $_FILES['manifest']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing manifest file or upload error']);
    exit;
}

$packId = (int) $_POST['pack_id'];

// --- Check if pack exists in packs.json ---
$packExists = false;
foreach ($packsData['packs'] as $pack) {
    if ((int)$pack['id'] === $packId) {
        $packExists = true;
        break;
    }
}
if (!$packExists) {
    http_response_code(404);
    echo json_encode(['error' => 'Pack ID ' . $packId . ' not found in packs.json']);
    exit;
}

// --- Parse uploaded CSV ---
$tmpPath = $_FILES['manifest']['tmp_name'];
if (!($csv = fopen($tmpPath, 'r'))) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to read uploaded CSV']);
    exit;
}

$headers = fgetcsv($csv);
if (!$headers) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid CSV (missing header row)']);
    exit;
}

// Normalize headers (lowercase, underscores)
$headers = array_map(fn($h) => strtolower(trim(str_replace([' ', '-'], '_', $h))), $headers);

// Map common variations to canonical field names
$aliases = [
    'product_name' => 'item_name',
    'name' => 'item_name',
    'product' => 'item_name',
    'qty' => 'quantity',
    'qnty' => 'quantity',
    'amount' => 'quantity',
    'value' => 'estimated_value',
    'est_value' => 'estimated_value',
    'est_val' => 'estimated_value',
    'price' => 'estimated_value',
    'est' => 'estimated_value',
];

// Parse rows
$items = [];
while (($row = fgetcsv($csv)) !== false) {
    if (count($row) === 0) continue;

    $item = [];
    foreach ($headers as $i => $key) {
        $canonical = $aliases[$key] ?? $key;
        $item[$canonical] = $row[$i] ?? '';
    }

    // Type cast important numeric fields
    if (isset($item['quantity']) && $item['quantity'] !== '') {
        $item['quantity'] = (int)$item['quantity'];
    }
    if (isset($item['estimated_value']) && $item['estimated_value'] !== '') {
        $item['estimated_value'] = (float)$item['estimated_value'];
    }

    // Default fallbacks for missing fields
    $item['condition'] = $item['condition'] ?? 'new';
    $item['notes'] = $item['notes'] ?? '';
    $item['category'] = $item['category'] ?? 'Misc';
    $item['brand'] = $item['brand'] ?? 'Generic';

    $items[] = $item;
}
fclose($csv);


// --- Write to manifests.json ---
$manifestsData['manifests'][(string)$packId] = $items;

if (!is_writable(dirname($manifestFile))) {
    http_response_code(500);
    echo json_encode(['error' => 'Directory not writable: ' . dirname($manifestFile)]);
    exit;
}

if (file_put_contents($manifestFile, json_encode($manifestsData, JSON_PRETTY_PRINT))) {
    echo json_encode([
        'success' => true,
        'message' => 'Manifest uploaded successfully',
        'pack_id' => $packId,
        'item_count' => count($items)
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save manifests.json']);
}
?>
