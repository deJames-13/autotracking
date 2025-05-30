<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackOutgoing extends Model
{
    protected $table = 'track_outgoing';
    
    protected $fillable = [
        'recall_number',
        'cal_date',
        'cal_due_date',
        'date_out',
        'employee_id_out',
        'cycle_time'
    ];
    
    protected $casts = [
        'cal_date' => 'date',
        'cal_due_date' => 'date',
        'date_out' => 'datetime'
    ];
    
    // Relationships
    public function trackIncoming()
    {
        return $this->belongsTo(TrackIncoming::class, 'recall_number', 'recall_number');
    }
    
    public function employeeOut()
    {
        return $this->belongsTo(User::class, 'employee_id_out', 'employee_id');
    }
    
    // Access equipment through incoming record
    public function equipment()
    {
        return $this->hasOneThrough(
            Equipment::class,
            TrackIncoming::class,
            'recall_number',
            'equipment_id',
            'recall_number',
            'equipment_id'
        );
    }
    
    // Access technician through incoming record
    public function technician()
    {
        return $this->hasOneThrough(
            User::class,
            TrackIncoming::class,
            'recall_number',
            'employee_id',
            'recall_number',
            'technician_id'
        );
    }
}
