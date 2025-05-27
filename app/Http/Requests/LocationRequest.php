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
        $locationId = $this->route('location') ? $this->route('location')->location_id : 'NULL';
        
        return [
            'location_name' => [
                'required', 
                'string', 
                'max:255',
                "unique:locations,location_name,{$locationId},location_id"
            ],
            'department_id' => ['required', 'exists:departments,department_id'],
        ];
    }

    public function messages(): array
    {
        return [
            'location_name.required' => 'Location name is required.',
            'location_name.unique' => 'A location with this name already exists.',
            'department_id.required' => 'Department is required.',
            'department_id.exists' => 'The selected department does not exist.',
        ];
    }
}
