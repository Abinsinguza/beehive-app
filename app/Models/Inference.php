<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Inference maps to the unified 'inference_results' table.
 * Primary key is a UUID string (inference_id).
 * hive_state uses the unified vocabulary:
 *   normal | pre_swarm | swarm | abscondment | missing_queen |
 *   queenbee_present | pest_infested | external_noise | uncertain
 */
class Inference extends Model
{
    use HasFactory;

    protected $table      = 'inference_results';
    protected $primaryKey = 'inference_id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    // created_at / updated_at — inference_results only has created_at.
    const UPDATED_AT = null;

    protected $fillable = [
        'inference_id',
        'hive_id',
        'audio_id',
        'feature_id',
        'hive_state',
        'confidence_score',
        'inference_latency_ms',
        'analyzed_at',
    ];

    protected $casts = [
        'analyzed_at'          => 'datetime',
        'confidence_score'     => 'float',
        'inference_latency_ms' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function hive()
    {
        return $this->belongsTo(Hive::class, 'hive_id', 'hive_id');
    }

    public function alert()
    {
        return $this->hasOne(Alert::class, 'inference_id', 'inference_id');
    }

    public function advisory()
    {
        return $this->hasOne(Advisory::class, 'inference_id', 'inference_id');
    }
}
