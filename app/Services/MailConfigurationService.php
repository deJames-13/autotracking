<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;

class MailConfigurationService
{
    /**
     * Check if mail configuration is properly set up
     */
    public function isConfigured(): array
    {
        $result = [
            'is_configured' => true,
            'errors' => [],
            'warnings' => [],
            'config' => []
        ];

        // Check basic mail configuration
        $mailer = Config::get('mail.default');
        $result['config']['mailer'] = $mailer;

        if ($mailer === 'log' || $mailer === 'array') {
            $result['warnings'][] = "Mail is configured for '{$mailer}' which is typically used for testing/development";
        }

        // Check from address configuration
        $fromAddress = Config::get('mail.from.address');
        $fromName = Config::get('mail.from.name');

        if (empty($fromAddress) || $fromAddress === 'hello@example.com') {
            $result['errors'][] = 'Mail from address is not configured or uses default placeholder';
            $result['is_configured'] = false;
        }

        if (empty($fromName) || $fromName === 'Example') {
            $result['warnings'][] = 'Mail from name is not configured or uses default placeholder';
        }

        $result['config']['from'] = [
            'address' => $fromAddress,
            'name' => $fromName
        ];

        // Check SMTP configuration if SMTP is used
        if ($mailer === 'smtp') {
            $this->checkSmtpConfiguration($result);
        }

        // Check environment variables
        $this->checkEnvironmentVariables($result);

        return $result;
    }

    /**
     * Test mail connectivity
     */
    public function testConnection(): array
    {
        $result = [
            'connection_test' => false,
            'errors' => [],
            'warnings' => []
        ];

        try {
            // Try to get the mailer instance to test configuration
            $mailer = Mail::mailer();
            
            if ($mailer) {
                $result['connection_test'] = true;
            }
        } catch (\Exception $e) {
            $result['errors'][] = 'Mail connection test failed: ' . $e->getMessage();
            Log::error('Mail connection test failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $result;
    }

    /**
     * Send a test email
     */
    public function sendTestEmail(string $toEmail, string $testMessage = 'Test email from AutoTracking System'): array
    {
        $result = [
            'email_sent' => false,
            'errors' => [],
            'warnings' => []
        ];

        try {
            Mail::raw($testMessage, function (Message $message) use ($toEmail) {
                $message->to($toEmail)
                        ->subject('AutoTracking - Mail Configuration Test');
            });

            $result['email_sent'] = true;
            Log::info('Test email sent successfully', ['to' => $toEmail]);
            
        } catch (\Exception $e) {
            $result['errors'][] = 'Failed to send test email: ' . $e->getMessage();
            Log::error('Test email failed', [
                'to' => $toEmail,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $result;
    }

    /**
     * Get comprehensive mail status
     */
    public function getMailStatus(): array
    {
        $configStatus = $this->isConfigured();
        $connectionStatus = $this->testConnection();

        return [
            'configuration' => $configStatus,
            'connection' => $connectionStatus,
            'overall_status' => $configStatus['is_configured'] && $connectionStatus['connection_test'],
            'recommendations' => $this->getRecommendations($configStatus, $connectionStatus)
        ];
    }

    /**
     * Check SMTP specific configuration
     */
    private function checkSmtpConfiguration(array &$result): void
    {
        $smtpConfig = Config::get('mail.mailers.smtp');
        
        $requiredFields = ['host', 'port', 'username', 'password'];
        foreach ($requiredFields as $field) {
            if (empty($smtpConfig[$field])) {
                $result['errors'][] = "SMTP {$field} is not configured";
                $result['is_configured'] = false;
            }
        }

        $result['config']['smtp'] = [
            'host' => $smtpConfig['host'] ?? null,
            'port' => $smtpConfig['port'] ?? null,
            'username' => $smtpConfig['username'] ?? null,
            'password' => !empty($smtpConfig['password']) ? '***configured***' : null,
            'timeout' => $smtpConfig['timeout'] ?? null,
        ];
    }

    /**
     * Check relevant environment variables
     */
    private function checkEnvironmentVariables(array &$result): void
    {
        $envVars = [
            'MAIL_MAILER' => env('MAIL_MAILER'),
            'MAIL_HOST' => env('MAIL_HOST'),
            'MAIL_PORT' => env('MAIL_PORT'),
            'MAIL_USERNAME' => env('MAIL_USERNAME'),
            'MAIL_PASSWORD' => !empty(env('MAIL_PASSWORD')) ? '***set***' : null,
            'MAIL_FROM_ADDRESS' => env('MAIL_FROM_ADDRESS'),
            'MAIL_FROM_NAME' => env('MAIL_FROM_NAME'),
        ];

        $result['config']['environment'] = $envVars;

        // Check for missing critical environment variables
        $critical = ['MAIL_FROM_ADDRESS'];
        foreach ($critical as $var) {
            if (empty(env($var))) {
                $result['errors'][] = "Environment variable {$var} is not set";
                $result['is_configured'] = false;
            }
        }
    }

    /**
     * Get recommendations based on configuration status
     */
    private function getRecommendations(array $configStatus, array $connectionStatus): array
    {
        $recommendations = [];

        if (!$configStatus['is_configured']) {
            $recommendations[] = [
                'type' => 'error',
                'title' => 'Mail Configuration Required',
                'message' => 'Configure your mail settings in the .env file to enable email notifications.',
                'actions' => [
                    'Set MAIL_FROM_ADDRESS to your organization email',
                    'Configure SMTP settings if using SMTP mailer',
                    'Update MAIL_FROM_NAME to your organization name'
                ]
            ];
        }

        if (!$connectionStatus['connection_test']) {
            $recommendations[] = [
                'type' => 'error',
                'title' => 'Mail Connection Failed',
                'message' => 'Unable to establish connection with mail server.',
                'actions' => [
                    'Verify SMTP credentials are correct',
                    'Check firewall settings',
                    'Ensure mail server is accessible from your application server'
                ]
            ];
        }

        if (Config::get('mail.default') === 'log') {
            $recommendations[] = [
                'type' => 'warning',
                'title' => 'Development Mail Configuration',
                'message' => 'Mail is set to log mode. Emails will be written to log files instead of being delivered.',
                'actions' => [
                    'Change MAIL_MAILER from "log" to "smtp" for production',
                    'Configure proper SMTP settings'
                ]
            ];
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'type' => 'success',
                'title' => 'Mail Configuration Looks Good',
                'message' => 'Your mail configuration appears to be properly set up.',
                'actions' => []
            ];
        }

        return $recommendations;
    }
}
