<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use SoftDeletes;
    protected $primaryKey = 'location_id';
    
    protected $fillable = [
        'location_name',
        'department_id'
    ];
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function trackIncoming()
    {
        return $this->hasMany(TrackIncoming::class, 'location_id', 'location_id');
    }

    public function trackOutgoing()
    {
        return $this->hasManyThrough(
            TrackOutgoing::class,
            TrackIncoming::class,
            'location_id', // Foreign key on track_incoming table
            'incoming_id', // Foreign key on track_outgoing table
            'location_id', // Local key on locations table
            'id' // Local key on track_incoming table
        );
    }
}
