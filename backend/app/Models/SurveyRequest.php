<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'phone',
        'email',
        'alamat',
        'latitude',
        'longitude',
        'catatan',
        'nama_teknisi',
        'tanggal_survey',
        'status',
    ];
}


