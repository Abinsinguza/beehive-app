<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnvironmentalData extends Model
{
    use HasUuids;

    protected $table = 'environmental_data';
    protected $primaryKey = 'env_record_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'hive_id',
        'temperature',
        'humidity',
        'population_k_bees',
        'nectar_flow_kg_per_day',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at'            => 'datetime',
        'temperature'            => 'float',
        'humidity'               => 'float',
        'population_k_bees'      => 'float',
        'nectar_flow_kg_per_day' => 'float',
    ];

    public function uniqueIds(): array
    {
        return ['env_record_id'];
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
    }
}
