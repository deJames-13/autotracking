<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_name' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,department_id'],
        ];
    }
}
