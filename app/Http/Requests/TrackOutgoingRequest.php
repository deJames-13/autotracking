<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrackOutgoingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'incoming_id' => ['required', 'integer', 'exists:track_incoming,id'],
            'cal_date' => ['required', 'date'],
            'cal_due_date' => ['required', 'date', 'after_or_equal:cal_date'],
            'date_out' => ['required', 'date'],
            'employee_id_out' => ['nullable', 'exists:users,employee_id'],
            'released_by_id' => ['nullable', 'exists:users,employee_id'], 
            'cycle_time' => ['required', 'integer', 'min:0'],
            'ct_reqd' => ['nullable', 'integer', 'min:0'],
            'commit_etc' => ['nullable', 'date'],
            'actual_etc' => ['nullable', 'date'],
            'overdue' => ['nullable', function ($attribute, $value, $fail) {
                // Accept integer values (0/1) for database compatibility
                if (is_int($value) && in_array($value, [0, 1])) {
                    return;
                }
                // Accept string values (yes/no) from frontend
                if (is_string($value) && in_array(strtolower($value), ['yes', 'no'])) {
                    return;
                }
                $fail('The ' . $attribute . ' field must be 0, 1, "yes", or "no".');
            }],
        ];
    }
}
