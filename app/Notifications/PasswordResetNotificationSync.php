<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotificationSync extends Notification
{
    use Queueable;

    private string $newPassword;
    private string $loginUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $newPassword, string $loginUrl = null)
    {
        $this->newPassword = $newPassword;
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
            ->subject('Password Reset - Auto Tracking System')
            ->greeting("Hello {$fullName}!")
            ->line('Your password has been reset as requested.')
            ->line("**Employee ID:** {$notifiable->employee_id}")
            ->line("**Email:** {$notifiable->email}")
            ->line("**New Password:** {$this->newPassword}")
            ->line('**Important:** Please change your password after logging in for security.')
            ->action('Login to Your Account', $this->loginUrl)
            ->line('If you have any questions, please contact the system administrator.')
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
            'new_password' => '[HIDDEN]', // Don't store actual password
            'login_url' => $this->loginUrl,
        ];
    }
}
