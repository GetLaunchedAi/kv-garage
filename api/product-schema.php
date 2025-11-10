<?php
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
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    $isProduction = !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:8000']);
    if (!$isProduction) {
        header('Access-Control-Allow-Origin: *');
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Origin not allowed']);
        exit;
    }
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

// Product Manifest Schema Definition
$schema = [
    'title' => 'Manifest Product Schema',
    'description' => 'Schema for CSV manifest files used to upload product data for packs',
    'version' => '1.0.0',
    'template_url' => '/assets/templates/manifest-template.csv',
    'fields' => [
        [
            'name' => 'sku',
            'canonical_name' => 'sku',
            'required' => true,
            'type' => 'string',
            'description' => 'Stock Keeping Unit - Unique identifier for the product',
            'example' => 'CASE-001',
            'aliases' => []
        ],
        [
            'name' => 'item_name',
            'canonical_name' => 'item_name',
            'required' => true,
            'type' => 'string',
            'description' => 'Name of the product/item',
            'example' => 'iPhone 12/13 Clear Case',
            'aliases' => ['product_name', 'name', 'product']
        ],
        [
            'name' => 'product_name',
            'canonical_name' => 'item_name',
            'required' => false,
            'type' => 'string',
            'description' => 'Product name (alias for item_name)',
            'example' => 'iPhone 12/13 Clear Case',
            'aliases' => ['item_name', 'name', 'product']
        ],
        [
            'name' => 'quantity',
            'canonical_name' => 'quantity',
            'required' => true,
            'type' => 'integer',
            'description' => 'Number of units available',
            'example' => 25,
            'aliases' => ['qty', 'qnty', 'amount']
        ],
        [
            'name' => 'estimated_value',
            'canonical_name' => 'estimated_value',
            'required' => true,
            'type' => 'float',
            'description' => 'Estimated resale value per unit in USD',
            'example' => 12.00,
            'aliases' => ['value', 'est_value', 'est_val', 'price', 'est']
        ],
        [
            'name' => 'condition',
            'canonical_name' => 'condition',
            'required' => false,
            'type' => 'string',
            'description' => 'Condition of the product',
            'default' => 'new',
            'example' => 'new',
            'aliases' => []
        ],
        [
            'name' => 'condition_grade',
            'canonical_name' => 'condition_grade',
            'required' => false,
            'type' => 'string',
            'description' => 'Grade of condition (e.g., excellent, good, fair)',
            'example' => 'new',
            'aliases' => []
        ],
        [
            'name' => 'category',
            'canonical_name' => 'category',
            'required' => false,
            'type' => 'string',
            'description' => 'Product category',
            'default' => 'Misc',
            'example' => 'Phone Cases',
            'aliases' => []
        ],
        [
            'name' => 'brand',
            'canonical_name' => 'brand',
            'required' => false,
            'type' => 'string',
            'description' => 'Brand name of the product',
            'default' => 'Generic',
            'example' => 'Generic',
            'aliases' => []
        ],
        [
            'name' => 'notes',
            'canonical_name' => 'notes',
            'required' => false,
            'type' => 'string',
            'description' => 'Additional notes or description about the product',
            'default' => '',
            'example' => 'Clear protective case, various colors',
            'aliases' => []
        ]
    ],
    'csv_format' => [
        'delimiter' => ',',
        'enclosure' => '"',
        'escape' => '"',
        'header_row' => true,
        'encoding' => 'UTF-8'
    ],
    'validation_rules' => [
        'sku' => 'Required, must be unique within the manifest',
        'item_name' => 'Required, string',
        'quantity' => 'Required, must be a positive integer',
        'estimated_value' => 'Required, must be a positive number (float)',
        'condition' => 'Optional, defaults to "new" if not provided',
        'category' => 'Optional, defaults to "Misc" if not provided',
        'brand' => 'Optional, defaults to "Generic" if not provided',
        'notes' => 'Optional, can contain commas (will be quoted in CSV)'
    ],
    'example_row' => [
        'sku' => 'CASE-001',
        'item_name' => 'iPhone 12/13 Clear Case',
        'product_name' => 'iPhone 12/13 Clear Case',
        'quantity' => 25,
        'condition' => 'new',
        'condition_grade' => 'new',
        'estimated_value' => 12.00,
        'category' => 'Phone Cases',
        'brand' => 'Generic',
        'notes' => 'Clear protective case, various colors'
    ]
];

echo json_encode($schema, JSON_PRETTY_PRINT);
?>

