<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Billing;
use App\Models\Notification;
use App\Services\WhatsAppService;

use App\Mail\OrderRejectedMail;
use Illuminate\Support\Facades\Mail;

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
    protected $description = 'Check for overdue billings, suspend active orders, and terminate 30+ days overdue orders';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Mengecek tagihan yang sudah lewat jatuh tempo...');

        // 1. ISOLIR SEMENTARA: Cari tagihan unpaid yang jatuh temponya sudah lewat batas waktu (kemarin/sebelumnya)
        $billings = Billing::with(['order.user', 'user'])
            ->where('status', 'unpaid')
            ->whereDate('jatuh_tempo', '<', now()->toDateString())
            ->get();

        $suspendCount = 0;

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
                    'title'   => 'Layanan Diisolir',
                    'message' => 'Layanan internet Anda sementara dinonaktifkan karena tagihan telah melewati jatuh tempo. Segera lunasi tagihan agar koneksi aktif kembali.',
                    'type'    => 'billing_overdue',
                ]);

                // Kirim WA isolir ke pelanggan
                try {
                    WhatsAppService::sendSuspendNotification($order->user, $billing);
                } catch (\Exception $e) {
                    \Log::error('Gagal kirim WA isolir: ' . $e->getMessage());
                }

                $suspendCount++;
            }
        }

        $this->info("Berhasil mengisolir $suspendCount layanan yang menunggak.");

        // 2. PEMUTUSAN PERMANEN (DITOLAK): Cari tagihan overdue yang sudah menunggak >= 30 hari
        $cutoffDate = now()->subDays(30)->toDateString();
        $longOverdueBillings = Billing::with(['order.user', 'user'])
            ->where('status', 'overdue')
            ->whereDate('jatuh_tempo', '<=', $cutoffDate)
            ->get();

        $terminateCount = 0;

        foreach ($longOverdueBillings as $billing) {
            if ($billing->order && in_array($billing->order->status, ['suspend', 'aktif'])) {
                $order = $billing->order;
                $order->update(['status' => 'ditolak']);

                // Pastikan koneksi MikroTik mati
                if ($order->mikrotik_username) {
                    $mikrotikService = new \App\Services\MikrotikService();
                    $mikrotikService->disablePppoeSecret($order->mikrotik_username);
                }

                // Kirim notifikasi in-app
                Notification::create([
                    'user_id' => $billing->user_id,
                    'title'   => 'Layanan Diputus Permanen',
                    'message' => 'Layanan internet Anda telah diputus secara permanen karena menunggak tagihan lebih dari 30 hari. Data Anda dikeluarkan dari peta topologi aktif.',
                    'type'    => 'order_rejected',
                ]);

                // Kirim Email pemberitahuan pemutusan permanen
                if ($order->user && $order->user->email) {
                    try {
                        Mail::to($order->user->email)->send(new OrderRejectedMail($order));
                    } catch (\Exception $e) {
                        \Log::error('Gagal kirim email pemutusan permanen: ' . $e->getMessage());
                    }
                }

                // Kirim Notifikasi WhatsApp pemutusan permanen
                if ($order->user) {
                    try {
                        WhatsAppService::sendTerminationNotification($order->user, $billing);
                    } catch (\Exception $e) {
                        \Log::error('Gagal kirim WA pemutusan permanen: ' . $e->getMessage());
                    }
                }

                $terminateCount++;
            }
        }

        $this->info("Berhasil memutus permanen $terminateCount layanan yang menunggak > 30 hari.");
    }
}
