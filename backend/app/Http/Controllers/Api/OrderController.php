<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderActivatedMail;
use App\Mail\OrderCreatedMail;
use App\Mail\OrderRejectedMail;
use App\Models\Order;
use App\Models\Paket;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Services\WhatsAppService;

class OrderController extends Controller
{
    // Customer: lihat order milik sendiri
    public function myOrders(Request $request)
    {
        $orders = Order::with(['paket', 'user', 'upgradeRequests' => function ($query) {
            $query->where('status', 'pending');
        }])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function myTraffic(Request $request)
    {
        $activeOrder = Order::with('paket')
            ->where('user_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$activeOrder) {
            return response()->json([
                'download' => 0,
                'upload' => 0,
                'total' => 0
            ]);
        }
        
        $speed = $activeOrder->paket->kecepatan;
        // Mock traffic based on package speed
        $download = $speed * rand(12, 18); 
        $upload = $speed * rand(3, 7);

        return response()->json([
            'download' => $download,
            'upload' => $upload,
            'total' => $download + $upload
        ]);
    }

    // Customer: buat order baru
    public function store(Request $request)
    {
        $request->validate([
            'paket_id' => 'required|exists:pakets,id',
            'alamat'   => 'required|string|max:500',
            'catatan'  => 'nullable|string',
        ]);

        $paket = Paket::findOrFail($request->paket_id);

        $order = Order::create([
            'user_id'     => $request->user()->id,
            'paket_id'    => $request->paket_id,
            'alamat'      => $request->alamat,
            'catatan'     => $request->catatan,
            'total_harga' => $paket->harga,
            'status'      => 'pending',
        ]);

        $order->load(['user', 'paket']);

        // Kirim email notifikasi ke customer
        try {
            Mail::to($order->user->email)->send(new OrderCreatedMail($order));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email order created: ' . $e->getMessage());
        }

        // Kirim WA notifikasi ke customer
        try {
            WhatsAppService::sendOrderNotification($order->user, $order, $paket);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA order created: ' . $e->getMessage());
        }

        Notification::notifyAdmins(
            'Pemesanan Baru',
            'Pelanggan ' . $order->user->name . ' telah memesan paket ' . $paket->nama . '.',
            'order'
        );

        return response()->json([
            'message' => 'Order berhasil dibuat',
            'order'   => $order,
        ], 201);
    }

    // Customer: lihat detail order
    public function show(Request $request, $id)
    {
        $order = Order::with('paket')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    // Admin: lihat semua order
    public function index()
    {
        $orders = Order::with(['user', 'paket'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    // Admin: update status order
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status'          => 'required|in:pending,dibayar,aktif,ditolak,selesai,suspend',
            'tanggal_mulai'   => 'nullable|date',
            'tanggal_selesai' => 'nullable|date',
        ]);

        $order = Order::findOrFail($id);
        $order->update($request->only('status', 'tanggal_mulai', 'tanggal_selesai'));
        $order->load(['user', 'paket']);

        Notification::create([
            'user_id' => $order->user_id,
            'title' => 'Status Layanan Diperbarui',
            'message' => 'Status layanan internet Anda telah diubah menjadi ' . strtoupper($order->status),
            'type' => 'order_update',
        ]);

        // Kirim email sesuai status
        try {
            if ($order->status === 'aktif') {
                Mail::to($order->user->email)->send(new OrderActivatedMail($order));
            } elseif ($order->status === 'ditolak') {
                Mail::to($order->user->email)->send(new OrderRejectedMail($order));
            }
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email status update: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Status order diperbarui',
            'order'   => $order,
        ]);
    }

    // Admin: update spesifikasi teknis
    public function updateSpecs(Request $request, $id)
    {
        $request->validate([
            'ip_address'      => 'nullable|string|max:100',
            'tipe_perangkat'  => 'nullable|string|max:100',
        ]);

        $order = Order::findOrFail($id);
        $order->update($request->only('ip_address', 'tipe_perangkat'));
        $order->load(['user', 'paket']);

        return response()->json([
            'message' => 'Spesifikasi teknis diperbarui',
            'order'   => $order,
        ]);
    }
}
