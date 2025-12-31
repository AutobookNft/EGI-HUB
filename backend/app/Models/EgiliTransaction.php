<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EgiliTransaction extends Model
{
    protected $connection = 'pgsql';
    protected $guarded = [];
}
