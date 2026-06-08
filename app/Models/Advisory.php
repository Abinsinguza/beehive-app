<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Advisory extends Model
{
    use HasUuids;

    protected $primaryKey = 'advisory_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'inference_id',
        'hive_id',
        'template_id',
        'advisory_type',
        'condition_label',
        'advisory_text',
        'severity',
    ];

    protected $casts = [
        'template_id' => 'integer',
    ];

    public function uniqueIds(): array
    {
        return ['advisory_id'];
    }

    public function inferenceResult()
    {
        return $this->belongsTo(Inference::class, 'inference_id', 'inference_id');
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
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
