<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Alert is raised when an inference result warrants immediate farmer attention.
 *
 * Table: alerts
 * severity_level: 'info' | 'low' | 'medium' | 'high' | 'critical'
 * action_status:  'pending' | 'sent' | 'acknowledged'
 *
 * NOTE: The old model was named 'Alerts' (plural). It is now 'Alert' (singular)
 * following Laravel conventions.  The old Alerts.php file is kept as a thin
 * alias below to avoid breaking any existing references.
 */
class Alert extends Model
{
    protected $table      = 'alerts';
    protected $primaryKey = 'alert_id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'alert_id',
        'hive_id',
        'inference_id',
        'advisory_id',
        'severity_level',
        'recommended_action',
        'action_status',
        'alert_timestamp',
    ];

    protected $casts = [
        'alert_timestamp' => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function hive()
    {
        return $this->belongsTo(Hive::class, 'hive_id', 'hive_id');
    }

    public function inference()
    {
        return $this->belongsTo(Inference::class, 'inference_id', 'inference_id');
    }

    public function advisory()
    {
        return $this->belongsTo(Advisory::class, 'advisory_id', 'advisory_id');
    }
}
