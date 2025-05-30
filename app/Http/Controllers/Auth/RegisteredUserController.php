<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        // Registration is disabled for employees
        // Only admins can create employee accounts through admin panel
        abort(404);
    }

    /**
     * Handle an incoming registration request.
     * This is disabled for security - only admins can create accounts
     */
    public function store(Request $request): RedirectResponse
    {
        abort(404);
    }
}
