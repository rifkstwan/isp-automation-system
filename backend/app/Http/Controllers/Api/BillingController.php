<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Billing;
use App\Models\Order;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Services\WhatsAppService;

class BillingController extends Controller
{
    public function indexAdmin()
    {
        $billings = Billing::with(['user', 'order.paket'])->orderBy('created_at', 'desc')->get();
        return response()->json($billings);
    }

    public function myBillings()
    {
        $billings = Billing::with(['order.paket'])
            ->where('user_id', auth()->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($billings);
    }

    public function storeAdmin(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'jumlah_tagihan' => 'required|integer|min:0',
            'jatuh_tempo' => 'required|date',
            'status' => 'required|in:unpaid,paid,overdue'
        ]);

        $order = Order::findOrFail($request->order_id);

        $billing = Billing::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'jumlah_tagihan' => $request->jumlah_tagihan,
            'jatuh_tempo' => $request->jatuh_tempo,
            'status' => $request->status,
            'tanggal_bayar' => $request->status === 'paid' ? now() : null,
        ]);

        $billing->load('order.user');
        
        Notification::create([
            'user_id' => $billing->user_id,
            'title' => 'Tagihan Baru',
            'message' => 'Tagihan internet Anda untuk bulan ini sebesar Rp' . number_format($billing->jumlah_tagihan, 0, ',', '.') . ' telah diterbitkan.',
            'type' => 'billing',
        ]);

        try {
            WhatsAppService::sendBillingNotification($billing->order->user, $billing);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA billing created: ' . $e->getMessage());
        }

        return response()->json($billing, 201);
    }

    public function markAsPaid($id)
    {
        $billing = Billing::findOrFail($id);
        $billing->update([
            'status' => 'paid',
            'tanggal_bayar' => now(),
        ]);

        $billing->load('order.user', 'order.paket');

        if ($billing->order) {
            $order = $billing->order;
            $order->status = 'aktif';
            $order->tanggal_selesai = now()->addDays($order->paket->durasi ?? 30);
            $order->save();

            if ($order->mikrotik_username) {
                $mikrotikService = new \App\Services\MikrotikService();
                $mikrotikService->enablePppoeSecret($order->mikrotik_username);
            }
        }

        Notification::create([
            'user_id' => $billing->user_id,
            'title' => 'Pembayaran Berhasil',
            'message' => 'Pembayaran untuk tagihan sebesar Rp' . number_format($billing->jumlah_tagihan, 0, ',', '.') . ' telah berhasil diproses.',
            'type' => 'billing',
        ]);

        try {
            WhatsAppService::sendBillingNotification($billing->order->user, $billing);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA markAsPaid: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Tagihan berhasil ditandai lunas', 'billing' => $billing]);
    }

    /**
     * [Admin] Manual trigger: Generate tagihan bulanan otomatis.
     * Menjalankan command billing:generate tanpa menunggu cron scheduler.
     * Berguna untuk demo dan pengujian.
     */
    public function triggerGenerate()
    {
        \Illuminate\Support\Facades\Artisan::call('billing:generate');
        $output = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'message' => 'Billing generate berhasil dijalankan',
            'output'  => trim($output),
        ]);
    }

    /**
     * [Admin] Manual trigger: Cek tagihan overdue & isolir pelanggan menunggak.
     * Menjalankan command billing:check-overdue tanpa menunggu cron scheduler.
     * Berguna untuk demo dan pengujian.
     */
    public function triggerCheckOverdue()
    {
        \Illuminate\Support\Facades\Artisan::call('billing:check-overdue');
        $output = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'message' => 'Billing check-overdue berhasil dijalankan',
            'output'  => trim($output),
        ]);
    }
}
