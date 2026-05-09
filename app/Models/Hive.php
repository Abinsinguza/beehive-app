<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Hive maps to the unified 'hives' table (was 'beehives' in the old schema).
 * Primary key is a UUID string (hive_id).
 * owner_id → users.user_id
 */
class Hive extends Model
{
    use HasFactory;

    protected $table      = 'hives';
    protected $primaryKey = 'hive_id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'hive_id',
        'owner_id',
        'hive_name',
        'hive_location',
        'hive_type',
        'installation_date',
        'current_state',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'installation_date' => 'date',
        'latitude'          => 'float',
        'longitude'         => 'float',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id', 'user_id');
    }

    public function inferences()
    {
        return $this->hasMany(Inference::class, 'hive_id', 'hive_id');
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class, 'hive_id', 'hive_id');
    }

    public function advisories()
    {
        return $this->hasMany(Advisory::class, 'hive_id', 'hive_id');
    }

    public function latestInference()
    {
        return $this->hasOne(Inference::class, 'hive_id', 'hive_id')
                    ->latestOfMany('analyzed_at');
    }
}
