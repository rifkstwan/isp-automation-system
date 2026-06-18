<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Paket;
use App\Models\UpgradeRequest;
use App\Models\Notification;
use App\Mail\UpgradeRequestedMail;
use App\Mail\UpgradeProcessedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class UpgradeController extends Controller
{
    // Customer: Mengirim permintaan upgrade paket
    public function store(Request $request, $orderId)
    {
        $request->validate([
            'new_paket_id' => 'required|exists:pakets,id',
        ]);

        $order = Order::where('user_id', $request->user()->id)->findOrFail($orderId);

        // Pastikan order sedang aktif
        if ($order->status !== 'aktif') {
            return response()->json(['message' => 'Hanya order aktif yang bisa diupgrade'], 400);
        }

        // Cek jika sudah ada request pending untuk order ini
        $existingRequest = UpgradeRequest::where('order_id', $order->id)
                                         ->where('status', 'pending')
                                         ->first();
        
        if ($existingRequest) {
            return response()->json(['message' => 'Anda sudah memiliki permintaan upgrade yang sedang diproses'], 400);
        }

        $upgradeRequest = UpgradeRequest::create([
            'user_id'      => $request->user()->id,
            'order_id'     => $order->id,
            'old_paket_id' => $order->paket_id,
            'new_paket_id' => $request->new_paket_id,
            'status'       => 'pending',
        ]);

        $upgradeRequest->load('user');
        
        Notification::notifyAdmins(
            'Permintaan Upgrade Baru',
            'Pelanggan ' . $upgradeRequest->user->name . ' mengajukan permintaan upgrade paket.',
            'upgrade_update'
        );

        try {
            Mail::to($upgradeRequest->user->email)->send(new UpgradeRequestedMail($upgradeRequest));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email upgrade requested: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Permintaan upgrade berhasil dikirim',
            'upgrade_request' => $upgradeRequest,
        ], 201);
    }

    // Admin: Melihat semua permintaan upgrade
    public function indexAdmin()
    {
        $requests = UpgradeRequest::with(['user', 'order', 'oldPaket', 'newPaket'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 1 WHEN status = 'approved' THEN 2 WHEN status = 'rejected' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    // Admin: Menyetujui atau menolak permintaan upgrade
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status'        => 'required|in:approved,rejected',
            'admin_catatan' => 'nullable|string',
        ]);

        $upgradeRequest = UpgradeRequest::findOrFail($id);

        if ($upgradeRequest->status !== 'pending') {
            return response()->json(['message' => 'Permintaan ini sudah diproses sebelumnya'], 400);
        }

        $upgradeRequest->update([
            'status'        => $request->status,
            'admin_catatan' => $request->admin_catatan,
        ]);

        if ($request->status === 'approved') {
            $order = $upgradeRequest->order;
            $newPaket = $upgradeRequest->newPaket;
            
            // Ubah paket di orders table dan harganya
            $order->update([
                'paket_id'    => $newPaket->id,
                'total_harga' => $newPaket->harga,
            ]);

            // Integrasi Mikrotik RouterOS API — Update PPPoE Profile
            // Mengubah profile PPPoE pelanggan di router agar bandwidth limit sesuai paket baru
            if ($order->mikrotik_username) {
                try {
                    $mikrotik = new \App\Services\MikrotikService();
                    $mikrotik->updatePppoeProfile($order->mikrotik_username, $newPaket->nama);
                } catch (\Exception $e) {
                    \Log::error('Gagal update PPPoE profile saat upgrade: ' . $e->getMessage());
                }
            }
        }

        $upgradeRequest->load(['user', 'order', 'oldPaket', 'newPaket']);

        $statusIndo = $request->status === 'approved' ? 'DISETUJUI' : 'DITOLAK';
        $message = "Permintaan upgrade paket internet Anda (Order #{$upgradeRequest->order_id}) telah {$statusIndo}.";
        if ($request->status === 'approved' && isset($newPaket)) {
            $message .= " Paket Anda sekarang adalah {$newPaket->nama}.";
        }

        Notification::create([
            'user_id' => $upgradeRequest->user_id,
            'title' => 'Status Permintaan Upgrade',
            'message' => $message,
            'type' => 'upgrade_update',
        ]);

        try {
            Mail::to($upgradeRequest->user->email)->send(new UpgradeProcessedMail($upgradeRequest));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email upgrade processed: ' . $e->getMessage());
        }

        return response()->json([
            'message'         => 'Permintaan upgrade berhasil diproses',
            'upgrade_request' => $upgradeRequest,
        ]);
    }
}
