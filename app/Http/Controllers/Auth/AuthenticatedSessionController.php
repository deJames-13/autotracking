<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Revoke any existing cookies before authentication
        $this->revokeCookies();

        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        
        // Redirect based on user role
        if (in_array($user->role?->role_name, ['admin', 'technician'])) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        // For employees and other roles, redirect to main dashboard
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        // Revoke cookies on logout
        $this->revokeCookies();

        return redirect('/login');
    }

    /**
     * Revoke all cookies to ensure clean state during app updates.
     * This is particularly useful when deploying updates to production.
     */
    public function revokeCookies()
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
        if (request()->cookies) {
            foreach (request()->cookies as $name => $value) {
                // Skip essential cookies that shouldn't be removed
                if (!in_array($name, ['timezone', 'locale'])) {
                    Cookie::queue(Cookie::forget($name));
                }
            }
        }

        // If this is called directly as an endpoint, return JSON response
        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json(['message' => 'Cookies revoked successfully']);
        }
    }
}
