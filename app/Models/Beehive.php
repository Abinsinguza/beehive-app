<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Beehive extends Model
{
     public $incrementing = false;
    protected $keyType = 'string';

     protected $fillable = [
        'id',
        'owner_id',
        'hive_location',
        'hive_type',
        'installation_date',
        'current_state',
        'latitude',
        'longitude',
    ];
    //  * Relationship: Beehive belongs to Beekeeper

    public function owner()
    {
        return $this->belongsTo(Beekeeper::class, 'owner_id');
    }
}
