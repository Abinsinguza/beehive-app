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
        'condition_label',
        'advisory_text',
        'advisory_type',
        'severity',
    ];
}
