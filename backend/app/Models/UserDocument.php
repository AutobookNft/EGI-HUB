<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDocument extends Model
{
    protected $connection = 'pgsql';
    protected $guarded = [];
}
