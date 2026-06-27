<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable, TwoFactorAuthenticatable;

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'address',
        'password_hash',
        'role',
        'device_token',
        'device_token_updated_at',
        'server_url',
        'api_key',
    ];

    protected $hidden = [
        'password_hash',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'device_token',
    ];

    protected $appends = ['name', 'status', 'id'];

    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'password_hash'           => 'hashed',
            'device_token_updated_at' => 'datetime',
            'api_key'                 => 'string',
        ];
    }

    public function uniqueIds(): array
    {
        return ['user_id'];
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getNameAttribute(): string
    {
        return $this->full_name ?? '';
    }

    public function getIdAttribute(): string
    {
        return $this->user_id ?? '';
    }

    public function beehives()
    {
        return $this->hasMany(Beehive::class, 'owner_id', 'user_id');
    }

    /**
     * Derive a status label from the role for display purposes.
     */
    public function getStatusAttribute(): string
    {
        return match ($this->role) {
            'beekeeper_revoked' => 'revoked',
            'beekeeper_pending' => 'pending',
            default             => 'active',
        };
    }
}
