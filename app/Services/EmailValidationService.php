<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailValidationService
{
    private array $officialDomains = [
        // Common business domains
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
        'company.com', 'corp.com', 'business.com',
        // Add your organization's official domains here
        'yourdomain.com', 'yourcompany.com'
    ];

    private array $disposableDomains = [
        '10minutemail.com', 'temp-mail.org', 'guerrillamail.com',
        'mailinator.com', 'tempmail.net', 'throwaway.email',
        'getnada.com', 'maildrop.cc', 'sharklasers.com'
    ];

    /**
     * Validate email comprehensively
     */
    public function validateEmail(string $email): array
    {
        $result = [
            'is_valid' => false,
            'is_official' => false,
            'is_disposable' => false,
            'domain' => '',
            'warnings' => [],
            'errors' => []
        ];

        // Basic format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $result['errors'][] = 'Invalid email format';
            return $result;
        }

        $domain = strtolower(substr(strrchr($email, "@"), 1));
        $result['domain'] = $domain;
        $result['is_valid'] = true;

        // Check if it's a disposable email
        if (in_array($domain, $this->disposableDomains)) {
            $result['is_disposable'] = true;
            $result['warnings'][] = 'This appears to be a disposable/temporary email address';
        }

        // Check if it's an official domain
        if (in_array($domain, $this->officialDomains)) {
            $result['is_official'] = true;
        } else {
            $result['warnings'][] = 'This email domain may not be an official business email';
        }

        // Additional checks
        $this->performAdditionalChecks($email, $domain, $result);

        return $result;
    }

    /**
     * Perform additional email validation checks
     */
    private function performAdditionalChecks(string $email, string $domain, array &$result): void
    {
        // Check for common typos in popular domains
        $commonTypos = [
            'gmial.com' => 'gmail.com',
            'gmai.com' => 'gmail.com',
            'yahooo.com' => 'yahoo.com',
            'outlok.com' => 'outlook.com',
            'hotmial.com' => 'hotmail.com'
        ];

        if (isset($commonTypos[$domain])) {
            $result['warnings'][] = "Did you mean '{$commonTypos[$domain]}'? Current domain appears to be a typo";
        }

        // Check for suspicious patterns
        if (preg_match('/\d{5,}/', $email)) {
            $result['warnings'][] = 'Email contains many consecutive numbers, which may indicate a temporary account';
        }

        // Check MX record (DNS validation)
        if (!$this->checkMXRecord($domain)) {
            $result['warnings'][] = 'Domain does not have valid mail server configuration';
        }
    }

    /**
     * Check if domain has valid MX record
     */
    private function checkMXRecord(string $domain): bool
    {
        try {
            return checkdnsrr($domain, 'MX');
        } catch (\Exception $e) {
            Log::warning("Failed to check MX record for domain: {$domain}", ['error' => $e->getMessage()]);
            return true; // Assume valid if check fails
        }
    }

    /**
     * Get official domains for this organization
     */
    public function getOfficialDomains(): array
    {
        return $this->officialDomains;
    }

    /**
     * Add an official domain
     */
    public function addOfficialDomain(string $domain): void
    {
        $domain = strtolower($domain);
        if (!in_array($domain, $this->officialDomains)) {
            $this->officialDomains[] = $domain;
        }
    }

    /**
     * Check if email is likely to be deliverable
     */
    public function isDeliverable(string $email): bool
    {
        $validation = $this->validateEmail($email);
        return $validation['is_valid'] && !$validation['is_disposable'];
    }
}
