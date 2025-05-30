<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackingRecord extends Model
{
    protected $table = 'tracking_records';
    protected $primaryKey = 'tracking_id';
    
    protected $fillable = [
        'recall',
        'recall_number',
        'description',
        'equipment_id',
        'technician_id',
        'location_id_out',
        'location_id_in',
        'due_date',
        'date_in',
        'employee_id_in',
        'cal_date',
        'cal_due_date',
        'date_out',
        'employee_id_out',
        'cycle_time',
        'calibration_request_id',
        'notes'
    ];
    
    protected $casts = [
        'recall' => 'boolean',
        'due_date' => 'datetime',
        'date_in' => 'datetime',
        'date_out' => 'datetime',
        'cal_date' => 'date',
        'cal_due_date' => 'date'
    ];
    
    // Generate a unique recall number
    public static function generateUniqueRecallNumber(): string
    {
        $timestamp = now()->format('ymdHis');
        $random = mt_rand(10000, 99999);
        $recallNumber = "RCL-{$timestamp}-{$random}";
        
        // Ensure uniqueness by checking if it already exists
        while (self::where('recall_number', $recallNumber)->exists()) {
            $random = mt_rand(10000, 99999);
            $recallNumber = "RCL-{$timestamp}-{$random}";
        }
        
        return $recallNumber;
    }
    
    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipment_id', 'equipment_id');
    }
    
    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id', 'employee_id');
    }
    
    public function locationOut()
    {
        return $this->belongsTo(Location::class, 'location_id_out', 'location_id');
    }
    
    public function locationIn()
    {
        return $this->belongsTo(Location::class, 'location_id_in', 'location_id');
    }
    
    public function employeeIn()
    {
        return $this->belongsTo(User::class, 'employee_id_in', 'employee_id');
    }
    
    public function employeeOut()
    {
        return $this->belongsTo(User::class, 'employee_id_out', 'employee_id');
    }
}
