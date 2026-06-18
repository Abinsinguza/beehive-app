<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AdvisoryAction extends Model
{
    use HasUuids;

    protected $table = 'advisory_actions';
    protected $primaryKey = 'action_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'inference_id',
        'hive_id',
        'advisory_id',
        'template_id',
        'confidence_score',
        'action_title',
        'action_description',
        'priority_level',
        'status',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'confidence_score' => 'float',
        'completed_at'     => 'datetime',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
    ];

    public function uniqueIds(): array
    {
        return ['action_id'];
    }

    public function advisory()
    {
        return $this->belongsTo(Advisory::class, 'advisory_id', 'advisory_id');
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
    }

    public function inference()
    {
        return $this->belongsTo(Inference::class, 'inference_id', 'inference_id');
    }

    public function template()
    {
        return $this->belongsTo(AdvisoryTemplate::class, 'template_id', 'template_id');
    }
}
