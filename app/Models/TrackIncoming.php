<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackIncoming extends Model
{
    protected $table = 'track_incoming';
    
    protected $fillable = [
        'recall_number',
        'technician_id',
        'description',
        'equipment_id',
        'location_id',
        'received_by_id',
        'serial_number',
        'model',
        'manufacturer',
        'due_date',
        'date_in',
        'employee_id_in',
        'status',
        'notes'
    ];
    
    protected $casts = [
        'due_date' => 'datetime',
        'date_in' => 'datetime'
    ];
    
    // Generate a unique recall number
    public static function generateUniqueRecallNumber(): string
    {
        $timestamp = now()->format('ymdHis');
        $random = mt_rand(10000, 99999);
        $combined = $timestamp * $random;
        $first6 = substr($combined, 0, 6);
        $recallNumber = "RCL-{$first6}";
        
        while (self::where('recall_number', $recallNumber)->exists()) {
            $random = mt_rand(10000, 99999);
            $combined = $timestamp * $random;
            $first6 = substr($combined, 0, 6);
            $recallNumber = "RCL-{$first6}";
        }
        return $recallNumber;
    }
    
    // Relationships
    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipment_id', 'equipment_id');
    }
    
    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id', 'employee_id');
    }
    
    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id', 'location_id');
    }
    
    public function employeeIn()
    {
        return $this->belongsTo(User::class, 'employee_id_in', 'employee_id');
    }
    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id', 'employee_id');
    }
    
    
    public function trackOutgoing()
    {
        return $this->hasOne(TrackOutgoing::class, 'recall_number', 'recall_number');
    }
}
