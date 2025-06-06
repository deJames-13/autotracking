<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private string $temporaryPassword;
    private string $loginUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $temporaryPassword, string $loginUrl = null)
    {
        $this->temporaryPassword = $temporaryPassword;
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
            ->subject('Account Created - Auto Tracking System')
            ->greeting("Hello {$fullName}!")
            ->line('A new account has been created for you in the Auto Tracking System.')
            ->line("**Employee ID:** {$notifiable->employee_id}")
            ->line("**Email:** {$notifiable->email}")
            ->line("**Temporary Password:** {$this->temporaryPassword}")
            ->line('**Important:** Please change your password after your first login for security.')
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
            'login_url' => $this->loginUrl,
        ];
    }
}
