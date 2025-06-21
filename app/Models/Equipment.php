<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipment extends Model
{
    use SoftDeletes;
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
        'process_req_range_end',
        'process_req_range' // New combined field
    ];

    protected $casts = [
        'last_calibration_date' => 'date:Y-m-d',
        'next_calibration_due' => 'date:Y-m-d'
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
    
    /**
     * Backward compatibility: Get process_req_range_start from the combined field
     */
    public function getProcessReqRangeStartAttribute()
    {
        // If the new combined field exists and has a value, try to parse it
        if (isset($this->attributes['process_req_range']) && !empty($this->attributes['process_req_range'])) {
            $range = $this->attributes['process_req_range'];
            // Try to extract start value from formats like "100 - 200", "100-200", "100 to 200"
            if (preg_match('/^([^-\s]+)\s*(?:-|to)\s*([^-\s]+)$/i', trim($range), $matches)) {
                return trim($matches[1]);
            }
            // If no separator found, return the whole value as start
            return $range;
        }
        
        // Fallback to old field if it exists
        return $this->attributes['process_req_range_start'] ?? null;
    }
    
    /**
     * Backward compatibility: Get process_req_range_end from the combined field
     */
    public function getProcessReqRangeEndAttribute()
    {
        // If the new combined field exists and has a value, try to parse it
        if (isset($this->attributes['process_req_range']) && !empty($this->attributes['process_req_range'])) {
            $range = $this->attributes['process_req_range'];
            // Try to extract end value from formats like "100 - 200", "100-200", "100 to 200"
            if (preg_match('/^([^-\s]+)\s*(?:-|to)\s*([^-\s]+)$/i', trim($range), $matches)) {
                return trim($matches[2]);
            }
            // If no separator found, return null (no end range)
            return null;
        }
        
        // Fallback to old field if it exists
        return $this->attributes['process_req_range_end'] ?? null;
    }
    
    /**
     * Mutator to handle setting process_req_range_start (for backward compatibility)
     */
    public function setProcessReqRangeStartAttribute($value)
    {
        // If we have both start and end, combine them
        $end = $this->attributes['process_req_range_end'] ?? null;
        
        if ($value && $end) {
            $this->attributes['process_req_range'] = trim($value) . ' - ' . trim($end);
        } elseif ($value) {
            $this->attributes['process_req_range'] = $value;
        } else {
            $this->attributes['process_req_range'] = null;
        }
        
        // Also set the old field for backward compatibility during transition
        $this->attributes['process_req_range_start'] = $value;
    }
    
    /**
     * Mutator to handle setting process_req_range_end (for backward compatibility)
     */
    public function setProcessReqRangeEndAttribute($value)
    {
        // If we have both start and end, combine them
        $start = $this->attributes['process_req_range_start'] ?? null;
        
        if ($start && $value) {
            $this->attributes['process_req_range'] = trim($start) . ' - ' . trim($value);
        } elseif ($start && !$value) {
            $this->attributes['process_req_range'] = $start;
        } else {
            $this->attributes['process_req_range'] = $value;
        }
        
        // Also set the old field for backward compatibility during transition
        $this->attributes['process_req_range_end'] = $value;
    }
}
