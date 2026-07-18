<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\TicketCreatedMail;
use App\Mail\TicketUpdatedMail;
use App\Services\WhatsAppService;

class TicketController extends Controller
{
    public function myTickets(Request $request)
    {
        $tickets = Ticket::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'required|string',
            'prioritas' => 'in:rendah,sedang,tinggi',
            'foto' => 'nullable|image|max:5120'
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('tickets', 'public');
        }

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'prioritas' => $request->prioritas ?? 'sedang',
            'status' => 'menunggu',
            'foto' => $fotoPath
        ]);

        Notification::notifyAdmins(
            'Tiket Gangguan Baru',
            'Pelanggan ' . $request->user()->name . ' membuat laporan gangguan: ' . $ticket->judul,
            'ticket'
        );

        $ticket->load('user');

        try {
            Mail::to($ticket->user->email)->send(new TicketCreatedMail($ticket));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email ticket created: ' . $e->getMessage());
        }

        return response()->json($ticket, 201);
    }

    public function storeAdmin(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'required|string',
            'prioritas' => 'in:rendah,sedang,tinggi'
        ]);

        $ticket = Ticket::create([
            'user_id' => $request->user_id,
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'prioritas' => $request->prioritas ?? 'tinggi',
            'status' => 'menunggu',
            'foto' => null
        ]);

        return response()->json($ticket, 201);
    }

    public function indexAdmin()
    {
        $tickets = Ticket::with('user')
            ->orderByRaw("CASE 
                WHEN status = 'menunggu' THEN 1
                WHEN status = 'diproses' THEN 2
                WHEN status = 'selesai' THEN 3
                ELSE 4
            END")
            ->orderBy('created_at', 'desc')
            ->get();
            
        foreach ($tickets as $ticket) {
            if ($ticket->user && empty($ticket->user->address)) {
                $latestOrder = \App\Models\Order::where('user_id', $ticket->user_id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if ($latestOrder) {
                    $ticket->user->address = ($latestOrder->catatan ? $latestOrder->catatan . ', ' : '') . $latestOrder->alamat;
                }
            }
        }
            
        return response()->json($tickets);
    }

    public function myTechnicianTickets(Request $request)
    {
        $technicianName = $request->user()->name;

        // Ambil ID tiket yang ditugaskan khusus ke teknisi LAIN
        $assignedOtherTickets = \App\Models\TechnicianSchedule::whereNotNull('ticket_id')
            ->where('nama_teknisi', '!=', $technicianName)
            ->pluck('ticket_id');

        $tickets = Ticket::with('user')
            ->whereNotIn('id', $assignedOtherTickets)
            ->orderByRaw("CASE 
                WHEN status = 'menunggu' THEN 1
                WHEN status = 'diproses' THEN 2
                WHEN status = 'selesai' THEN 3
                ELSE 4
            END")
            ->orderBy('created_at', 'desc')
            ->get();
            
        foreach ($tickets as $ticket) {
            if ($ticket->user && empty($ticket->user->address)) {
                $latestOrder = \App\Models\Order::where('user_id', $ticket->user_id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if ($latestOrder) {
                    $ticket->user->address = ($latestOrder->catatan ? $latestOrder->catatan . ', ' : '') . $latestOrder->alamat;
                }
            }
        }
            
        return response()->json($tickets);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:menunggu,diproses,selesai'
        ]);

        $ticket = Ticket::findOrFail($id);
        $ticket->status = $request->status;
        $ticket->save();

        // Sync with technician schedule
        $schedule = \App\Models\TechnicianSchedule::where('ticket_id', $id)->first();
        if ($schedule) {
            if ($request->status === 'diproses') {
                $schedule->update(['status' => 'pengerjaan']);
            } elseif ($request->status === 'selesai') {
                $schedule->update(['status' => 'selesai']);
            } elseif ($request->status === 'menunggu') {
                $schedule->update(['status' => 'menunggu']);
            }
        }

        $ticket->load('user');

        // AUTO-FIX DEMO: If marked as selesai, automatically change device IP from .99 to .1
        if ($request->status === 'selesai' && $ticket->user) {
            $devices = \App\Models\NetworkDevice::all();
            foreach ($devices as $device) {
                if (str_contains(strtolower($device->name), strtolower($ticket->user->name))) {
                    if (str_ends_with($device->ip_address, '.99')) {
                        $device->ip_address = str_replace('.99', '.1', $device->ip_address);
                        $device->save();
                    }
                }
            }
        }

        Notification::create([
            'user_id' => $ticket->user_id,
            'title' => 'Update Tiket Gangguan',
            'message' => 'Status tiket "' . $ticket->judul . '" Anda telah diubah menjadi ' . strtoupper($ticket->status),
            'type' => 'ticket_update',
        ]);

        try {
            WhatsAppService::sendTicketUpdateNotification($ticket->user, $ticket);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA ticket update: ' . $e->getMessage());
        }

        try {
            Mail::to($ticket->user->email)->send(new TicketUpdatedMail($ticket));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email ticket update: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Status tiket berhasil diubah', 'ticket' => $ticket]);
    }

    public function uploadFoto(Request $request, $id)
    {
        $request->validate([
            'foto' => 'required|image|max:5120',
            'status' => 'required|in:menunggu,diproses,selesai'
        ]);

        $ticket = Ticket::findOrFail($id);

        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('tickets/proof', 'public');
            // If you want to save the proof photo to the same 'foto' column or a new one.
            // For now let's just overwrite 'foto' since it's the technician's proof.
            $ticket->foto = $fotoPath;
        }

        $ticket->status = $request->status;
        $ticket->save();

        // Sync with technician schedule
        $schedule = \App\Models\TechnicianSchedule::where('ticket_id', $id)->first();
        if ($schedule && $request->status === 'selesai') {
            $schedule->update(['status' => 'selesai']);
        }

        $ticket->load('user');

        // AUTO-FIX DEMO: If marked as selesai, automatically change device IP from .99 to .1
        if ($request->status === 'selesai' && $ticket->user) {
            $devices = \App\Models\NetworkDevice::all();
            foreach ($devices as $device) {
                if (str_contains(strtolower($device->name), strtolower($ticket->user->name))) {
                    if (str_ends_with($device->ip_address, '.99')) {
                        $device->ip_address = str_replace('.99', '.1', $device->ip_address);
                        $device->save();
                    }
                }
            }
        }

        try {
            WhatsAppService::sendTicketUpdateNotification($ticket->user, $ticket);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA ticket photo update: ' . $e->getMessage());
        }

        try {
            Mail::to($ticket->user->email)->send(new TicketUpdatedMail($ticket));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim email ticket photo update: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Bukti foto berhasil diunggah', 'ticket' => $ticket]);
    }
}
