<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private string $token;
    private string $resetUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $token, string $resetUrl = null)
    {
        $this->token = $token;
        $this->resetUrl = $resetUrl ?? url(route('password.reset', ['token' => $token], false));
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
            ->subject('Password Reset Request - Auto Tracking System')
            ->greeting("Hello {$fullName}!")
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->line("**Employee ID:** {$notifiable->employee_id}")
            ->line("**Email:** {$notifiable->email}")
            ->line('Click the button below to reset your password. This link will expire in 60 minutes.')
            ->action('Reset Password', $this->resetUrl)
            ->line('If you did not request a password reset, no further action is required. Your current password will remain unchanged.')
            ->line('For security reasons, please do not share this reset link with anyone.')
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
            'reset_url' => $this->resetUrl,
            'token' => $this->token,
        ];
    }
}
