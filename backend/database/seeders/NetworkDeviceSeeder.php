<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NetworkDevice;
use App\Models\Order;

class NetworkDeviceSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Reset associations
        Order::query()->update([
            'network_device_id' => null,
        ]);
        NetworkDevice::query()->delete();

        // 2. Core Router NOC
        $coreNoc = NetworkDevice::create([
            'name'       => 'MikroTik CCR2004 - Core NOC Utama',
            'type'       => 'Router',
            'ip_address' => '10.10.0.1',
            'username'   => 'admin',
            'password'   => 'admin123',
            'api_port'   => '8728',
            'is_active'  => true,
            'status'     => 'online',
            'wilayah'    => 'NOC Pusat Purwodadi',
            'keterangan' => 'Core Router NOC Pusat dengan Uplink Fiber Optic 10 Gbps',
        ]);

        // 3. Distribution OLT Sentral
        $oltGrobogan = NetworkDevice::create([
            'name'             => 'OLT ZTE C320 - Sentral Fiber Grobogan',
            'type'             => 'OLT',
            'ip_address'       => '10.10.1.2',
            'username'         => 'admin',
            'password'         => 'admin123',
            'api_port'         => '8728',
            'is_active'        => true,
            'status'           => 'online',
            'parent_device_id' => $coreNoc->id,
            'wilayah'          => 'Kec. Purwodadi',
            'keterangan'       => 'OLT Utama melayani GPON 19 Kecamatan di Kabupaten Grobogan',
        ]);

        // 4. Daftar 19 Kecamatan resmi di Kabupaten Grobogan
        $kecamatanList = [
            'Purwodadi', 'Grobogan', 'Toroh', 'Godong', 'Gubug',
            'Wirosari', 'Kradenan', 'Pulokulon', 'Penawangan', 'Brati',
            'Gabus', 'Geyer', 'Karangrayung', 'Kedungjati', 'Klambu',
            'Ngaringan', 'Tanggungharjo', 'Tawangharjo', 'Wonosalam',
        ];

        $odpMap = [];

        foreach ($kecamatanList as $idx => $kec) {
            $code = strtoupper(substr($kec, 0, 3));
            $subnet = 10 + $idx;
            $odp = NetworkDevice::create([
                'name'             => "ODP-{$code}-01 (Kec. {$kec})",
                'type'             => 'ODP',
                'ip_address'       => "10.10.{$subnet}.1",
                'is_active'        => true,
                'status'           => 'online',
                'parent_device_id' => $oltGrobogan->id,
                'wilayah'          => "Kec. {$kec}",
                'keterangan'       => "ODP Fiber Distribution Box Wilayah Kecamatan {$kec}, Kab. Grobogan",
            ]);
            $odpMap[strtolower($kec)] = $odp;
        }

        // 5. Hubungkan data pelanggan aktif ke ODP Kecamatan yang sesuai
        $orders = Order::with('user')->where('status', 'aktif')->get();

        foreach ($orders as $index => $order) {
            $customerName = $order->user->name ?? 'Pelanggan';
            $alamatLower  = strtolower($order->alamat ?? '');

            // Cari match kecamatan dari alamat
            $matchedOdp = null;
            foreach ($odpMap as $kecKey => $odpObj) {
                if (str_contains($alamatLower, $kecKey)) {
                    $matchedOdp = $odpObj;
                    break;
                }
            }

            // Fallback ke ODP Purwodadi jika tidak match
            if (!$matchedOdp) {
                $matchedOdp = $odpMap['purwodadi'] ?? reset($odpMap);
            }

            $ipThirdByte = explode('.', $matchedOdp->ip_address)[2] ?? '20';

            $order->update([
                'network_device_id' => $matchedOdp->id,
                'ip_address'        => "10.10.{$ipThirdByte}." . (10 + $index),
                'mikrotik_username' => 'pppoe_' . strtolower(str_replace(' ', '', $customerName)) . '_' . ($order->user_id ?? rand(10, 99)),
                'mikrotik_password' => 'pass' . rand(1000, 9999),
            ]);
        }
    }
}
