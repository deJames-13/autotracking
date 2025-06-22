<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RevokeCookiesOnUpdate
{
    /**
     * Handle an incoming request.
     * 
     * This middleware checks for app version changes and revokes cookies
     * when a new deployment is detected, but only on specific routes.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only check version on login page visits (not on every request)
        if ($request->is('login') && $request->isMethod('GET')) {
            // Check if app version has changed (indicating a deployment)
            $currentVersion = config('app.version', '1.0.0');
            $lastVersion = Cache::get('app_version_' . $request->ip(), null);

            // If version changed or no cached version exists, revoke cookies
            if ($lastVersion !== null && $lastVersion !== $currentVersion) {
                $this->revokeCookies($request);
                Cache::put('app_version_' . $request->ip(), $currentVersion, now()->addDays(7));
            } elseif ($lastVersion === null) {
                // First visit, just cache the version
                Cache::put('app_version_' . $request->ip(), $currentVersion, now()->addDays(7));
            }
        }

        return $next($request);
    }

    /**
     * Revoke all authentication and session cookies
     */
    private function revokeCookies(Request $request): void
    {
        // Get common Laravel cookie names
        $commonCookies = [
            'laravel_session',
            'XSRF-TOKEN',
            config('session.cookie'),
            config('app.name') . '_session',
            'remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d', // Laravel's remember token
        ];

        // Expire specific Laravel cookies
        foreach ($commonCookies as $cookieName) {
            if ($cookieName) {
                Cookie::queue(Cookie::forget($cookieName));
            }
        }

        // Also expire any cookies that are currently set in the request
        foreach ($request->cookies as $name => $value) {
            // Skip essential cookies that shouldn't be removed
            if (!in_array($name, ['timezone', 'locale', 'theme'])) {
                Cookie::queue(Cookie::forget($name));
            }
        }
    }
}
