<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Beehive extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'hives';
    protected $primaryKey = 'hive_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'owner_id',
        'hive_name',
        'hive_location',
        'hive_type',
        'installation_date',
        'current_state',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'is_deleted'       => 'boolean',
        'deleted_at'       => 'datetime',
        'installation_date'=> 'date',
    ];

    protected $appends = ['id'];

    protected static function boot(): void
    {
        parent::boot();

        static::deleting(function (Beehive $hive) {
            $hive->is_deleted = true;
        });

        static::restored(function (Beehive $hive) {
            $hive->forceFill(['is_deleted' => false])->saveQuietly();
        });
    }

    public function uniqueIds(): array
    {
        return ['hive_id'];
    }

    /**
     * Expose hive_id as 'id' so existing frontend references to beehive.id keep working.
     */
    public function getIdAttribute(): string
    {
        return $this->hive_id ?? '';
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id', 'user_id');
    }

    public function inferenceResults()
    {
        return $this->hasMany(Inference::class, 'hive_id', 'hive_id');
    }

    public function audioSources()
    {
        return $this->hasMany(AudioSource::class, 'hive_id', 'hive_id');
    }

    public function environmentalData()
    {
        return $this->hasMany(EnvironmentalData::class, 'hive_id', 'hive_id');
    }
}
