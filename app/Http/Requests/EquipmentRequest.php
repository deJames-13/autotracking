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
            'recall_number' => ['required', 'string', 'max:255', 'unique:equipments,recall_number,' . ($this->route('equipment') ? $this->route('equipment')->equipment_id : 'NULL') . ',equipment_id'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'model' => ['required', 'string', 'max:255'],
            'manufacturer' => ['required', 'string', 'max:255'],
        ];
    }
}
