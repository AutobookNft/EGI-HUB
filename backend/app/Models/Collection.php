<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    protected $connection = 'pgsql';
    protected $guarded = [];

    public function users() {
        return $this->belongsToMany(User::class, 'collection_users')
                    ->withPivot('role', 'is_owner', 'status', 'metadata')
                    ->withTimestamps();
    }
}
