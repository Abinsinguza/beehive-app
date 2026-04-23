<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inference extends Model
{
    use HasFactory;

    protected $fillable = [
        'hive_id',
        'prediction',
        'confidence_score',
        'inference_latency',
        'analyzed_at',
    ];

    protected $casts = [
        'analyzed_at'       => 'datetime',
        'confidence_score'  => 'float',
        'inference_latency' => 'float',
    ];

    public function beehive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id');
    }
}
