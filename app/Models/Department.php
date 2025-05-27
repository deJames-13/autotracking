<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $primaryKey = 'department_id';
    
    protected $fillable = [
        'department_name'
    ];
    
    public function users()
    {
        return $this->hasMany(User::class, 'department_id', 'department_id');
    }
    
    public function locations()
    {
        return $this->hasMany(Location::class, 'department_id', 'department_id');
    }
}
