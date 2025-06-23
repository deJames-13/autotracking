<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Services\EmailValidationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user') ? $this->route('user')->employee_id : null;

        return [
            'employee_id' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[0-9]+$/',
                Rule::unique('users', 'employee_id')->ignore($userId, 'employee_id')
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId, 'employee_id'),
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $validator = app(EmailValidationService::class);
                        $validation = $validator->validateEmail($value);
                        
                        if ($validation['is_disposable']) {
                            $fail('Disposable or temporary email addresses are not allowed.');
                        }
                        
                        if (!empty($validation['errors'])) {
                            $fail(implode(' ', $validation['errors']));
                        }
                    }
                }
            ],
            'password' => $this->isMethod('POST') 
                ? ['required', 'string', 'min:4'] 
                : ['nullable', 'string', 'min:4'],
            'role_id' => ['required', 'exists:roles,role_id'],
            'department_id' => ['nullable', 'exists:departments,department_id'],
            'plant_id' => ['nullable', 'exists:plants,plant_id'],
            'avatar' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get email validation warnings for the frontend
     */
    public function getEmailWarnings(): array
    {
        if (!$this->has('email') || !$this->email) {
            return [];
        }

        $validator = app(EmailValidationService::class);
        $validation = $validator->validateEmail($this->email);
        
        return $validation['warnings'] ?? [];
    }
}
