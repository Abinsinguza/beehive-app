<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdvisoryTemplate extends Model
{
    protected $table = 'advisory_templates';
    protected $primaryKey = 'template_id';

    protected $fillable = [
        'prediction_code',
        'hive_state',
        'advisory_type',
        'severity',
        'min_confidence_threshold',
        'description',
    ];

    protected $casts = [
        'prediction_code'          => 'float',
        'min_confidence_threshold' => 'float',
    ];

    public function advisories()
    {
        return $this->hasMany(Advisory::class, 'template_id', 'template_id');
    }
}
