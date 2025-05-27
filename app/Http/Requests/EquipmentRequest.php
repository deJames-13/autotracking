<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['nullable', 'exists:users,employee_id'],
            'serial_number' => ['required', 'string', 'max:255', 'unique:equipments,serial_number,' . ($this->route('equipment') ? $this->route('equipment')->equipment_id : 'NULL') . ',equipment_id'],
            'description' => ['required', 'string'],
            'manufacturer' => ['required', 'string', 'max:255'],
        ];
    }
}
