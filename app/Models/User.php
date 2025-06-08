<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\CustomResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

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

    /**
     * Send the password reset notification with custom content.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }

    /**
     * Get the email address for password reset notifications.
     * Override if needed to use a different field.
     */
    public function getEmailForPasswordReset(): string
    {
        return $this->email ?? '';
    }

    /**
     * Get the full name of the user.
     */
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }
}
