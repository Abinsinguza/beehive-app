<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Advisory is a generated record — one is created per inference that warrants
 * a recommendation.  It references an AdvisoryTemplate for the advisory text
 * and copies the relevant fields at creation time so the record remains
 * accurate even if the template is later edited.
 *
 * Table: advisories
 * advisory_type: 'Reactive' | 'Preventive'
 * severity:      'info' | 'low' | 'medium' | 'high' | 'critical'
 */
class Advisory extends Model
{
    protected $table      = 'advisories';
    protected $primaryKey = 'advisory_id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'advisory_id',
        'inference_id',
        'hive_id',
        'template_id',
        'advisory_type',
        'condition_label',
        'advisory_text',
        'severity',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function inference()
    {
        return $this->belongsTo(Inference::class, 'inference_id', 'inference_id');
    }

    public function hive()
    {
        return $this->belongsTo(Hive::class, 'hive_id', 'hive_id');
    }

    public function template()
    {
        return $this->belongsTo(AdvisoryTemplate::class, 'template_id', 'template_id');
    }

    public function actions()
    {
        return $this->hasMany(AdvisoryAction::class, 'advisory_id', 'advisory_id');
    }
}
