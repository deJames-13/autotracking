<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private string $newPassword;
    private string $updatedBy;
    private string $loginUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $newPassword, string $updatedBy, string $loginUrl = null)
    {
        $this->newPassword = $newPassword;
        $this->updatedBy = $updatedBy;
        $this->loginUrl = $loginUrl ?? url('/login');
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
        $fullName = trim($notifiable->first_name . ' ' . $notifiable->last_name);
        
        return (new MailMessage)
            ->subject('Password Updated - Auto Tracking System')
            ->greeting("Hello {$fullName}!")
            ->line('Your password has been updated by an administrator.')
            ->line("**Employee ID:** {$notifiable->employee_id}")
            ->line("**Email:** {$notifiable->email}")
            ->line("**New Password:** {$this->newPassword}")
            ->line("**Updated by:** {$this->updatedBy}")
            ->line("**Date:** " . now()->format('F j, Y \a\t g:i A'))
            ->line('**Important:** Please change your password after logging in for security.')
            ->action('Login to Your Account', $this->loginUrl)
            ->line('If you did not expect this password change, please contact the system administrator immediately.')
            ->line('Thank you!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'employee_id' => $notifiable->employee_id,
            'email' => $notifiable->email,
            'updated_by' => $this->updatedBy,
            'login_url' => $this->loginUrl,
        ];
    }
}
