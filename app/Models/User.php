<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'employee_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'password',
        'role_id',
        'department_id',
        'plant_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
    
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function plant()
    {
        return $this->belongsTo(Plant::class, 'plant_id', 'plant_id');
    }
    
    public function equipments()
    {
        return $this->hasMany(Equipment::class, 'employee_id', 'employee_id');
    }
    
    public function trackIncomingAsTechnician()
    {
        return $this->hasMany(TrackIncoming::class, 'technician_id', 'employee_id');
    }
    
    public function trackIncomingAsEmployeeIn()
    {
        return $this->hasMany(TrackIncoming::class, 'employee_id_in', 'employee_id');
    }
    
    public function trackIncomingAsReceivedBy()
    {
        return $this->hasMany(TrackIncoming::class, 'received_by_id', 'employee_id');
    }

    public function trackOutgoingAsEmployeeOut()
    {
        return $this->hasMany(TrackOutgoing::class, 'employee_id_out', 'employee_id');
    }
}
