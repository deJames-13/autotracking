<?php

namespace App\Providers;

use App\Services\EmailValidationService;
use App\Services\MailConfigurationService;
use App\Services\EnhancedEmailService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(EmailValidationService::class, function ($app) {
            return new EmailValidationService();
        });

        $this->app->singleton(MailConfigurationService::class, function ($app) {
            return new MailConfigurationService();
        });

        $this->app->singleton(EnhancedEmailService::class, function ($app) {
            return new EnhancedEmailService(
                $app->make(MailConfigurationService::class),
                $app->make(EmailValidationService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
