<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrackIncoming extends Model
{
    use SoftDeletes;
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
    
    // Generate a unique recall number with 7-10 characters (A-Z, 0-9), no prefix
    public static function generateUniqueRecallNumber(): string
    {
        $length = rand(7, 10);
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        do {
            $recallNumber = '';
            for ($i = 0; $i < $length; $i++) {
                $recallNumber .= $characters[random_int(0, strlen($characters) - 1)];
            }
        } while (self::where('recall_number', $recallNumber)->exists());
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
        return $this->hasOne(TrackOutgoing::class, 'incoming_id', 'id');
    }
}
