<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * AdvisoryTemplate is the static lookup table that maps each ML classification
 * (hive_state) to a human-readable advisory text, severity, and type.
 *
 * Table: advisory_templates
 * This was formerly called 'advisories' in the old beehive-app schema.
 * 9 rows are pre-seeded in output.sql — one per hive_state vocabulary value.
 */
class AdvisoryTemplate extends Model
{
    protected $table      = 'advisory_templates';
    protected $primaryKey = 'template_id';
    public    $incrementing = true;
    protected $keyType    = 'int';

    protected $fillable = [
        'prediction_code',
        'hive_state',
        'condition_label',
        'advisory_text',
        'advisory_type',
        'severity',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function generatedAdvisories()
    {
        return $this->hasMany(Advisory::class, 'template_id', 'template_id');
    }
}
