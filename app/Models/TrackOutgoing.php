<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrackOutgoing extends Model
{
    use SoftDeletes;
    protected $table = 'track_outgoing';
    
    protected $fillable = [
        'incoming_id',
        'cal_date',
        'cal_due_date',
        'date_out',
        'employee_id_out',
        'released_by_id',
        'cycle_time',
        'ct_reqd',
        'commit_etc',
        'actual_etc',
        'overdue',
        'status'
    ];
    
    protected $casts = [
        'cal_date' => 'date',
        'cal_due_date' => 'date',
        'date_out' => 'datetime',
        'commit_etc' => 'date',
        'actual_etc' => 'date'
    ];
    
    // Relationships
    public function trackIncoming()
    {
        return $this->belongsTo(TrackIncoming::class, 'incoming_id', 'id');
    }
    
    public function employeeOut()
    {
        return $this->belongsTo(User::class, 'employee_id_out', 'employee_id');
    }
    
    public function releasedBy()
    {
        return $this->belongsTo(User::class, 'released_by_id', 'employee_id');
    }
    
    // Access equipment through incoming record
    public function equipment()
    {
        return $this->hasOneThrough(
            Equipment::class,
            TrackIncoming::class,
            'id', // local key on TrackIncoming
            'equipment_id',
            'incoming_id', // local key on this model
            'equipment_id' // foreign key on Equipment
        );
    }
    
    // Access technician through incoming record
    public function technician()
    {
        return $this->hasOneThrough(
            User::class,
            TrackIncoming::class,
            'id',
            'employee_id',
            'incoming_id',
            'technician_id'
        );
    }
    
    // Access location through incoming record
    public function location()
    {
        return $this->hasOneThrough(
            Location::class,
            TrackIncoming::class,
            'id',
            'location_id',
            'incoming_id',
            'location_id'
        );
    }
}
