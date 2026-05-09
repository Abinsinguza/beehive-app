<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Beekeeper extends Model
{
     public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'address',
        'password',
        'status',
    ];

    public function beehives()
    {
        return $this->hasMany(Beehive::class, 'owner_id');
    }
}