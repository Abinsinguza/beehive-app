<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    use HasUuids;

    protected $primaryKey = 'log_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    // Supported event_type values: audio_ingestion, inference_complete,
    // advisory_generated, alert_triggered, http_api, beekeeper_registered, system
    protected $fillable = [
        'level',
        'event_type',
        'message',
        'details',
        'hive_id',
        'user_id',
        'audio_id',
    ];

    protected $casts = [
        'details'    => 'array',
        'created_at' => 'datetime',
    ];

    public function uniqueIds(): array
    {
        return ['log_id'];
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function audioSource()
    {
        return $this->belongsTo(AudioSource::class, 'audio_id', 'audio_id');
    }
}
