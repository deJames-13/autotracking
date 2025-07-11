<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plant extends Model
{
    use HasFactory, SoftDeletes;
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
    
    public function equipments()
    {
        return $this->hasMany(Equipment::class, 'plant_id', 'plant_id');
    }
}
