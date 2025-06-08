<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Check if user exists and has an email address
        $user = \App\Models\User::where('email', $request->email)->first();
        
        if (!$user) {
            // Return a generic message for security (don't reveal if email exists)
            return back()->with('status', __('A reset link will be sent if the account exists.'));
        }
        
        if (empty($user->email)) {
            return back()->withErrors([
                'email' => 'This account does not have an email address configured. Please contact the administrator.'
            ]);
        }

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __('A password reset link has been sent to your email address.'));
        }

        return back()->withErrors([
            'email' => __($status)
        ]);
    }
}
