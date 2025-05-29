<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plant extends Model
{
    protected $primaryKey = 'plant_id';
    
    protected $fillable = [
        'plant_name',
        'address',
        'telephone'
    ];
    
    public function users()
    {
        return $this->hasMany(User::class, 'plant_id', 'plant_id');
    }
}
