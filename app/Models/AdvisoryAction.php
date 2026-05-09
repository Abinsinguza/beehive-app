<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * AdvisoryAction represents a single checklist item inside a generated Advisory.
 * Multiple actions can belong to one advisory.
 *
 * Table: advisory_actions
 * priority_level: 'low' | 'medium' | 'high'
 * status:         'pending' | 'in_progress' | 'done'
 */
class AdvisoryAction extends Model
{
    protected $table      = 'advisory_actions';
    protected $primaryKey = 'action_id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    // advisory_actions has no updated_at column.
    const UPDATED_AT = null;

    protected $fillable = [
        'action_id',
        'advisory_id',
        'action_description',
        'priority_level',
        'status',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function advisory()
    {
        return $this->belongsTo(Advisory::class, 'advisory_id', 'advisory_id');
    }
}
