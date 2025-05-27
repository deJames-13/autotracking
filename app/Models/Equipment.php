<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipments'; // Explicitly set table name
    protected $primaryKey = 'equipment_id';
    
    protected $fillable = [
        'employee_id',
        'serial_number',
        'description',
        'manufacturer'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'employee_id', 'employee_id');
    }
    
    public function trackingRecords()
    {
        return $this->hasMany(TrackingRecord::class, 'equipment_id', 'equipment_id');
    }
}
