<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'location_name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    // Custom validation - check if name contains valid characters
                    if (!preg_match('/^[a-zA-Z0-9\s\-_]+$/', $value)) {
                        $fail('Location name can only contain letters, numbers, spaces, hyphens, and underscores.');
                    }
                }
            ],
            'department_id' => 'required|exists:departments,department_id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'location_name.required' => 'Location name is required',
            'location_name.string' => 'Location name must be text',
            'location_name.max' => 'Location name must be less than 255 characters',
            'department_id.required' => 'Department is required',
            'department_id.exists' => 'Selected department does not exist',
        ];
    }
}
