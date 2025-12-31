<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EgiTrait extends Model
{
    protected $connection = 'pgsql';
    protected $guarded = [];
}
