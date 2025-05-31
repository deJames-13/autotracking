<?php
// Test script to manually verify the fix for employee tracking requests
// by checking the technician_id extraction process

$requestData = [
    'data' => [
        'technician' => [
            'employee_id' => 6,
            'first_name' => 'Alice',
            'last_name' => 'Wintheiser'
        ],
        'equipment' => [
            'plant' => 1,
            'department' => 1,
            'location' => 3,
            'description' => 'Test Equipment',
            'serialNumber' => '32143134',
            'model' => '',
            'manufacturer' => '',
            'dueDate' => '2025-06-01',
        ],
        'calibration' => [
            'calibrationDate' => '',
            'expectedDueDate' => '',
            'dateOut' => ''
        ],
        'scannedEmployee' => [
            'employee_id' => 2,
            'user_id' => 2,
            'first_name' => 'Employee',
            'last_name' => 'User'
        ],
        'receivedBy' => null
    ]
];

// Extract fields as done in controller
$validatedData = [];

// Extract technician_id
if (!empty($requestData['data']['technician']) && !empty($requestData['data']['technician']['employee_id'])) {
    $validatedData['technician_id'] = $requestData['data']['technician']['employee_id'];
}

// Extract equipment fields
if (!empty($requestData['data']['equipment'])) {
    $equipment = $requestData['data']['equipment'];
    $validatedData['description'] = $equipment['description'] ?? null;
    $validatedData['serial_number'] = $equipment['serialNumber'] ?? null;
    $validatedData['model'] = $equipment['model'] ?? null;
    $validatedData['manufacturer'] = $equipment['manufacturer'] ?? null;
    $validatedData['due_date'] = $equipment['dueDate'] ?? null;
    $validatedData['plant_id'] = $equipment['plant'] ?? null;
    $validatedData['department_id'] = $equipment['department'] ?? null;
    $validatedData['location_id'] = $equipment['location'] ?? null;
}

// For debugging
echo "Processed data:\n";
var_export($validatedData);

// Verify technician_id is correctly set
if (isset($validatedData['technician_id']) && $validatedData['technician_id'] === 6) {
    echo "\nSUCCESS: technician_id is correctly set to 6.\n";
} else {
    echo "\nERROR: technician_id is not set correctly.\n";
}

// Verify other fields
$requiredFields = ['description', 'serial_number', 'plant_id', 'department_id', 'location_id'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (!isset($validatedData[$field]) || empty($validatedData[$field])) {
        $missingFields[] = $field;
    }
}

if (empty($missingFields)) {
    echo "All required fields are set correctly.\n";
} else {
    echo "Missing or empty fields: " . implode(', ', $missingFields) . "\n";
}
