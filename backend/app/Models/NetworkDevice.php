<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NetworkDevice extends Model
{
    protected $fillable = [
        'name',
        'type',
        'ip_address',
        'username',
        'password',
        'api_port',
        'is_active',
        'status',
        'last_seen_at',
        'parent_device_id',
        'wilayah',
        'keterangan',
    ];

    protected $casts = [
        'is_active'    => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Perangkat induk (mis: ODP → Router Core)
     */
    public function parent()
    {
        return $this->belongsTo(NetworkDevice::class, 'parent_device_id');
    }

    /**
     * Perangkat anak (mis: Router Core → ODP-ODP)
     */
    public function children()
    {
        return $this->hasMany(NetworkDevice::class, 'parent_device_id');
    }

    /**
     * Pelanggan (orders) yang terhubung ke perangkat/ODP ini
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
