<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Paket;

class PaketSeeder extends Seeder
{
    public function run(): void
    {
        $pakets = [
            [
                'nama'      => 'Paket Basic',
                'deskripsi' => 'Cocok untuk penggunaan sehari-hari browsing dan sosmed',
                'kecepatan' => 10,
                'harga'     => 100000,
                'durasi'    => 30,
                'is_aktif'  => true,
            ],
            [
                'nama'      => 'Paket Standard',
                'deskripsi' => 'Ideal untuk streaming dan WFH ringan',
                'kecepatan' => 25,
                'harga'     => 150000,
                'durasi'    => 30,
                'is_aktif'  => true,
            ],
            [
                'nama'      => 'Paket Premium',
                'deskripsi' => 'Kecepatan tinggi untuk gaming dan streaming 4K',
                'kecepatan' => 50,
                'harga'     => 200000,
                'durasi'    => 30,
                'is_aktif'  => true,
            ],
            [
                'nama'      => 'Paket Ultra',
                'deskripsi' => 'Koneksi dedicated untuk kebutuhan bisnis',
                'kecepatan' => 100,
                'harga'     => 250000,
                'durasi'    => 30,
                'is_aktif'  => true,
            ],
        ];

        foreach ($pakets as $paket) {
            Paket::firstOrCreate(['nama' => $paket['nama']], $paket);
        }
    }
}
