<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipments'; // Explicitly set table name
    protected $primaryKey = 'equipment_id';
    
    protected $fillable = [
        'employee_id',
        'recall_number',
        'serial_number',
        'description',
        'model',
        'manufacturer',
        'plant_id',
        'department_id',
        'location_id',
        'status',
        'last_calibration_date',
        'next_calibration_due',
        'process_req_range_start',
        'process_req_range_end'
    ];

    protected $casts = [
        'last_calibration_date' => 'date',
        'next_calibration_due' => 'date'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'employee_id', 'employee_id');
    }
    
    public function plant()
    {
        return $this->belongsTo(Plant::class, 'plant_id', 'plant_id');
    }
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id', 'location_id');
    }
    
    public function trackIncoming()
    {
        return $this->hasMany(TrackIncoming::class, 'equipment_id', 'equipment_id');
    }
}
