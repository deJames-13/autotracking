<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class SuspiciousEmailRegistrationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private User $user;
    private array $emailValidation;
    private string $createdBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user, array $emailValidation, string $createdBy)
    {
        $this->user = $user;
        $this->emailValidation = $emailValidation;
        $this->createdBy = $createdBy;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $warnings = $this->emailValidation['warnings'] ?? [];
        $isDisposable = $this->emailValidation['is_disposable'] ?? false;
        $suspiciousPatterns = $this->emailValidation['suspicious_patterns'] ?? [];
        
        $message = (new MailMessage)
            ->subject('🚨 Suspicious Email Registration Alert')
            ->greeting('Hello Administrator,')
            ->line('A new user has been registered with a potentially suspicious email address:')
            ->line('')
            ->line('**User Details:**')
            ->line('• Name: ' . $this->user->full_name)
            ->line('• Employee ID: ' . $this->user->employee_id)
            ->line('• Email: ' . $this->user->email)
            ->line('• Role: ' . ($this->user->role->role_name ?? 'Unknown'))
            ->line('• Created by: ' . $this->createdBy)
            ->line('');

        if ($isDisposable) {
            $message->line('⚠️ **ALERT:** This appears to be a disposable/temporary email address.');
        }

        if (!empty($warnings)) {
            $message->line('**Validation Warnings:**');
            foreach ($warnings as $warning) {
                $message->line('• ' . $warning);
            }
            $message->line('');
        }

        if (!empty($suspiciousPatterns)) {
            $message->line('**Suspicious Patterns Detected:**');
            foreach ($suspiciousPatterns as $pattern) {
                $message->line('• ' . $pattern);
            }
            $message->line('');
        }

        $message->line('**Recommended Actions:**')
            ->line('• Verify the user\'s identity through alternative means')
            ->line('• Contact the user to confirm their legitimate email address')
            ->line('• Consider requesting official company email if applicable')
            ->line('• Monitor the user\'s activity closely')
            ->line('')
            ->action('View User Details', url('/admin/users/' . $this->user->employee_id))
            ->line('Please take appropriate action to ensure account security.');

        return $message;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'user_id' => $this->user->employee_id,
            'user_name' => $this->user->full_name,
            'email' => $this->user->email,
            'email_validation' => $this->emailValidation,
            'created_by' => $this->createdBy,
        ];
    }
}
