<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Notifications\Notification;

class EnhancedEmailService
{
    private MailConfigurationService $mailConfigService;
    private EmailValidationService $emailValidationService;

    public function __construct(
        MailConfigurationService $mailConfigService,
        EmailValidationService $emailValidationService
    ) {
        $this->mailConfigService = $mailConfigService;
        $this->emailValidationService = $emailValidationService;
    }

    /**
     * Send notification with comprehensive error handling and validation
     */
    public function sendNotificationSafely(
        User $user, 
        Notification $notification, 
        array $context = []
    ): array {
        $result = [
            'sent' => false,
            'errors' => [],
            'warnings' => [],
            'context' => $context
        ];

        // Step 1: Check mail configuration
        $configStatus = $this->mailConfigService->isConfigured();
        if (!$configStatus['is_configured']) {
            $result['errors'][] = 'Mail system is not properly configured';
            $result['errors'] = array_merge($result['errors'], $configStatus['errors']);
            
            Log::error('Email notification failed - Mail not configured', [
                'user_id' => $user->employee_id ?? $user->id,
                'notification' => get_class($notification),
                'config_errors' => $configStatus['errors'],
                'context' => $context
            ]);
            
            return $result;
        }

        // Step 2: Validate recipient email
        if (empty($user->email)) {
            $result['errors'][] = 'User does not have an email address';
            
            Log::warning('Email notification failed - No email address', [
                'user_id' => $user->employee_id ?? $user->id,
                'notification' => get_class($notification),
                'context' => $context
            ]);
            
            return $result;
        }

        $emailValidation = $this->emailValidationService->validateEmail($user->email);
        if (!$emailValidation['is_valid']) {
            $result['errors'][] = 'User email address is invalid';
            $result['errors'] = array_merge($result['errors'], $emailValidation['errors']);
            
            Log::warning('Email notification failed - Invalid email', [
                'user_id' => $user->employee_id ?? $user->id,
                'email' => $user->email,
                'notification' => get_class($notification),
                'validation_errors' => $emailValidation['errors'],
                'context' => $context
            ]);
            
            return $result;
        }

        // Add email validation warnings
        if (!empty($emailValidation['warnings'])) {
            $result['warnings'] = array_merge($result['warnings'], $emailValidation['warnings']);
        }

        // Step 3: Attempt to send notification
        try {
            $user->notify($notification);
            $result['sent'] = true;
            
            Log::info('Email notification sent successfully', [
                'user_id' => $user->employee_id ?? $user->id,
                'email' => $user->email,
                'notification' => get_class($notification),
                'context' => $context
            ]);
            
        } catch (\Exception $e) {
            $result['errors'][] = 'Failed to send email: ' . $e->getMessage();
            
            Log::error('Email notification failed during send', [
                'user_id' => $user->employee_id ?? $user->id,
                'email' => $user->email,
                'notification' => get_class($notification),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'context' => $context
            ]);

            // Try to determine the cause of failure
            $this->analyzeEmailFailure($e, $result);
        }

        return $result;
    }

    /**
     * Send notification to multiple users with batch error handling
     */
    public function sendNotificationToMultiple(
        array $users, 
        Notification $notification, 
        array $context = []
    ): array {
        $results = [
            'total_sent' => 0,
            'total_failed' => 0,
            'individual_results' => [],
            'summary_errors' => [],
            'summary_warnings' => []
        ];

        foreach ($users as $user) {
            $userResult = $this->sendNotificationSafely($user, $notification, $context);
            
            $results['individual_results'][$user->employee_id ?? $user->id] = $userResult;
            
            if ($userResult['sent']) {
                $results['total_sent']++;
            } else {
                $results['total_failed']++;
                $results['summary_errors'] = array_merge($results['summary_errors'], $userResult['errors']);
            }
            
            $results['summary_warnings'] = array_merge($results['summary_warnings'], $userResult['warnings']);
        }

        // Log batch results
        Log::info('Batch email notification completed', [
            'notification' => get_class($notification),
            'total_users' => count($users),
            'sent' => $results['total_sent'],
            'failed' => $results['total_failed'],
            'context' => $context
        ]);

        return $results;
    }

    /**
     * Get mail system health status
     */
    public function getSystemHealth(): array
    {
        return $this->mailConfigService->getMailStatus();
    }

    /**
     * Test email functionality
     */
    public function testEmailSystem(string $testEmail): array
    {
        // Validate test email
        $emailValidation = $this->emailValidationService->validateEmail($testEmail);
        if (!$emailValidation['is_valid']) {
            return [
                'success' => false,
                'errors' => array_merge(['Invalid test email address'], $emailValidation['errors']),
                'warnings' => $emailValidation['warnings'] ?? []
            ];
        }

        // Check configuration
        $configStatus = $this->mailConfigService->isConfigured();
        if (!$configStatus['is_configured']) {
            return [
                'success' => false,
                'errors' => array_merge(['Mail system not configured'], $configStatus['errors']),
                'warnings' => $configStatus['warnings'] ?? []
            ];
        }

        // Send test email
        $testResult = $this->mailConfigService->sendTestEmail($testEmail);
        
        return [
            'success' => $testResult['email_sent'],
            'errors' => $testResult['errors'],
            'warnings' => array_merge($configStatus['warnings'] ?? [], $testResult['warnings'], $emailValidation['warnings'] ?? []),
            'config_status' => $configStatus,
            'email_validation' => $emailValidation
        ];
    }

    /**
     * Analyze email failure to provide better error messages
     */
    private function analyzeEmailFailure(\Exception $exception, array &$result): void
    {
        $message = $exception->getMessage();
        $lowerMessage = strtolower($message);

        if (str_contains($lowerMessage, 'connection') || str_contains($lowerMessage, 'timeout')) {
            $result['errors'][] = 'Mail server connection failed. Please check your SMTP settings.';
        } elseif (str_contains($lowerMessage, 'authentication') || str_contains($lowerMessage, 'login')) {
            $result['errors'][] = 'Mail server authentication failed. Please verify your email credentials.';
        } elseif (str_contains($lowerMessage, 'from address')) {
            $result['errors'][] = 'Invalid sender email address. Please check your MAIL_FROM_ADDRESS configuration.';
        } elseif (str_contains($lowerMessage, 'recipient') || str_contains($lowerMessage, 'to address')) {
            $result['errors'][] = 'Invalid recipient email address.';
        } else {
            $result['errors'][] = 'Email delivery failed due to server error.';
        }

        // Add general recommendations
        $result['warnings'][] = 'Consider checking your mail server status and configuration.';
    }
}
