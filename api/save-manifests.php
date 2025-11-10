<?php
// Suppress error display and capture errors
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

// Handle CORS for local development and production
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    // Local development
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Production - Add your Cloudways domain here
    'https://www.kvgarage.com',
    'https://kvgarage.com',
    // Add any other domains you need (staging, etc.)
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback: only allow * in development, restrict in production
    // For production, you should add your domain above instead of using *
    $isProduction = !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:8000']);
    if (!$isProduction) {
        header('Access-Control-Allow-Origin: *');
    } else {
        // In production, reject unknown origins
        ob_clean();
        http_response_code(403);
        echo json_encode(['error' => 'Origin not allowed']);
        ob_end_flush();
        exit;
    }
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    ob_end_flush();
    exit;
}

header('Content-Type: application/json');

// Find project root and public directory (same logic as save-packs.php)
$scriptDir = __DIR__;
$projectRoot = dirname($scriptDir);

// Determine if we're in production (Cloudways)
$isProduction = !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) 
    && strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') === false;

// Try to find public directory (check multiple common locations)
$publicDir = null;
$possiblePublicDirs = [];

if ($isProduction && !empty($_SERVER['DOCUMENT_ROOT'])) {
    // Production: prioritize document root
    $possiblePublicDirs[] = $_SERVER['DOCUMENT_ROOT'];
    $possiblePublicDirs[] = $projectRoot . '/public_html';  // Cloudways
    $possiblePublicDirs[] = $projectRoot . '/../public_html';  // Cloudways
    $possiblePublicDirs[] = $projectRoot . '/public';
    $possiblePublicDirs[] = $projectRoot . '/../public';
} else {
    // Development: check local paths first
    $possiblePublicDirs[] = $projectRoot . '/public';
    $possiblePublicDirs[] = $projectRoot . '/../public';
    $possiblePublicDirs[] = $_SERVER['DOCUMENT_ROOT'] ?? null;
    $possiblePublicDirs[] = $projectRoot . '/public_html';
    $possiblePublicDirs[] = $projectRoot . '/../public_html';
}

foreach ($possiblePublicDirs as $dir) {
    if ($dir && is_dir($dir)) {
        $publicDir = realpath($dir);
        break;
    }
}

// Fallback: if script is in /api, try parent/public or parent/public_html
if (!$publicDir) {
    if (basename($projectRoot) === 'api') {
        $parent = dirname($projectRoot);
        if (is_dir($parent . '/public')) {
            $publicDir = realpath($parent . '/public');
        } elseif (is_dir($parent . '/public_html')) {
            $publicDir = realpath($parent . '/public_html');
        }
    }
}

// Final fallback
if (!$publicDir) {
    $publicDir = $projectRoot;
}

// Find data directory
$dataDir = null;
$possibleDataDirs = [
    $publicDir . '/data',
    $projectRoot . '/public/data',
    $projectRoot . '/../public/data',
    $projectRoot . '/data',
    $projectRoot . '/../data',
];

foreach ($possibleDataDirs as $dir) {
    if (is_dir($dir)) {
        $dataDir = realpath($dir);
        break;
    }
}

// Fallback for data directory
if (!$dataDir) {
    $dataDir = $publicDir . '/data';
}

// Set file paths
$manifestFileData = $dataDir . '/manifests.json';
$manifestFilePublic = $publicDir . '/data/manifests.json';
$manifestFile = file_exists($manifestFilePublic) ? $manifestFilePublic : $manifestFileData;

$packsFileData = $dataDir . '/packs.json';
$packsFilePublic = $publicDir . '/data/packs.json';
$packsFile = file_exists($packsFilePublic) ? $packsFilePublic : $packsFileData;

// Ensure data directory exists with proper permissions
$dataDirPath = dirname($manifestFile);
if (!is_dir($dataDirPath)) {
    @mkdir($dataDirPath, 0775, true);
    if (is_dir($dataDirPath)) {
        @chmod($dataDirPath, 0775);
    }
}

// --- Ensure manifests.json exists ---
if (!file_exists($manifestFile)) {
    $initialData = ['manifests' => []];
    @mkdir(dirname($manifestFile), 0775, true);
    file_put_contents($manifestFile, json_encode($initialData, JSON_PRETTY_PRINT));
}
$manifestsData = json_decode(file_get_contents($manifestFile), true);
if (!isset($manifestsData['manifests']) || !is_array($manifestsData['manifests'])) {
    $manifestsData = ['manifests' => []];
}

// --- Load packs.json and verify ID exists ---
if (!file_exists($packsFile)) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'packs.json not found at: ' . $packsFile]);
    ob_end_flush();
    exit;
}
$packsData = json_decode(file_get_contents($packsFile), true);
if (!isset($packsData['packs']) || !is_array($packsData['packs'])) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Invalid packs.json structure']);
    ob_end_flush();
    exit;
}

// --- Validate request ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_clean();
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    ob_end_flush();
    exit;
}

if (!isset($_POST['pack_id']) || $_POST['pack_id'] === '') {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Missing pack_id']);
    ob_end_flush();
    exit;
}

if (!isset($_FILES['manifest']) || $_FILES['manifest']['error'] !== UPLOAD_ERR_OK) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Missing manifest file or upload error']);
    ob_end_flush();
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
    ob_clean();
    http_response_code(404);
    echo json_encode(['error' => 'Pack ID ' . $packId . ' not found in packs.json']);
    ob_end_flush();
    exit;
}

// --- Parse uploaded CSV ---
$tmpPath = $_FILES['manifest']['tmp_name'];
if (!($csv = fopen($tmpPath, 'r'))) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Failed to read uploaded CSV']);
    ob_end_flush();
    exit;
}

$headers = fgetcsv($csv);
if (!$headers) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid CSV (missing header row)']);
    ob_end_flush();
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

// Ensure directory exists and is writable
$manifestDir = dirname($manifestFile);
if (!is_dir($manifestDir)) {
    @mkdir($manifestDir, 0775, true);
    if (is_dir($manifestDir)) {
        @chmod($manifestDir, 0775);
    }
}

if (!is_writable($manifestDir)) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Directory not writable: ' . $manifestDir]);
    ob_end_flush();
    exit;
}

// Save to both locations if they differ
$jsonData = json_encode($manifestsData, JSON_PRETTY_PRINT);
if ($jsonData === false) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'JSON encode failed: ' . json_last_error_msg()]);
    ob_end_flush();
    exit;
}

// Clear any output that might have been generated
ob_clean();

// Save to primary location
if (file_put_contents($manifestFile, $jsonData)) {
    // Also save to data directory if different
    if ($manifestFileData !== $manifestFile && is_dir(dirname($manifestFileData))) {
        @mkdir(dirname($manifestFileData), 0775, true);
        file_put_contents($manifestFileData, $jsonData);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Manifest uploaded successfully',
        'pack_id' => $packId,
        'item_count' => count($items)
    ]);
} else {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save manifests.json to: ' . $manifestFile]);
}

// End output buffering and send output
ob_end_flush();
?>
