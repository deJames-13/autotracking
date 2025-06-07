<?php
require_once 'vendor/autoload.php';

use App\Services\EmailValidationService;

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Email Validation Service...\n";
$emailService = app(EmailValidationService::class);

// Test various email types
$testEmails = [
    'user@gmail.com' => 'Valid Gmail',
    'test@10minutemail.com' => 'Disposable Email', 
    'user@gmial.com' => 'Typo in Gmail',
    'invalid-email' => 'Invalid Format',
    'user@company.com' => 'Business Email'
];

foreach ($testEmails as $email => $type) {
    echo "\n--- Testing: $email ($type) ---\n";
    $result = $emailService->validateEmail($email);
    echo "Valid: " . ($result['is_valid'] ? 'YES' : 'NO') . "\n";
    echo "Disposable: " . ($result['is_disposable'] ? 'YES' : 'NO') . "\n";
    echo "Official: " . ($result['is_official'] ? 'YES' : 'NO') . "\n";
    if (!empty($result['warnings'])) {
        echo "Warnings: " . implode('; ', $result['warnings']) . "\n";
    }
    if (!empty($result['errors'])) {
        echo "Errors: " . implode('; ', $result['errors']) . "\n";
    }
}

echo "\n\nTesting Enhanced Email Service...\n";
$enhancedService = app(App\Services\EnhancedEmailService::class);
$health = $enhancedService->getSystemHealth();
echo "Mail System Health: " . ($health['overall_status'] ? 'HEALTHY' : 'UNHEALTHY') . "\n";

echo "\nDone!\n";
