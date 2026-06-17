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
        'template_id',
        'action_title',
        'action_description',
        'priority_level',
        'confidence_threshold_min',
        'confidence_threshold_max',
        'action_order',
        'is_active',
    ];

    protected $casts = [
        'template_id'              => 'integer',
        'confidence_threshold_min' => 'float',
        'confidence_threshold_max' => 'float',
        'action_order'             => 'integer',
        'is_active'                => 'boolean',
    ];

    public function uniqueIds(): array
    {
        return ['advisory_id'];
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
