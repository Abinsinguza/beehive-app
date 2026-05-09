<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Beekeeper is not a separate table — it is a scoped view of the unified
 * 'users' table where role = 'farmer'.  A global scope is applied automatically
 * so all queries on this model only touch farmer records.
 */
class Beekeeper extends Model
{

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

    protected $hidden = ['password_hash'];

    // Always scope to farmers when querying through this model.
    protected static function booted(): void
    {
        static::addGlobalScope('role', fn ($q) => $q->where('role', 'farmer'));

        // Every new record created via this model is a farmer by default.
        static::creating(function (self $model) {
            $model->role = 'farmer';
        });
    }

    // ── Column aliases (Laravel views use 'name'; DB column is full_name) ────

    public function getNameAttribute(): string
    {
        return $this->attributes['full_name'] ?? '';
    }

    public function setNameAttribute(string $value): void
    {
        $this->attributes['full_name'] = $value;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function hives()
    {
        return $this->hasMany(Hive::class, 'owner_id', 'user_id');
    }
}
