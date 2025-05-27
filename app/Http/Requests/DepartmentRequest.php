<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_name' => ['required', 'string', 'max:255', 'unique:departments,department_name,' . ($this->route('department') ? $this->route('department')->department_id : 'NULL') . ',department_id'],
        ];
    }
}
