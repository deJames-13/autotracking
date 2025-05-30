<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $primaryKey = 'location_id';
    
    protected $fillable = [
        'location_name',
        'department_id'
    ];
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function trackingRecords()
    {
        return $this->hasMany(TrackingRecord::class, 'location_id', 'location_id');
    }

    public function trackIncoming()
    {
        return $this->hasMany(TrackIncoming::class, 'location_id', 'location_id');
    }

    public function trackOutgoing()
    {
        return $this->hasMany(TrackOutgoing::class, 'location_id', 'location_id');
    }
}
