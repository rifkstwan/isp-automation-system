<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Billing;
use App\Models\Notification;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class GenerateMonthlyBillings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'billing:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly billings for active users 7 days before expiration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Mengecek pelanggan yang masa aktifnya segera habis...');

        // Cari Order yang aktif dan tanggal selesainya <= 7 hari ke depan
        $targetDate = now()->addDays(7)->toDateString();
        $orders = Order::with(['user', 'paket'])
            ->where('status', 'aktif')
            ->whereNotNull('tanggal_selesai')
            ->whereDate('tanggal_selesai', '<=', $targetDate)
            ->get();

        $count = 0;

        foreach ($orders as $order) {
            // Cek apakah sudah ada tagihan yang dibuat dalam 20 hari terakhir untuk order ini
            $recentBillingExists = Billing::where('order_id', $order->id)
                ->where('created_at', '>=', now()->subDays(20))
                ->exists();

            if (!$recentBillingExists) {
                // Buat tagihan baru
                $billing = Billing::create([
                    'user_id' => $order->user_id,
                    'order_id' => $order->id,
                    'jumlah_tagihan' => $order->paket->harga ?? $order->total_harga,
                    'jatuh_tempo' => clone $order->tanggal_selesai, // Jatuh tempo pas di tanggal habis aktif
                    'status' => 'unpaid',
                    'tanggal_bayar' => null,
                ]);

                // Buat notifikasi di aplikasi
                Notification::create([
                    'user_id' => $billing->user_id,
                    'title' => 'Tagihan Baru',
                    'message' => 'Tagihan internet Anda untuk bulan ini sebesar Rp' . number_format($billing->jumlah_tagihan, 0, ',', '.') . ' telah diterbitkan. Harap bayar sebelum ' . Carbon::parse($billing->jatuh_tempo)->format('d M Y') . '.',
                    'type' => 'billing',
                ]);

                // Kirim notifikasi WA
                try {
                    WhatsAppService::sendBillingNotification($order->user, $billing);
                } catch (\Exception $e) {
                    \Log::error('Gagal kirim WA auto-billing: ' . $e->getMessage());
                }

                $count++;
            }
        }

        $this->info("Berhasil membuat $count tagihan baru otomatis.");
    }
}
