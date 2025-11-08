<?php
// Simple product save endpoint

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';

$allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.kvgarage.com',
    'https://kvgarage.com',
];

$isDev = in_array($host, ['localhost', '127.0.0.1', 'localhost:8000']) || strpos($host, 'localhost') !== false;

// Allow same-origin requests (when origin is empty)
if (empty($origin)) {
    // Same-origin request, allow it
    header('Access-Control-Allow-Origin: *');
} elseif (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif ($isDev) {
    header('Access-Control-Allow-Origin: *');
} else {
    // Production: check if origin matches host
    $originHost = parse_url($origin, PHP_URL_HOST);
    if ($originHost === $host || $originHost === 'www.' . $host || 'www.' . $originHost === $host) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Origin not allowed', 'origin' => $origin, 'host' => $host]);
        exit;
    }
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// File paths - handle /api, /public/api, and Cloudways public_html
$scriptDir = __DIR__;
$projectRoot = dirname($scriptDir);

// Determine if we're in production (Cloudways)
$isProduction = !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) 
    && strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') === false;

// Try to find public directory (check multiple common locations)
// On production, prioritize DOCUMENT_ROOT as it's most reliable
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

// Find source data directory (for Eleventy passthrough)
$dataDir = null;
$possibleDataDirs = [
    $projectRoot . '/src/_data',
    $projectRoot . '/../src/_data',
    $projectRoot . '/_data',
    $projectRoot . '/../_data',
];

foreach ($possibleDataDirs as $dir) {
    if (is_dir($dir)) {
        $dataDir = realpath($dir);
        break;
    }
}

// Fallback for data directory
if (!$dataDir) {
    $dataDir = $projectRoot;
}

// Save to both locations: public (immediate) and src/_data (persists through rebuilds)
$productsFilePublic = $publicDir . '/products.json';
$productsFileData = $dataDir . '/products.json';
$productsFile = $productsFilePublic; // Primary file to read/write
$uploadDir = $publicDir . '/images/products/';

// Ensure upload directory exists with proper permissions
// Create parent directories if they don't exist
$imagesDir = $publicDir . '/images';
$productsDir = $imagesDir . '/products';

if (!is_dir($imagesDir)) {
    @mkdir($imagesDir, 0775, true);
    if (is_dir($imagesDir)) {
        @chmod($imagesDir, 0775);
    }
}

if (!is_dir($uploadDir)) {
    $created = @mkdir($uploadDir, 0775, true);
    if (!$created && !is_dir($uploadDir)) {
        // Try with 0755 if 0775 fails
        $created = @mkdir($uploadDir, 0755, true);
    }
    // Set permissions on the directory if it exists
    if (is_dir($uploadDir)) {
        @chmod($uploadDir, 0775);
    }
}

// Helper function
function slug($s) {
    $s = preg_replace('~[^\pL\d]+~u', '-', $s);
    $s = trim($s, '-');
    $s = @iconv('UTF-8', 'ASCII//TRANSLIT', $s);
    $s = preg_replace('~[^-\w]+~', '', $s);
    $s = strtolower($s);
    return $s ?: 'product';
}

// Load products - try public first, then data directory
$productsFileToLoad = file_exists($productsFilePublic) ? $productsFilePublic : $productsFileData;
if (!file_exists($productsFileToLoad)) {
    $store = [
        'source' => 'https://www.kvgarage.com/',
        'generated_at' => date('c'),
        'currency' => 'USD',
        'products' => []
    ];
    @mkdir(dirname($productsFilePublic), 0755, true);
    @mkdir(dirname($productsFileData), 0755, true);
    file_put_contents($productsFilePublic, json_encode($store, JSON_PRETTY_PRINT));
    file_put_contents($productsFileData, json_encode($store, JSON_PRETTY_PRINT));
} else {
    $json = file_get_contents($productsFileToLoad);
    $store = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($store['products'] ?? null)) {
        $store = [
            'source' => 'https://www.kvgarage.com/',
            'generated_at' => date('c'),
            'currency' => 'USD',
            'products' => []
        ];
    }
}

// Get input
$isJson = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;
if ($isJson) {
    $product = json_decode(file_get_contents('php://input'), true) ?: [];
    $files = [];
} else {
    $product = $_POST;
    $files = $_FILES;
}

