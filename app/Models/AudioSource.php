<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AudioSource extends Model
{
    use HasUuids;

    protected $primaryKey = 'audio_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'hive_id',
        'source_url',
        'file_format',
        'duration_seconds',
        'captured_at',
        'ingestion_timestamp',
        'status',
    ];

    protected $casts = [
        'captured_at'         => 'datetime',
        'ingestion_timestamp' => 'datetime',
        'duration_seconds'    => 'float',
    ];

    public function uniqueIds(): array
    {
        return ['audio_id'];
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
    }

    public function inferenceResults()
    {
        return $this->hasMany(Inference::class, 'audio_id', 'audio_id');
    }
}
