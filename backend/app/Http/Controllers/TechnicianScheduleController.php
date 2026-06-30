<?php

namespace App\Http\Controllers;

use App\Models\TechnicianSchedule;
use App\Models\Notification;
use Illuminate\Http\Request;

class TechnicianScheduleController extends Controller
{
    public function mySchedules(Request $request)
    {
        $schedules = TechnicianSchedule::with(['ticket', 'order', 'order.paket'])
            ->where('user_id', $request->user()->id)
            ->orderBy('tanggal_kunjungan', 'desc')
            ->get();
            
        return response()->json($schedules);
    }

    public function myInstallations(Request $request)
    {
        $technicianName = $request->user()->name;
        
        $schedules = TechnicianSchedule::with(['order', 'order.user', 'order.paket'])
            ->where('nama_teknisi', $technicianName)
            ->whereNotNull('order_id')
            ->whereIn('status', ['menunggu', 'berangkat', 'pengerjaan'])
            ->orderBy('tanggal_kunjungan', 'asc')
            ->get();
            
        // Map to match the expected format for TechnicianInstallationsPage
        $installations = $schedules->map(function ($schedule) {
            $order = $schedule->order;
            // Attach the schedule ID so the frontend can update the schedule status!
            $order->schedule_id = $schedule->id; 
            // We set status to aktif so the frontend activeInstallations filter passes
            $order->status = 'aktif';
            return $order;
        });

        return response()->json($installations);
    }

    public function indexAdmin()
    {
        $schedules = TechnicianSchedule::with(['user', 'ticket', 'order', 'order.user', 'order.paket'])
            ->orderBy('tanggal_kunjungan', 'desc')
            ->get();
            
        return response()->json($schedules);
    }

    public function storeAdmin(Request $request)
    {
        $request->validate([
            'ticket_id' => 'nullable|exists:tickets,id',
            'order_id' => 'nullable|exists:orders,id',
            'nama_teknisi' => 'required|string|max:255',
            'tanggal_kunjungan' => 'required|date',
        ]);

        if (!$request->ticket_id && !$request->order_id) {
            return response()->json(['message' => 'Ticket ID atau Order ID harus diisi'], 422);
        }

        $userId = null;
        $title = '';
        $message = '';
        
        if ($request->ticket_id) {
            $ticket = \App\Models\Ticket::findOrFail($request->ticket_id);
            $userId = $ticket->user_id;
            $ticket->update(['status' => 'Diproses']);
            $title = 'Jadwal Kunjungan Teknisi (Perbaikan)';
            $message = 'Teknisi ' . $request->nama_teknisi . ' telah dijadwalkan untuk kunjungan pada tanggal ' . \Carbon\Carbon::parse($request->tanggal_kunjungan)->format('d/m/Y') . ' terkait tiket gangguan Anda.';
        } elseif ($request->order_id) {
            $order = \App\Models\Order::findOrFail($request->order_id);
            $userId = $order->user_id;
            // Order is already active if paid, no status change needed here, just assign tech.
            $title = 'Jadwal Kunjungan Teknisi (Pemasangan)';
            $message = 'Teknisi ' . $request->nama_teknisi . ' telah dijadwalkan untuk kunjungan pada tanggal ' . \Carbon\Carbon::parse($request->tanggal_kunjungan)->format('d/m/Y') . ' untuk melakukan instalasi WiFi baru Anda.';
        }

        $schedule = TechnicianSchedule::create([
            'user_id' => $userId,
            'ticket_id' => $request->ticket_id,
            'order_id' => $request->order_id,
            'nama_teknisi' => $request->nama_teknisi,
            'tanggal_kunjungan' => $request->tanggal_kunjungan,
            'status' => 'menunggu',
        ]);

        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $request->ticket_id ? 'ticket_update' : 'order_update',
        ]);

        Notification::notifyTechnician(
            $request->nama_teknisi,
            'Tugas Kunjungan Baru',
            'Anda dijadwalkan untuk kunjungan pada tanggal ' . \Carbon\Carbon::parse($request->tanggal_kunjungan)->format('d/m/Y') . ' (' . ($request->ticket_id ? 'Tiket #'.$request->ticket_id : 'Order #'.$request->order_id) . ')',
            'ticket_update'
        );

        return response()->json($schedule, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:menunggu,selesai,dibatalkan',
        ]);

        $schedule = TechnicianSchedule::findOrFail($id);
        $schedule->update([
            'status' => $request->status,
        ]);

        // If schedule is finished, maybe update ticket?
        if ($request->status === 'selesai' && $schedule->ticket) {
            $schedule->ticket->update(['status' => 'selesai']);
        }

        // Aktivasi Order jika jadwal ini adalah pemasangan baru
        if ($request->status === 'selesai' && $schedule->order) {
            $order = $schedule->order;
            if (in_array($order->status, ['dibayar', 'pending'])) {
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

                try {
                    $order->load(['user', 'paket']);
                    \Illuminate\Support\Facades\Mail::to($order->user->email)->send(new \App\Mail\OrderActivatedMail($order));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Gagal kirim email aktivasi setelah pemasangan: ' . $e->getMessage());
                }
            }
        }

        // AUTO-FIX DEMO: If marked as selesai, automatically change device IP from .99 to .1
        if ($request->status === 'selesai') {
            $user = \App\Models\User::find($schedule->user_id);
            if ($user) {
                $devices = \App\Models\NetworkDevice::all();
                foreach ($devices as $device) {
                    if (str_contains(strtolower($device->name), strtolower($user->name))) {
                        if (str_ends_with($device->ip_address, '.99')) {
                            $device->ip_address = str_replace('.99', '.1', $device->ip_address);
                            $device->save();
                        }
                    }
                }
            }
        }

        Notification::create([
            'user_id' => $schedule->user_id,
            'title' => 'Status Kunjungan Diperbarui',
            'message' => 'Status kunjungan teknisi untuk tiket/order Anda telah diubah menjadi ' . strtoupper($request->status) . '.',
            'type' => 'ticket_update',
        ]);

        return response()->json($schedule);
    }

    public function destroy($id)
    {
        $schedule = TechnicianSchedule::findOrFail($id);
        $schedule->delete();

        return response()->json(['message' => 'Schedule deleted successfully']);
    }
}