// Handle delete
if (($product['action'] ?? '') === 'delete') {
    $targetId = !empty($product['id']) ? (int)$product['id'] : null;
    $targetSlug = !empty($product['slug']) ? slug($product['slug']) : null;
    
    if (!$targetId && !$targetSlug) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing id or slug']);
        exit;
    }
    
    $idx = null;
    foreach ($store['products'] as $i => $p) {
        if (($targetId && (int)($p['id'] ?? 0) === $targetId) || 
            ($targetSlug && slug($p['slug'] ?? '') === $targetSlug)) {
            $idx = $i;
            break;
        }
    }
    
    if ($idx === null) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Product not found']);
        exit;
    }
    
    // Delete images if requested
    if (!empty($product['delete_images'])) {
        $images = $store['products'][$idx]['images'] ?? [];
        if (empty($images) && !empty($store['products'][$idx]['image'])) {
            $images = [$store['products'][$idx]['image']];
        }
        foreach ($images as $img) {
            if (is_string($img) && $img) {
                $path = $publicDir . '/' . ltrim($img, '/');
                $realPath = realpath($path);
                if ($realPath && strpos($realPath, realpath($publicDir)) === 0) {
                    @unlink($realPath);
                }
            }
        }
    }
    
    array_splice($store['products'], $idx, 1);
    $store['generated_at'] = date('c');
    
    $jsonData = json_encode($store, JSON_PRETTY_PRINT);
    @mkdir(dirname($productsFilePublic), 0755, true);
    @mkdir(dirname($productsFileData), 0755, true);
    
    $result1 = @file_put_contents($productsFilePublic, $jsonData);
    $result2 = @file_put_contents($productsFileData, $jsonData);
    
    if ($result1 !== false || $result2 !== false) {
        echo json_encode(['ok' => true, 'message' => 'Deleted']);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Save failed']);
    }
    exit;
}

// Handle image uploads
$newImages = [];
$removedImages = [];

if (!empty($product['removed_images'])) {
    $removed = json_decode($product['removed_images'], true);
    if (is_array($removed)) {
        $removedImages = $removed;
    }
}

if (!empty($files['images']['name']) && is_array($files['images']['name'])) {
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $maxSize = 8 * 1024 * 1024;
    
    // Ensure directory exists
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0775, true);
        if (is_dir($uploadDir)) {
            @chmod($uploadDir, 0775);
        }
    }
    
    // Check if directory is writable
    if (!is_writable($uploadDir)) {
        http_response_code(500);
        echo json_encode([
            'ok' => false, 
            'error' => 'Upload directory is not writable',
            'upload_dir' => $uploadDir,
            'public_dir' => $publicDir,
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set'
        ]);
        exit;
    }
    
    for ($i = 0; $i < count($files['images']['name']); $i++) {
        if ($files['images']['error'][$i] !== UPLOAD_ERR_OK) {
            continue;
        }
        if ($files['images']['size'][$i] > $maxSize) {
            http_response_code(413);
            echo json_encode(['ok' => false, 'error' => 'File too large']);
            exit;
        }
        
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($files['images']['tmp_name'][$i]);
        if (!isset($allowed[$mime])) {
            http_response_code(415);
            echo json_encode(['ok' => false, 'error' => 'Invalid image type']);
            exit;
        }
        
        $slug = slug($product['title'] ?? 'product');
        $ext = $allowed[$mime];
        $filename = $slug . '_' . time() . '_' . $i . '.' . $ext;
        $dest = $uploadDir . $filename;
        
        if (move_uploaded_file($files['images']['tmp_name'][$i], $dest)) {
            @chmod($dest, 0644);
            // Verify file was created and is readable
            if (file_exists($dest) && is_readable($dest)) {
                $newImages[] = '/images/products/' . $filename;
            } else {
                http_response_code(500);
                echo json_encode([
                    'ok' => false, 
                    'error' => 'File uploaded but not accessible',
                    'file' => $dest,
                    'exists' => file_exists($dest),
                    'readable' => is_readable($dest)
                ]);
                exit;
            }
        } else {
            http_response_code(500);
            echo json_encode([
                'ok' => false, 
                'error' => 'Failed to move uploaded file',
                'dest' => $dest,
                'upload_dir_writable' => is_writable($uploadDir)
            ]);
            exit;
        }
    }
} elseif (!empty($files['image']['tmp_name']) && $files['image']['error'] === UPLOAD_ERR_OK) {
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $maxSize = 8 * 1024 * 1024;
    
    if ($files['image']['size'] > $maxSize) {
        http_response_code(413);
        echo json_encode(['ok' => false, 'error' => 'File too large']);
        exit;
    }
    
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($files['image']['tmp_name']);
    if (!isset($allowed[$mime])) {
        http_response_code(415);
        echo json_encode(['ok' => false, 'error' => 'Invalid image type']);
        exit;
    }
    
    // Ensure directory exists
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0775, true);
        if (is_dir($uploadDir)) {
            @chmod($uploadDir, 0775);
        }
    }
    
    // Check if directory is writable
    if (!is_writable($uploadDir)) {
        http_response_code(500);
        echo json_encode([
            'ok' => false, 
            'error' => 'Upload directory is not writable',
            'upload_dir' => $uploadDir,
            'public_dir' => $publicDir,
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set'
        ]);
        exit;
    }
    
    $slug = slug($product['title'] ?? 'product');
    $ext = $allowed[$mime];
    $filename = $slug . '_' . time() . '.' . $ext;
    $dest = $uploadDir . $filename;
    
    if (move_uploaded_file($files['image']['tmp_name'], $dest)) {
        @chmod($dest, 0644);
        // Verify file was created and is readable
        if (file_exists($dest) && is_readable($dest)) {
            $newImages[] = '/images/products/' . $filename;
        } else {
            http_response_code(500);
            echo json_encode([
                'ok' => false, 
                'error' => 'File uploaded but not accessible',
                'file' => $dest,
                'exists' => file_exists($dest),
                'readable' => is_readable($dest)
            ]);
            exit;
        }
    } else {
        http_response_code(500);
        echo json_encode([
            'ok' => false, 
            'error' => 'Failed to move uploaded file',
            'dest' => $dest,
            'upload_dir_writable' => is_writable($uploadDir)
        ]);
        exit;
    }
}

