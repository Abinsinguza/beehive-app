<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FarmerDataSource extends Model
{
    use HasUuids;

    protected $table = 'farmer_data_sources';
    protected $primaryKey = 'source_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'hive_id',
        'connection_config',
        'last_scanned_at',
        'is_active',
    ];

    // source_type is always 'http_api' — not user-settable
    protected $attributes = [
        'source_type' => 'http_api',
    ];

    protected $casts = [
        'connection_config' => 'array',
        'last_scanned_at'   => 'datetime',
        'created_at'        => 'datetime',
        'is_active'         => 'boolean',
    ];

    public function uniqueIds(): array
    {
        return ['source_id'];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function hive()
    {
        return $this->belongsTo(Beehive::class, 'hive_id', 'hive_id');
    }
}
