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
        // Test user created notification
        $this->info('Sending user created notification...');
        $user->notify(new \App\Notifications\UserCreatedNotification('TempPass123'));
        $this->info('✓ User created notification sent successfully');
        
        // Test password reset notification
        $this->info('Sending password reset notification...');
        $user->notify(new \App\Notifications\PasswordResetNotification('NewPass456'));
        $this->info('✓ Password reset notification sent successfully');
        
        $this->info('All email tests completed successfully!');
        
    } catch (\Exception $e) {
        $this->error('Email test failed: ' . $e->getMessage());
        $this->error('Stack trace: ' . $e->getTraceAsString());
    }
})->purpose('Test email notifications');
