<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alerts extends Model
{
    use HasFactory;

    protected $fillable = [
        'alert_id',
        'inference_id',
        'advisory_id',
        'alert_type',
        'alert_timestamp',
        'status',
    ];

    protected $casts = [
        'alert_timestamp' => 'datetime',
    ];

    public function inference()
    {
        return $this->belongsTo(Inference::class);
    }

    public function advisory()
    {
        return $this->belongsTo(Advisory::class);
    }
}
