<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Billing;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct()
    {
        $serverKey = Setting::where('key', 'midtrans_server_key')->first()->value ?? env('MIDTRANS_SERVER_KEY');
        $isProductionStr = Setting::where('key', 'midtrans_is_production')->first()->value ?? env('MIDTRANS_IS_PRODUCTION', false);
        $isProduction = filter_var($isProductionStr, FILTER_VALIDATE_BOOLEAN);

        // Set konfigurasi midtrans
        \Midtrans\Config::$serverKey = $serverKey;
        \Midtrans\Config::$isProduction = $isProduction;
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;
    }

    public function indexAdmin()
    {
        // Ambil data Pemasangan (Orders) yang sudah lunas (Aktif/Selesai/Suspend)
        // Karena awalnya statusnya pending, kalau sudah aktif berarti sudah dibayar/diterima
        $orders = Order::with(['user', 'paket'])
            ->whereIn('status', ['aktif', 'selesai', 'suspend'])
            ->get()
            ->map(function ($order) {
                return [
                    'id' => 'ORD-' . $order->id,
                    'reference_id' => $order->id,
                    'type' => 'Pemasangan Baru',
                    'description' => 'Instalasi ' . ($order->paket->nama ?? 'Paket Terhapus'),
                    'user_name' => $order->user->name ?? 'Unknown',
                    'user_email' => $order->user->email ?? 'Unknown',
                    'amount' => $order->total_harga,
                    'paid_at' => $order->tanggal_mulai ? $order->tanggal_mulai . ' 00:00:00' : $order->created_at,
                    'status' => 'Berhasil'
                ];
            });

        // Ambil data Tagihan (Billings) yang sudah lunas (Paid)
        $billings = Billing::with(['user', 'order.paket'])
            ->where('status', 'paid')
            ->get()
            ->map(function ($billing) {
                return [
                    'id' => 'BIL-' . $billing->id,
                    'reference_id' => $billing->id,
                    'type' => 'Tagihan Bulanan',
                    'description' => 'Tagihan ' . ($billing->order->paket->nama ?? 'Paket Terhapus'),
                    'user_name' => $billing->user->name ?? 'Unknown',
                    'user_email' => $billing->user->email ?? 'Unknown',
                    'amount' => $billing->jumlah_tagihan,
                    'paid_at' => $billing->tanggal_bayar ?? $billing->updated_at,
                    'status' => 'Berhasil'
                ];
            });

        // Gabungkan dan urutkan berdasarkan paid_at secara descending (terbaru di atas)
        $payments = $orders->concat($billings)->sortByDesc('paid_at')->values();

        return response()->json($payments);
    }

    public function getSnapToken($id)
    {
        $order = Order::with(['paket', 'user'])->findOrFail($id);

        if (auth()->user()->id !== $order->user_id && !auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Hanya order berstatus pending yang bisa dibayar.'], 400);
        }

        $params = [
            'transaction_details' => [
                'order_id' => 'INV-ORD-' . $order->id . '-' . time(),
                'gross_amount' => $order->total_harga,
            ],
            'customer_details' => [
                'first_name' => $order->user->name,
                'email' => $order->user->email,
            ],
            'item_details' => [
                [
                    'id' => $order->paket_id,
                    'price' => $order->total_harga,
                    'quantity' => 1,
                    'name' => 'Instalasi: ' . $order->paket->nama,
                ]
            ]
        ];

        try {
            $snapToken = \Midtrans\Snap::getSnapToken($params);
            return response()->json(['snap_token' => $snapToken]);
        } catch (\Exception $e) {
            Log::error('Midtrans Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mendapatkan token pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    public function getBillingSnapToken($id)
    {
        $billing = Billing::with(['order.paket', 'user'])->findOrFail($id);

        if (auth()->user()->id !== $billing->user_id && !auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($billing->status === 'paid') {
            return response()->json(['message' => 'Tagihan ini sudah lunas.'], 400);
        }

        $params = [
            'transaction_details' => [
                'order_id' => 'INV-BIL-' . $billing->id . '-' . time(),
                'gross_amount' => $billing->jumlah_tagihan,
            ],
            'customer_details' => [
                'first_name' => $billing->user->name,
                'email' => $billing->user->email,
            ],
            'item_details' => [
                [
                    'id' => 'BIL-' . $billing->id,
                    'price' => $billing->jumlah_tagihan,
                    'quantity' => 1,
                    'name' => 'Tagihan WiFi: ' . $billing->order->paket->nama,
                ]
            ]
        ];

        try {
            $snapToken = \Midtrans\Snap::getSnapToken($params);
            return response()->json(['snap_token' => $snapToken]);
        } catch (\Exception $e) {
            Log::error('Midtrans Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mendapatkan token tagihan', 'error' => $e->getMessage()], 500);
        }
    }

    public function webhook(Request $request)
    {
        try {
            $notif = new \Midtrans\Notification();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid notification'], 400);
        }

        $transactionStatus = $notif->transaction_status;
        $orderIdFull = $notif->order_id; // e.g. INV-ORD-1-168923010 or INV-BIL-1-168923010
        $fraudStatus = $notif->fraud_status;

        $parts = explode('-', $orderIdFull);
        // Format: INV - TYPE - ID - TIMESTAMP
        if (count($parts) >= 3 && $parts[0] === 'INV') {
            $type = $parts[1];
            $realId = (int) $parts[2];
        } else {
            return response()->json(['message' => 'Invalid order ID format'], 400);
        }

        $isSuccess = ($transactionStatus == 'capture' && $fraudStatus == 'accept') || $transactionStatus == 'settlement';
        $isFailed = in_array($transactionStatus, ['cancel', 'deny', 'expire']);

        if ($type === 'ORD') {
            $order = Order::with('user')->find($realId);
            if (!$order) return response()->json(['message' => 'Order not found'], 404);

            if ($isSuccess) {
                $order->status = 'aktif';
                $order->tanggal_mulai = now();
                $order->tanggal_selesai = now()->addDays($order->paket->durasi ?? 30);
                
                // Add PPPoE User
                $mikrotikService = new \App\Services\MikrotikService();
                $username = 'user_' . $order->user_id . '_' . rand(100, 999);
                $password = \Illuminate\Support\Str::random(8);
                $comment = 'Order ID: ' . $order->id . ' - ' . ($order->user->name ?? 'Unknown');
                
                if ($mikrotikService->addPppoeSecret($username, $password, 'default', $comment)) {
                    $order->mikrotik_username = $username;
                    $order->mikrotik_password = $password;
                    if ($device = $mikrotikService->getDevice()) {
                        $order->network_device_id = $device->id;
                    }
                }
            } else if ($isFailed) {
                $order->status = 'ditolak';
            } else if ($transactionStatus == 'pending') {
                $order->status = 'pending';
            }
            $order->save();

        } else if ($type === 'BIL') {
            $billing = Billing::with('order')->find($realId);
            if (!$billing) return response()->json(['message' => 'Billing not found'], 404);

            if ($isSuccess) {
                $billing->status = 'paid';
                $billing->tanggal_bayar = now();

                // Perpanjang tanggal_selesai pada order
                if ($billing->order) {
                    $order = $billing->order;
                    $order->status = 'aktif'; // Kembalikan status ke aktif jika sebelumnya suspend
                    // Tambahkan 30 hari dari sekarang atau dari tanggal_selesai sebelumnya (pilih dari sekarang agar full 30 hari setelah bayar)
                    $order->tanggal_selesai = now()->addDays($order->paket->durasi ?? 30);
                    $order->save();
                }

                // Enable PPPoE User if exists
                if ($billing->order && $billing->order->mikrotik_username) {
                    $mikrotikService = new \App\Services\MikrotikService();
                    $mikrotikService->enablePppoeSecret($billing->order->mikrotik_username);
                }
            } else if ($isFailed && $billing->status !== 'paid') {
                // Return to unpaid/overdue depending on due date. Wait, just let it be unpaid
                if (now()->greaterThan($billing->jatuh_tempo)) {
                    $billing->status = 'overdue';
                    
                    // Disable PPPoE User if exists
                    if ($billing->order && $billing->order->mikrotik_username) {
                        $mikrotikService = new \App\Services\MikrotikService();
                        $mikrotikService->disablePppoeSecret($billing->order->mikrotik_username);
                    }
                } else {
                    $billing->status = 'unpaid';
                }
            }
            $billing->save();
        }

        return response()->json(['message' => 'Webhook received successfully']);
    }

    public function demoOrderSuccess($id)
    {
        $order = Order::with('user')->findOrFail($id);
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed'], 400);
        }

        $order->status = 'aktif';
        $order->tanggal_mulai = now();
        $order->tanggal_selesai = now()->addDays($order->paket->durasi ?? 30);
        
        $mikrotikService = new \App\Services\MikrotikService();
        $username = 'user_' . $order->user_id . '_' . rand(100, 999);
        $password = \Illuminate\Support\Str::random(8);
        $comment = 'Order ID: ' . $order->id . ' - ' . ($order->user->name ?? 'Unknown');
        
        if ($mikrotikService->addPppoeSecret($username, $password, 'default', $comment)) {
            $order->mikrotik_username = $username;
            $order->mikrotik_password = $password;
            if ($device = $mikrotikService->getDevice()) {
                $order->network_device_id = $device->id;
            }
        }
        $order->save();
        return response()->json(['message' => 'Demo order payment success']);
    }

    public function demoBillingSuccess($id)
    {
        $billing = Billing::with('order')->findOrFail($id);
        if ($billing->status === 'paid') {
            return response()->json(['message' => 'Billing already paid'], 400);
        }

        $billing->status = 'paid';
        $billing->tanggal_bayar = now();

        if ($billing->order) {
            $order = $billing->order;
            $order->status = 'aktif';
            $order->tanggal_selesai = now()->addDays($order->paket->durasi ?? 30);
            $order->save();
        }

        if ($billing->order && $billing->order->mikrotik_username) {
            $mikrotikService = new \App\Services\MikrotikService();
            $mikrotikService->enablePppoeSecret($billing->order->mikrotik_username);
        }
        $billing->save();
        return response()->json(['message' => 'Demo billing payment success']);
    }
}
