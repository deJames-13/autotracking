<?php

namespace App\Http\Requests;

use App\Models\User;
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
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId, 'employee_id')
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
}
