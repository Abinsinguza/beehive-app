<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AdvisoryAction extends Model
{
    use HasUuids;

    protected $table = 'advisory_actions';
    protected $primaryKey = 'action_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'advisory_id',
        'action_description',
        'priority_level',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function uniqueIds(): array
    {
        return ['action_id'];
    }

    public function advisory()
    {
        return $this->belongsTo(Advisory::class, 'advisory_id', 'advisory_id');
    }
}
