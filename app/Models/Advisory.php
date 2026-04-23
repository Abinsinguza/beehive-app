<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advisory extends Model
{
    /** @use HasFactory<\Database\Factories\AdvisoryFactory> */
    protected $fillable = [
        'prediction_code',
        'condition_label',
        'advisory_text',
        'severity',
    ];
}
