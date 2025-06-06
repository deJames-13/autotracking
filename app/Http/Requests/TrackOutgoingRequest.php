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
            'commit_etc' => ['nullable', 'integer', 'min:0'],
            'actual_etc' => ['nullable', 'integer', 'min:0'],
            'overdue' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
