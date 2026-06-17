<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Alerts extends Model
{
    use HasUuids;

    protected $primaryKey = 'alert_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'hive_id',
        'inference_id',
        'severity_level',
        'recommended_action',
        'action_status',
        'alert_timestamp',
    ];

    protected $casts = [
        'alert_timestamp' => 'datetime',
        'viewed_at'       => 'datetime',
    ];

    public function uniqueIds(): array
    {
        return ['alert_id'];
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
    }

    public function inference()
    {
        return $this->belongsTo(Inference::class, 'inference_id', 'inference_id');
    }
}
