<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plant_name' => ['required', 'string', 'max:255', 'unique:plants,plant_name,' . ($this->route('plant') ? $this->route('plant')->plant_id : 'NULL') . ',plant_id'],
        ];
    }
}
