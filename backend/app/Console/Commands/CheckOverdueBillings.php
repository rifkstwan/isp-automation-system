<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Billing;
use App\Models\Notification;
use App\Services\WhatsAppService;

class CheckOverdueBillings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'billing:check-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue billings and suspend active orders';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Mengecek tagihan yang sudah lewat jatuh tempo...');

        // Cari tagihan unpaid yang jatuh temponya sudah lewat batas waktu (kemarin atau sebelumnya)
        $billings = Billing::with(['order.user', 'user'])
            ->where('status', 'unpaid')
            ->whereDate('jatuh_tempo', '<', now()->toDateString())
            ->get();

        $count = 0;

        foreach ($billings as $billing) {
            $billing->update(['status' => 'overdue']);

            if ($billing->order && $billing->order->status === 'aktif') {
                $order = $billing->order;
                $order->update(['status' => 'suspend']);

                // Matikan internet via Mikrotik
                if ($order->mikrotik_username) {
                    $mikrotikService = new \App\Services\MikrotikService();
                    $mikrotikService->disablePppoeSecret($order->mikrotik_username);
                }

                // Kirim notifikasi isolir via in-app
                Notification::create([
                    'user_id' => $billing->user_id,
                    'title' => 'Layanan Diisolir',
                    'message' => 'Layanan internet Anda sementara dinonaktifkan karena tagihan telah melewati jatuh tempo. Segera lunasi tagihan agar koneksi aktif kembali.',
                    'type' => 'billing_overdue',
                ]);

                // Kirim WA isolir ke pelanggan
                try {
                    WhatsAppService::sendSuspendNotification($order->user, $billing);
                } catch (\Exception $e) {
                    \Log::error('Gagal kirim WA isolir: ' . $e->getMessage());
                }

                $count++;
            }
        }

        $this->info("Berhasil mengisolir $count layanan yang menunggak.");
    }
}
