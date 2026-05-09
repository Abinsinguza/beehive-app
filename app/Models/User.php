<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $table      = 'users';
    protected $primaryKey = 'user_id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'user_id',
        'full_name',
        'email',
        'phone',
        'address',
        'password_hash',
        'role',
    ];

    protected $hidden = [
        'password_hash',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password_hash'     => 'hashed',
        ];
    }

    // ── Auth overrides ────────────────────────────────────────────────────────

    // Laravel auth checks this column for the stored hash.
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    // ── Accessors / mutators ──────────────────────────────────────────────────

    // Expose 'name' as an alias for full_name so Fortify / Inertia pages work
    // without touching every view that references $user->name.
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->full_name ?? '',
            set: fn ($value) => ['full_name' => $value],
        );
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function hives()
    {
        return $this->hasMany(Hive::class, 'owner_id', 'user_id');
    }
}
