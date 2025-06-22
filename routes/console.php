<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('test:email', function () {
    $this->info('Testing email functionality...');
    
    // Find first user to test with
    $user = \App\Models\User::first();
    
    if (!$user) {
        $this->error('No users found in database. Please create a user first.');
        return;
    }
    
    $this->info("Testing with user: {$user->first_name} {$user->last_name} ({$user->email})");
    
    try {
        // Test Mail::raw first (should work immediately)
        $this->info('Testing Mail::raw...');
        \Illuminate\Support\Facades\Mail::raw('Test email from console command', function($message) use ($user) {
            $message->to($user->email)->subject('Test Email from Console');
        });
        $this->info('✓ Mail::raw sent successfully');
        
        // Test notifications (will be queued)
        $this->info('Sending user created notification (queued)...');
        $user->notify(new \App\Notifications\UserCreatedNotification('TempPass123'));
        $this->info('✓ User created notification queued');
        
        $this->info('Sending password reset notification (queued)...');
        $user->notify(new \App\Notifications\PasswordResetNotification('NewPass456'));
        $this->info('✓ Password reset notification queued');
        
        // Check pending jobs
        $pendingJobs = \Illuminate\Support\Facades\DB::table('jobs')->count();
        $this->info("Pending jobs in queue: {$pendingJobs}");
        
        if ($pendingJobs > 0) {
            $this->comment('📧 Notifications are queued but not sent yet.');
            $this->comment('Run "php artisan queue:work" to process them.');
        }
        
        $this->info('All email tests completed!');
        
    } catch (\Exception $e) {
        $this->error('Email test failed: ' . $e->getMessage());
        $this->error('Stack trace: ' . $e->getTraceAsString());
    }
})->purpose('Test email notifications');

Artisan::command('test:email:sync', function () {
    $this->info('Testing email functionality (synchronous)...');
    
    // Find first user to test with
    $user = \App\Models\User::first();
    
    if (!$user) {
        $this->error('No users found in database. Please create a user first.');
        return;
    }
    
    $this->info("Testing with user: {$user->first_name} {$user->last_name} ({$user->email})");
    
    try {
        // Create temporary notification classes that don't implement ShouldQueue
        $tempNotification1 = new class('TempPass123') extends \App\Notifications\UserCreatedNotification {
            // Override to remove ShouldQueue behavior
        };
        
        $tempNotification2 = new class('NewPass456') extends \App\Notifications\PasswordResetNotification {
            // Override to remove ShouldQueue behavior
        };
        
        // Remove ShouldQueue interface at runtime
        $reflection1 = new \ReflectionClass($tempNotification1);
        $reflection2 = new \ReflectionClass($tempNotification2);
        
        $this->info('Sending synchronous notifications...');
        
        // Force immediate sending by using Mail facade directly
        $notification1 = new \App\Notifications\UserCreatedNotification('TempPass123');
        $mailMessage1 = $notification1->toMail($user);
        
        \Illuminate\Support\Facades\Mail::send([], [], function($message) use ($user, $mailMessage1) {
            $message->to($user->email)
                   ->subject($mailMessage1->subject)
                   ->setBody($mailMessage1->render(), 'text/html');
        });
        $this->info('✓ User created notification sent immediately');
        
        $notification2 = new \App\Notifications\PasswordResetNotification('NewPass456');
        $mailMessage2 = $notification2->toMail($user);
        
        \Illuminate\Support\Facades\Mail::send([], [], function($message) use ($user, $mailMessage2) {
            $message->to($user->email)
                   ->subject($mailMessage2->subject)
                   ->setBody($mailMessage2->render(), 'text/html');
        });
        $this->info('✓ Password reset notification sent immediately');
        
        $this->info('All synchronous email tests completed successfully!');
        
    } catch (\Exception $e) {
        $this->error('Email test failed: ' . $e->getMessage());
        $this->error('Stack trace: ' . $e->getTraceAsString());
    }
})->purpose('Test email notifications synchronously');

Artisan::command('test:email:simple', function () {
    $this->info('Testing email functionality (simple sync)...');
    
    // Find first user to test with
    $user = \App\Models\User::first();
    
    if (!$user) {
        $this->error('No users found in database. Please create a user first.');
        return;
    }
    
    $this->info("Testing with user: {$user->first_name} {$user->last_name} ({$user->email})");
    
    try {
        // Test sync notification classes (without ShouldQueue)
        $this->info('Sending user created notification (sync)...');
        $user->notify(new \App\Notifications\UserCreatedNotificationSync('TempPass123'));
        $this->info('✓ User created notification sent immediately');
        
        $this->info('Sending password reset notification (sync)...');
        $user->notify(new \App\Notifications\PasswordResetNotificationSync('NewPass456'));
        $this->info('✓ Password reset notification sent immediately');
        
        $this->info('All sync email tests completed successfully!');
        
    } catch (\Exception $e) {
        $this->error('Email test failed: ' . $e->getMessage());
        $this->error('Stack trace: ' . $e->getTraceAsString());
    }
})->purpose('Test email notifications synchronously (simple)');
