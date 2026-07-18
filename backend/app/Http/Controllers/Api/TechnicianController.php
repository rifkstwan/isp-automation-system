<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\Order;
use Illuminate\Http\Request;

class TechnicianController extends Controller
{
    public function dashboard(Request $request)
    {
        $technicianName = $request->user()->name;

        // Ambil jadwal sungguhan untuk teknisi yang sedang login
        $realSchedules = \App\Models\TechnicianSchedule::with(['ticket', 'ticket.user', 'order', 'order.user', 'order.paket'])
            ->where('nama_teknisi', $technicianName)
            ->whereIn('status', ['menunggu', 'berangkat', 'pengerjaan'])
            ->orderBy('tanggal_kunjungan', 'asc')
            ->get();

        $activeTicketsCount = 0;
        $newInstallationsCount = 0;
        $schedules = [];

        foreach ($realSchedules as $schedule) {
            $isOrder = !is_null($schedule->order_id);
            if ($isOrder) {
                $newInstallationsCount++;
                $type = 'instalasi';
                $title = 'Instalasi Baru (' . ($schedule->order->paket->nama ?? 'Paket') . ')';
                $subtitle = $schedule->order->user->address ?? $schedule->order->alamat ?? 'Alamat tidak tersedia';
                $color = 'blue';
                $id = 'ord-' . $schedule->order_id;
                $alamat = $schedule->order->user->address ?? $schedule->order->alamat ?? 'Alamat tidak tersedia';
                $catatan = $schedule->order->catatan ?? '';
            } else {
                $activeTicketsCount++;
                $type = 'gangguan';
                $title = 'Perbaikan: ' . ($schedule->ticket->judul ?? 'Gangguan');
                $subtitle = ($schedule->ticket->user->name ?? 'Pelanggan') . ' (TKT-' . $schedule->ticket_id . ')';
                $color = 'amber';
                $id = 'tkt-' . $schedule->ticket_id;
                
                $alamat = $schedule->ticket->user->address ?? null;
                if (empty($alamat) && $schedule->ticket) {
                    $latestOrder = \App\Models\Order::where('user_id', $schedule->ticket->user_id)
                        ->orderBy('created_at', 'desc')
                        ->first();
                    if ($latestOrder) {
                        $alamat = ($latestOrder->catatan ? $latestOrder->catatan . ', ' : '') . $latestOrder->alamat;
                    }
                }
                if (empty($alamat)) {
                    $alamat = 'Alamat tidak tersedia';
                }
                
                $catatan = $schedule->ticket->deskripsi ?? '';
            }

            $phone = $isOrder ? ($schedule->order->user->phone ?? '') : ($schedule->ticket->user->phone ?? '');

            $schedules[] = [
                'id' => $id,
                'schedule_id' => $schedule->id,
                'type' => $type,
                'time' => \Carbon\Carbon::parse($schedule->tanggal_kunjungan)->format('H:i') . ' - ' . ucfirst($schedule->status),
                'title' => $title,
                'subtitle' => $subtitle,
                'alamat' => $alamat,
                'catatan' => $catatan,
                'phone' => $phone,
                'color' => $color,
            ];
        }

        return response()->json([
            'tugasHariIni' => $activeTicketsCount + $newInstallationsCount,
            'gangguanAktif' => $activeTicketsCount,
            'instalasiBaru' => $newInstallationsCount,
            'surveyLokasi' => 0, 
            'schedules' => $schedules
        ]);
    }

    public function history(Request $request)
    {
        $technicianName = $request->user()->name;

        $completedSchedules = \App\Models\TechnicianSchedule::with(['ticket', 'ticket.user', 'order', 'order.user', 'order.paket'])
            ->where('nama_teknisi', $technicianName)
            ->where('status', 'selesai')
            ->orderBy('updated_at', 'desc')
            ->get();

        $completedTickets = Ticket::with('user')
            ->where('status', 'selesai')
            ->orderBy('updated_at', 'desc')
            ->get();

        $items = [];
        $seenKeys = [];

        foreach ($completedSchedules as $schedule) {
            if ($schedule->order_id && $schedule->order) {
                $key = 'ORD-' . $schedule->order_id;
                if (!isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $items[] = [
                        'id' => $key,
                        'type' => 'Instalasi Baru',
                        'title' => ($schedule->order->paket->nama ?? 'Paket Internet'),
                        'customer' => $schedule->order->user->name ?? 'Pelanggan',
                        'updated_at' => $schedule->updated_at->toIso8601String(),
                        'category' => 'instalasi'
                    ];
                }
            } elseif ($schedule->ticket_id && $schedule->ticket) {
                $key = 'TKT-' . $schedule->ticket_id;
                if (!isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $items[] = [
                        'id' => $key,
                        'type' => 'Perbaikan Gangguan',
                        'title' => $schedule->ticket->judul ?? 'Laporan Gangguan',
                        'customer' => $schedule->ticket->user->name ?? 'Pelanggan',
                        'updated_at' => $schedule->updated_at->toIso8601String(),
                        'category' => 'gangguan'
                    ];
                }
            }
        }

        foreach ($completedTickets as $ticket) {
            $key = 'TKT-' . $ticket->id;
            if (!isset($seenKeys[$key])) {
                $seenKeys[$key] = true;
                $items[] = [
                    'id' => $key,
                    'type' => 'Perbaikan Gangguan',
                    'title' => $ticket->judul,
                    'customer' => $ticket->user->name ?? 'Pelanggan',
                    'updated_at' => $ticket->updated_at->toIso8601String(),
                    'category' => 'gangguan'
                ];
            }
        }

        return response()->json($items);
    }
}
