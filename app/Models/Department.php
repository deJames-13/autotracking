<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'department_id';
    
    protected $fillable = [
        'department_name'
    ];
    
    public function users()
    {
        return $this->hasMany(User::class, 'department_id', 'department_id');
    }
    
    public function equipment()
    {
        return $this->hasMany(Equipment::class, 'department_id', 'department_id');
    }
    
    public function locations()
    {
        return $this->hasMany(Location::class, 'department_id', 'department_id');
    }
}
