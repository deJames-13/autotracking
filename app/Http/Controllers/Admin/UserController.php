<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Imports\UserImport;
use App\Models\Department;
use App\Models\Plant;
use App\Models\Role;
use App\Models\User;
use App\Notifications\UserCreatedNotification;
use App\Notifications\PasswordResetNotification;
use App\Notifications\PasswordUpdatedNotification;
use App\Notifications\SuspiciousEmailRegistrationNotification;
use App\Services\EmailValidationService;
use App\Services\EnhancedEmailService;
use App\Services\MailConfigurationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException as ExcelValidationException;

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

    public function create(): JsonResponse
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return response()->json([
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
        $emailValidation = null;
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

        // Send admin notification for suspicious email registrations
        if (!empty($emailWarnings) || ($emailValidation && $emailValidation['is_disposable'])) {
            $this->sendAdminSuspiciousEmailNotification($user, $emailValidation, Auth::user());
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

    public function show(User $user, Request $request): JsonResponse
    {
        $user->load(['role', 'department', 'plant', 'equipments']);
        
        return response()->json([
            'data' => $user
        ]);
    }

    public function edit(User $user): JsonResponse
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return response()->json([
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

        // Send admin notification for suspicious email updates
        if (!empty($emailWarnings) && isset($emailValidation)) {
            $this->sendAdminSuspiciousEmailNotification($user, $emailValidation, Auth::user());
        }

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
        // Prevent deletion of current user
        if (Auth::id() === $user->employee_id) {
            $errorMessage = 'Cannot delete your own account.';

            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'user' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.users.index')
                ->with('error', $errorMessage);
        }

        // Prevent deletion of the last admin user
        $user->load('role');
        if ($user->role && $user->role->role_name === 'admin') {
            $adminCount = User::whereHas('role', function ($query) {
                $query->where('role_name', 'admin');
            })->count();

            if ($adminCount <= 1) {
                $errorMessage = 'Cannot delete the last admin user. At least one admin must remain in the system.';

                // For Inertia requests, throw validation exception
                if ($request->header('X-Inertia')) {
                    throw ValidationException::withMessages([
                        'user' => $errorMessage
                    ]);
                }

                // Return JSON only for non-Inertia AJAX requests
                if ($request->ajax()) {
                    return response()->json([
                        'message' => $errorMessage
                    ], 422);
                }

                return redirect()->route('admin.users.index')
                    ->with('error', $errorMessage);
            }
        }

        // Check for foreign key constraints before deletion
        $forceDelete = $request->boolean('force', false);
        $equipmentCount = $user->equipments()->count();
        $trackIncomingAsTechnicianCount = $user->trackIncomingAsTechnician()->count();
        $trackIncomingAsEmployeeInCount = $user->trackIncomingAsEmployeeIn()->count();
        $trackIncomingAsReceivedByCount = $user->trackIncomingAsReceivedBy()->count();
        $trackOutgoingAsEmployeeOutCount = $user->trackOutgoingAsEmployeeOut()->count();

        $totalTrackingRecords = $trackIncomingAsTechnicianCount + $trackIncomingAsEmployeeInCount + 
                               $trackIncomingAsReceivedByCount + $trackOutgoingAsEmployeeOutCount;

        if (($equipmentCount > 0 || $totalTrackingRecords > 0) && !$forceDelete) {
            $errorMessage = 'Cannot archive user. They have ';
            $dependencies = [];
            
            if ($equipmentCount > 0) {
                $dependencies[] = "{$equipmentCount} equipment item(s) assigned";
            }
            if ($totalTrackingRecords > 0) {
                $dependencies[] = "{$totalTrackingRecords} tracking record(s) associated";
            }
            
            $errorMessage .= implode(' and ', $dependencies) . ' with them.';

            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'user' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.users.index')
                ->with('error', $errorMessage);
        }

        // If force delete is enabled, nullify related records
        if ($forceDelete) {
            $this->forceDeleteUserWithRelations($user);
            $message = 'User deleted and all references set to null successfully.';
        } else {
            $user->delete(); // This is now a soft delete due to SoftDeletes trait
            $message = 'User archived successfully.';
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => $message
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', $message);
    }

    /**
     * Restore a soft deleted user
     */
    public function restore($id, Request $request): RedirectResponse|JsonResponse
    {
        $user = User::onlyTrashed()->where('employee_id', $id)->first();
        
        if (!$user) {
            $errorMessage = 'Archived user not found.';
            
            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'user' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.users.index')
                ->with('error', $errorMessage);
        }

        $user->restore();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'User restored successfully.'
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User restored successfully.');
    }

    /**
     * Permanently delete a user (force delete)
     */
    public function forceDelete($id, Request $request): RedirectResponse|JsonResponse
    {
        $user = User::onlyTrashed()->where('employee_id', $id)->first();
        
        if (!$user) {
            $errorMessage = 'Archived user not found.';
            
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'user' => $errorMessage
                ]);
            }

            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.users.archived')
                ->with('error', $errorMessage);
        }

        // Permanently delete the user
        $user->forceDelete();

        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'User permanently deleted.'
            ]);
        }

        return redirect()->route('admin.users.archived')
            ->with('success', 'User permanently deleted.');
    }

    /**
     * Get archived users for display
     */
    public function archived(Request $request): Response|JsonResponse
    {
        $query = User::onlyTrashed()
            ->with(['role', 'department', 'plant']);

        // Add search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('deleted_at', 'desc')
                      ->paginate($request->get('per_page', 10));

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => [
                    'data' => $users->items(),
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                    'from' => $users->firstItem(),
                    'to' => $users->lastItem(),
                ]
            ]);
        }

        return Inertia::render('admin/users/archived', [
            'users' => $users,
        ]);
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

    /**
     * Send admin notification for suspicious email registrations
     */
    private function sendAdminSuspiciousEmailNotification(User $user, array $emailValidation, User $createdBy): void
    {
        try {
            // Get all admin users to notify
            $adminUsers = User::whereHas('role', function ($query) {
                $query->where('role_name', 'admin');
            })->where('email', '!=', null)->get();

            if ($adminUsers->isEmpty()) {
                Log::warning('No admin users with email found to send suspicious email notification', [
                    'user_id' => $user->employee_id,
                    'email' => $user->email
                ]);
                return;
            }

            $createdByName = $createdBy ? trim($createdBy->first_name . ' ' . $createdBy->last_name) : 'System';

            // Send notification to each admin
            foreach ($adminUsers as $admin) {
                try {
                    $admin->notify(new SuspiciousEmailRegistrationNotification(
                        $user, 
                        $emailValidation, 
                        $createdByName
                    ));
                    
                    Log::info('Suspicious email notification sent to admin', [
                        'admin_id' => $admin->employee_id,
                        'admin_email' => $admin->email,
                        'user_id' => $user->employee_id,
                        'user_email' => $user->email
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send suspicious email notification to admin', [
                        'admin_id' => $admin->employee_id,
                        'admin_email' => $admin->email,
                        'user_id' => $user->employee_id,
                        'user_email' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error in sendAdminSuspiciousEmailNotification', [
                'user_id' => $user->employee_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Check email system health
     */
    public function checkEmailHealth(): JsonResponse
    {
        $enhancedEmailService = app(EnhancedEmailService::class);
        $healthStatus = $enhancedEmailService->getSystemHealth();

        return response()->json([
            'status' => $healthStatus,
            'is_healthy' => $healthStatus['overall_status'],
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Test email system functionality
     */
    public function testEmailSystem(Request $request): JsonResponse
    {
        $request->validate([
            'test_email' => 'required|email'
        ]);

        $enhancedEmailService = app(EnhancedEmailService::class);
        $testResult = $enhancedEmailService->testEmailSystem($request->test_email);

        return response()->json([
            'test_result' => $testResult,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Force delete user and set related foreign keys to null
     */
    private function forceDeleteUserWithRelations(User $user): void
    {
        \DB::transaction(function () use ($user) {
            // 1. Set employee_id to null in equipments table
            \DB::table('equipments')
                ->where('employee_id', $user->employee_id)
                ->update(['employee_id' => null]);

            // 2. Set user foreign keys to null in track_incoming
            \DB::table('track_incoming')
                ->where('technician_id', $user->employee_id)
                ->update(['technician_id' => null]);

            \DB::table('track_incoming')
                ->where('employee_id_in', $user->employee_id)
                ->update(['employee_id_in' => null]);

            \DB::table('track_incoming')
                ->where('received_by_id', $user->employee_id)
                ->update(['received_by_id' => null]);

            // 3. Set user foreign keys to null in track_outgoing
            \DB::table('track_outgoing')
                ->where('employee_id_out', $user->employee_id)
                ->update(['employee_id_out' => null]);

            \DB::table('track_outgoing')
                ->where('released_by_id', $user->employee_id)
                ->update(['released_by_id' => null]);

            // 4. Finally, force delete the user itself
            $user->forceDelete();
        });
    }

    /**
     * Import users from Excel file
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $import = new UserImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Users imported successfully!'
            ]);
        } catch (ExcelValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors occurred during import.',
                'errors' => $e->failures()
            ], 422);
        } catch (\Exception $e) {
            Log::error('User import failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample Excel template for user import
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $headers = [
            'first_name',
            'last_name', 
            'middle_name',
            'email',
            'password',
            'role_name',
            'department_name',
            'plant_name'
        ];

        $sampleData = [
            [
                'Derick',
                'Espinosa', 
                'E',
                'derick.espinosa@company.com',
                'password123',
                'admin',
                'Admin',
                'P1'
            ],
            [
                'Maria',
                'Santos',
                'C',
                'maria.santos@company.com',
                'secure456',
                'technician',
                'Calibrations',
                'P2'
            ],
            [
                'John',
                'Rodriguez',
                'A',
                'john.rodriguez@company.com',
                'pass789',
                'employee',
                'Tracking',
                'P3'
            ]
        ];

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Add headers
        foreach ($headers as $key => $header) {
            $sheet->setCellValue(chr(65 + $key) . '1', $header);
        }

        // Add sample data
        foreach ($sampleData as $rowIndex => $row) {
            foreach ($row as $colIndex => $value) {
                $sheet->setCellValue(chr(65 + $colIndex) . ($rowIndex + 2), $value);
            }
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        $fileName = 'user_import_template.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), $fileName);
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }
}
