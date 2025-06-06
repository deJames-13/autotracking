<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Department;
use App\Models\Plant;
use App\Models\Role;
use App\Models\User;
use App\Notifications\UserCreatedNotification;
use App\Notifications\PasswordResetNotification;
use App\Notifications\PasswordUpdatedNotification;
use App\Services\EmailValidationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        // For AJAX requests (old API compatibility), return paginated data
        if ($request->ajax() && !$request->header('X-Inertia')) {
            $limit = $request->get('per_page', $request->get('limit', 15));
            
            $users = User::with(['role', 'department', 'plant'])
                ->when($request->search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    });
                })
                ->when($request->role_id, function ($query, $roleId) {
                    $query->where('role_id', $roleId);
                })
                ->when($request->role_name, function ($query, $roleName) {
                    $query->whereHas('role', function ($q) use ($roleName) {
                        $q->where('role_name', $roleName);
                    });
                })
                ->when($request->department_id, function ($query, $departmentId) {
                    $query->where('department_id', $departmentId);
                })
                ->when($request->plant_id, function ($query, $plantId) {
                    $query->where('plant_id', $plantId);
                })
                ->paginate($limit)
                ->withQueryString();

            return response()->json([
                'data' => $users,
                'roles' => $roles,
                'departments' => $departments,
                'plants' => $plants
            ]);
        }

        // For Inertia requests, only return necessary data for initial page load
        return Inertia::render('admin/users/index', [
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
        ]);
    }

    public function create(): Response
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return Inertia::render('admin/users/create', [
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
        ]);
    }

    public function store(UserRequest $request): RedirectResponse|JsonResponse
    {
        $data = $request->validated();
        
        // Validate email if provided
        $emailWarnings = [];
        if (!empty($data['email'])) {
            $emailValidator = app(EmailValidationService::class);
            $emailValidation = $emailValidator->validateEmail($data['email']);
            $emailWarnings = $emailValidation['warnings'] ?? [];
            
            // Log email validation results for admin review
            if (!empty($emailWarnings) || $emailValidation['is_disposable']) {
                Log::warning('User created with suspicious email', [
                    'email' => $data['email'],
                    'validation' => $emailValidation,
                    'created_by' => Auth::user()->email ?? 'Unknown'
                ]);
            }
        }
        
        // Generate temporary password if not provided
        $temporaryPassword = null;
        if (isset($data['password'])) {
            $temporaryPassword = $data['password']; // Store plain password for email
            $data['password'] = Hash::make($data['password']);
        } else {
            // Generate a random temporary password
            $temporaryPassword = Str::random(12);
            $data['password'] = Hash::make($temporaryPassword);
        }

        // Handle employee_id auto-generation if not provided
        if (empty($data['employee_id'])) {
            $data['employee_id'] = $this->generateEmployeeId($data['role_id']);
        }

        $user = User::create($data);

        // Send email notification with employee ID and temporary password
        $emailSent = false;
        if (!empty($user->email)) {
            try {
                $user->notify(new UserCreatedNotification($temporaryPassword));
                $emailSent = true;
                Log::info('User creation email sent successfully', [
                    'user_id' => $user->employee_id,
                    'email' => $user->email
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send user creation email', [
                    'user_id' => $user->employee_id,
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Prepare response message
        $message = 'User created successfully.';
        if (!$emailSent && !empty($user->email)) {
            $message .= ' However, the email notification could not be sent.';
        } elseif ($emailSent) {
            $message .= ' Login credentials have been sent to their email.';
        }

        // Add email warnings to response
        $responseData = ['message' => $message];
        if (!empty($emailWarnings)) {
            $responseData['email_warnings'] = $emailWarnings;
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            $responseData['data'] = $user;
            return response()->json($responseData);
        }

        $flashType = !empty($emailWarnings) ? 'warning' : 'success';
        return redirect()->route('admin.users.index')
            ->with($flashType, $message)
            ->with('email_warnings', $emailWarnings);
    }

    public function show(User $user, Request $request): Response|JsonResponse
    {
        $user->load(['role', 'department', 'plant', 'equipments']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $user
            ]);
        }
        
        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse|JsonResponse
    {
        $data = $request->validated();
        $passwordChanged = false;
        $newPassword = null;
        
        // Check if password is being updated
        if (isset($data['password']) && !empty($data['password'])) {
            $newPassword = $data['password']; // Store plain password for email
            $data['password'] = Hash::make($data['password']);
            $passwordChanged = true;
        } else {
            unset($data['password']);
        }

        // Validate email if changed
        $emailWarnings = [];
        if (isset($data['email']) && $data['email'] !== $user->email && !empty($data['email'])) {
            $emailValidator = app(EmailValidationService::class);
            $emailValidation = $emailValidator->validateEmail($data['email']);
            $emailWarnings = $emailValidation['warnings'] ?? [];
            
            // Log email validation results for admin review
            if (!empty($emailWarnings) || $emailValidation['is_disposable']) {
                Log::warning('User updated with suspicious email', [
                    'user_id' => $user->employee_id,
                    'old_email' => $user->email,
                    'new_email' => $data['email'],
                    'validation' => $emailValidation,
                    'updated_by' => Auth::user()->email ?? 'Unknown'
                ]);
            }
        }

        // Handle employee_id auto-generation if not provided and user doesn't have one
        if (empty($data['employee_id']) && empty($user->employee_id)) {
            $data['employee_id'] = $this->generateEmployeeId($data['role_id'] ?? $user->role_id);
        }

        $user->update($data);

        // Send email notification if password was changed
        $emailSent = false;
        if ($passwordChanged && !empty($user->email) && !empty($newPassword)) {
            try {
                $adminUser = Auth::user();
                $updatedBy = $adminUser ? ($adminUser->first_name . ' ' . $adminUser->last_name) : 'System Administrator';
                
                $user->notify(new PasswordUpdatedNotification($newPassword, $updatedBy));
                $emailSent = true;
                
                Log::info('Password update email sent successfully', [
                    'user_id' => $user->employee_id,
                    'email' => $user->email,
                    'updated_by' => $updatedBy
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send password update email', [
                    'user_id' => $user->employee_id,
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
                
                // For AJAX requests, include email failure in response
                if ($request->ajax() && !$request->header('X-Inertia')) {
                    $responseData = [
                        'message' => 'User updated successfully, but failed to send password update email.',
                        'data' => $user->fresh(['role', 'department', 'plant']),
                        'email_sent' => false,
                        'password_changed' => true
                    ];
                    if (!empty($emailWarnings)) {
                        $responseData['email_warnings'] = $emailWarnings;
                    }
                    return response()->json($responseData);
                }
            }
        }

        // Prepare response message
        $message = 'User updated successfully.';
        if ($passwordChanged) {
            if ($emailSent) {
                $message .= ' Password update notification has been sent to their email.';
            } elseif (!empty($user->email)) {
                $message .= ' However, the password update email notification could not be sent.';
            }
        }

        // Prepare response data
        $responseData = ['message' => $message];
        if (!empty($emailWarnings)) {
            $responseData['email_warnings'] = $emailWarnings;
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            $responseData['data'] = $user->fresh(['role', 'department', 'plant']);
            $responseData['email_sent'] = $emailSent;
            $responseData['password_changed'] = $passwordChanged;
            return response()->json($responseData);
        }

        $flashType = !empty($emailWarnings) ? 'warning' : 'success';
        return redirect()->route('admin.users.index')
            ->with($flashType, $message)
            ->with('email_warnings', $emailWarnings);
    }

    public function destroy(User $user, Request $request): RedirectResponse|JsonResponse
    {
        $user->delete();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'User deleted successfully.'
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Search for employee by barcode (employee_id)
     */
    public function searchByBarcode(Request $request): JsonResponse
    {
        $barcode = $request->get('barcode');
        
        if (!$barcode) {
            return response()->json([
                'success' => false,
                'message' => 'Barcode is required'
            ], 400);
        }

        try {
            // Search for employee by employee_id (which is used as barcode)
            $employee = User::with(['role', 'department', 'plant'])
                ->where('employee_id', $barcode)
                ->first();

            if ($employee) {
                return response()->json([
                    'success' => true,
                    'employee' => [
                        'employee_id' => $employee->employee_id,
                        'first_name' => $employee->first_name,
                        'last_name' => $employee->last_name,
                        'email' => $employee->email,
                        'plant_id' => $employee->plant_id,
                        'department_id' => $employee->department_id,
                        'role' => $employee->role,
                        'department' => $employee->department,
                        'plant' => $employee->plant
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found with this ID'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error searching for employee'
            ], 500);
        }
    }

    /**
     * Search users for admin API
     */
    public function searchUsers(Request $request): JsonResponse
    {
        try {
            $query = User::with(['department', 'plant']);
            
            if ($request->has('employee_id')) {
                $employeeId = $request->get('employee_id');
                $users = $query->where('employee_id', $employeeId)->get();
            } elseif ($request->has('search')) {
                $search = $request->get('search');
                $users = $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                })->limit(10)->get();
            } else {
                $users = collect();
            }
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error searching for users'
            ], 500);
        }
    }

    /**
     * Get paginated users data for DataTable
     */
    public function tableData(Request $request): JsonResponse
    {
        $query = User::with(['role', 'department', 'plant']);

        // Apply search filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                  ->orWhere('last_name', 'like', '%' . $search . '%')
                  ->orWhere('full_name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('employee_id', 'like', '%' . $search . '%');
            });
        }

        // Apply filters
        if ($request->filled('role_name') && $request->get('role_name') !== 'all') {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('role_name', $request->get('role_name'));
            });
        }

        if ($request->filled('department_id') && $request->get('department_id') !== 'all') {
            $query->where('department_id', $request->get('department_id'));
        }

        if ($request->filled('plant_id') && $request->get('plant_id') !== 'all') {
            $query->where('plant_id', $request->get('plant_id'));
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        // Map frontend sort keys to database columns
        $sortMapping = [
            'name' => 'first_name',
            'email' => 'email',
            'role' => 'role_id',
            'department' => 'department_id',
            'plant' => 'plant_id',
            'created_at' => 'created_at'
        ];
        
        $dbSortBy = $sortMapping[$sortBy] ?? 'created_at';
        $query->orderBy($dbSortBy, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    /**
     * Validate email address
     */
    public function validateEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $emailValidator = app(EmailValidationService::class);
        $validation = $emailValidator->validateEmail($request->email);

        return response()->json([
            'validation' => $validation,
            'recommendations' => $this->getEmailRecommendations($validation)
        ]);
    }

    /**
     * Get email recommendations based on validation results
     */
    private function getEmailRecommendations(array $validation): array
    {
        $recommendations = [];

        if ($validation['is_disposable']) {
            $recommendations[] = [
                'type' => 'error',
                'message' => 'This is a disposable email address. Please use a permanent email address.'
            ];
        }

        if (!$validation['is_official']) {
            $recommendations[] = [
                'type' => 'warning',
                'message' => 'Consider using an official business email address for better security and communication.'
            ];
        }

        foreach ($validation['warnings'] as $warning) {
            $recommendations[] = [
                'type' => 'warning',
                'message' => $warning
            ];
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'type' => 'success',
                'message' => 'Email address looks good!'
            ];
        }

        return $recommendations;
    }

    /**
     * Generate a new employee ID for the given role
     */
    public function generateNewEmployeeId(Request $request): JsonResponse
    {
        $request->validate([
            'role_id' => 'required|exists:roles,role_id'
        ]);
        $roleId = $request->role_id || '2';

        try {
            $employeeId = $this->generateEmployeeId($request->role_id);
            
            return response()->json([
                'success' => true,
                'employee_id' => $employeeId
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate employee ID: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password and send email notification
     */
    public function resetPassword(Request $request, User $user): RedirectResponse|JsonResponse
    {
        $request->validate([
            'send_email' => 'boolean'
        ]);

        // Generate new temporary password
        $newPassword = Str::random(12);
        $user->update([
            'password' => Hash::make($newPassword)
        ]);

        // Send email notification if requested (default: true)
        $sendEmail = $request->get('send_email', true);
        if ($sendEmail) {
            try {
                $user->notify(new PasswordResetNotification($newPassword));
            } catch (\Exception $e) {
                \Log::error('Failed to send password reset email: ' . $e->getMessage());
                
                if ($request->ajax() && !$request->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Password reset successfully, but failed to send email notification.',
                        'new_password' => $newPassword
                    ]);
                }
                
                return redirect()->route('admin.users.index')
                    ->with('warning', 'Password reset successfully, but failed to send email notification. New password: ' . $newPassword);
            }
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => $sendEmail 
                    ? 'Password reset successfully. New credentials have been sent to the user\'s email.' 
                    : 'Password reset successfully.',
                'new_password' => $sendEmail ? null : $newPassword
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', $sendEmail 
                ? 'Password reset successfully. New credentials have been sent to the user\'s email.'
                : 'Password reset successfully. New password: ' . $newPassword
            );
    }

    /**
     * Generate a unique employee ID based on role
     */
    private function generateEmployeeId(int $roleId): int
    {
        // Get role name to determine prefix
        $role = Role::where('role_id', $roleId)->first();
        if (!$role) {
            throw new \Exception('Invalid role ID');
        }

        // Determine prefix based on role
        $prefix = match(strtolower($role->role_name)) {
            'admin' => '100',
            'technician' => '200', 
            'employee' => '300',
            default => '300' // Default to employee prefix
        };

        // Find the highest existing employee ID with this prefix
        $maxId = User::where('employee_id', 'like', $prefix . '%')
            ->max('employee_id');

        if ($maxId) {
            // Increment the highest existing ID
            $nextId = $maxId + 1;
        } else {
            // Start with prefix + 001
            $nextId = intval($prefix . '001');
        }

        // Ensure uniqueness (in case of race conditions)
        while (User::where('employee_id', $nextId)->exists()) {
            $nextId++;
        }

        return $nextId;
    }
}