// Get or create ID
$id = !empty($product['id']) ? (int)$product['id'] : null;
if (!$id) {
    $max = 0;
    foreach ($store['products'] as $p) {
        $max = max($max, (int)($p['id'] ?? 0));
    }
    $id = $max + 1;
}

// Find existing product
$idx = null;
$existing = [];
foreach ($store['products'] as $i => $p) {
    if ((int)($p['id'] ?? 0) === $id) {
        $idx = $i;
        $existing = $p;
        break;
    }
}

// Handle images
$existingImages = $existing['images'] ?? [];
if (empty($existingImages) && !empty($existing['image'])) {
    $existingImages = [$existing['image']];
}

// Remove deleted images
if (!empty($removedImages)) {
    $existingImages = array_values(array_filter($existingImages, function($img) use ($removedImages) {
        return !in_array($img, $removedImages);
    }));
}

// Merge images
$allImages = array_merge($existingImages, $newImages);
if (!empty($allImages)) {
    $product['images'] = $allImages;
    $product['image'] = $allImages[0];
} elseif (!empty($existing['image'])) {
    $product['image'] = $existing['image'];
    $product['images'] = $existing['images'] ?? [$existing['image']];
}

// Normalize fields
$product['id'] = $id;
$product['title'] = $product['title'] ?? $existing['title'] ?? 'Untitled Product';
$product['category'] = $product['category'] ?? $existing['category'] ?? '';
$product['price'] = isset($product['price']) ? (float)$product['price'] : (float)($existing['price'] ?? 0);
$product['currency'] = $product['currency'] ?? $existing['currency'] ?? $store['currency'] ?? 'USD';
$product['description'] = $product['description'] ?? $existing['description'] ?? '';
$product['status'] = $product['status'] ?? $existing['status'] ?? 'New Arrival';
$product['quantity'] = $product['quantity'] ?? $existing['quantity'] ?? null;

// Handle inStock
if (isset($product['inStock'])) {
    $val = is_array($product['inStock']) ? end($product['inStock']) : $product['inStock'];
    $product['inStock'] = filter_var($val, FILTER_VALIDATE_BOOLEAN);
} else {
    $product['inStock'] = $existing['inStock'] ?? ($product['price'] > 0);
}

// Generate slug and SKU
$product['slug'] = !empty($product['slug']) ? slug($product['slug']) : slug($product['title']);
$product['sku'] = !empty($product['sku']) ? slug($product['sku']) : $product['slug'];

// Generate URL
$baseUrl = rtrim($store['source'] ?? 'https://www.kvgarage.com', '/');
$product['url'] = $baseUrl . '/products/' . $product['slug'];

// Set timestamps
$product['created_at'] = $existing['created_at'] ?? date('c');
$store['generated_at'] = date('c');

// Save
if ($idx !== null) {
    $store['products'][$idx] = array_merge($existing, $product);
} else {
    $store['products'][] = $product;
}

$jsonData = json_encode($store, JSON_PRETTY_PRINT);
if ($jsonData === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'JSON encode failed: ' . json_last_error_msg()]);
    exit;
}

// Save to both locations
@mkdir(dirname($productsFilePublic), 0755, true);
@mkdir(dirname($productsFileData), 0755, true);

$result1 = @file_put_contents($productsFilePublic, $jsonData);
$result2 = @file_put_contents($productsFileData, $jsonData);

if ($result1 === false && $result2 === false) {
    http_response_code(500);
    $error = error_get_last();
    echo json_encode([
        'ok' => false, 
        'error' => 'Save failed', 
        'public_file' => $productsFilePublic,
        'data_file' => $productsFileData,
        'public_writable' => is_writable(dirname($productsFilePublic)),
        'data_writable' => is_writable(dirname($productsFileData)),
        'php_error' => $error['message'] ?? 'Unknown error'
    ]);
} else {
    // Build debug info (only include in non-production or if there are new images)
    $debugInfo = [];
    if (!empty($newImages) || $isProduction) {
        $debugInfo = [
            'public_dir' => $publicDir,
            'upload_dir' => $uploadDir,
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
            'upload_dir_exists' => is_dir($uploadDir),
            'upload_dir_writable' => is_writable($uploadDir),
            'new_images_count' => count($newImages),
            'new_images' => $newImages
        ];
    }
    
    $response = [
        'ok' => true,
        'message' => $idx !== null ? 'Updated' : 'Created',
        'product' => $product,
        'saved_to' => [
            'public' => $result1 !== false,
            'data' => $result2 !== false
        ]
    ];
    
    // Add debug info if available
    if (!empty($debugInfo)) {
        $response['debug'] = $debugInfo;
    }
    
    echo json_encode($response);
}
