<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TechnicianSchedule;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary(\Illuminate\Http\Request $request)
    {
        $period = $request->query('period', '6m');

        // Total pendapatan keseluruhan
        $totalPendapatan = Order::whereIn('status', ['dibayar', 'aktif', 'selesai'])
            ->sum('total_harga');

        // Pendapatan bulan ini
        $pendapatanBulanIni = Order::whereIn('status', ['dibayar', 'aktif', 'selesai'])
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_harga');

        // Total pelanggan aktif
        $pelangganAktif = Order::where('status', 'aktif')->count();

        // Total semua order
        $totalOrder = Order::count();

        // Order pending
        $orderPending = Order::where('status', 'pending')->count();

        // Paket terlaris
        $paketTerlaris = Order::with('paket')
            ->select('paket_id', DB::raw('count(*) as total'))
            ->whereIn('status', ['dibayar', 'aktif', 'selesai'])
            ->groupBy('paket_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn($o) => [
                'nama'  => $o->paket->nama,
                'total' => $o->total,
            ]);

        // Pendapatan per waktu dinamis (7 hari, 1 bulan, 6 bulan, 1 tahun)
        $queryData = Order::whereIn('status', ['dibayar', 'aktif', 'selesai']);

        if ($period === '7d') {
            $queryData->where('created_at', '>=', now()->subDays(7))
                ->select(
                    DB::raw('EXTRACT(YEAR FROM created_at) as tahun'),
                    DB::raw('EXTRACT(MONTH FROM created_at) as bulan'),
                    DB::raw('EXTRACT(DAY FROM created_at) as hari'),
                    DB::raw('SUM(total_harga) as total')
                )
                ->groupBy('tahun', 'bulan', 'hari')
                ->orderBy('tahun')->orderBy('bulan')->orderBy('hari');
        } elseif ($period === '1m') {
            $queryData->where('created_at', '>=', now()->subDays(30))
                ->select(
                    DB::raw('EXTRACT(YEAR FROM created_at) as tahun'),
                    DB::raw('EXTRACT(MONTH FROM created_at) as bulan'),
                    DB::raw('EXTRACT(DAY FROM created_at) as hari'),
                    DB::raw('SUM(total_harga) as total')
                )
                ->groupBy('tahun', 'bulan', 'hari')
                ->orderBy('tahun')->orderBy('bulan')->orderBy('hari');
        } elseif ($period === '1y') {
            $queryData->where('created_at', '>=', now()->subMonths(12))
                ->select(
                    DB::raw('EXTRACT(YEAR FROM created_at) as tahun'),
                    DB::raw('EXTRACT(MONTH FROM created_at) as bulan'),
                    DB::raw('SUM(total_harga) as total')
                )
                ->groupBy('tahun', 'bulan')
                ->orderBy('tahun')->orderBy('bulan');
        } else {
            // Default 6m
            $queryData->where('created_at', '>=', now()->subMonths(6))
                ->select(
                    DB::raw('EXTRACT(YEAR FROM created_at) as tahun'),
                    DB::raw('EXTRACT(MONTH FROM created_at) as bulan'),
                    DB::raw('SUM(total_harga) as total')
                )
                ->groupBy('tahun', 'bulan')
                ->orderBy('tahun')->orderBy('bulan');
        }

        $pendapatanPerBulan = $queryData->get()->map(function ($row) use ($period) {
            if ($period === '7d' || $period === '1m') {
                return [
                    'bulan' => \Carbon\Carbon::create($row->tahun, $row->bulan, $row->hari)->translatedFormat('d M'),
                    'total' => (int) $row->total,
                ];
            } else {
                return [
                    'bulan' => \Carbon\Carbon::create($row->tahun, $row->bulan)->translatedFormat('M Y'),
                    'total' => (int) $row->total,
                ];
            }
        });

        // Status order breakdown
        $statusBreakdown = Order::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($row) => [$row->status => $row->total]);

        // Tambahan untuk Dashboard Admin
        $pelangganSuspend = Order::where('status', 'suspend')->count();

        $tiketAktif = Ticket::whereNotIn('status', ['selesai', 'ditutup'])->count();

        $teknisiBertugas = TechnicianSchedule::whereDate('tanggal_kunjungan', now()->toDateString())
            ->whereIn('status', ['terjadwal', 'proses'])
            ->distinct('nama_teknisi')
            ->count('nama_teknisi');

        return response()->json([
            'total_pendapatan'      => $totalPendapatan,
            'pendapatan_bulan_ini'  => $pendapatanBulanIni,
            'pelanggan_aktif'       => $pelangganAktif,
            'pelanggan_suspend'     => $pelangganSuspend,
            'total_order'           => $totalOrder,
            'order_pending'         => $orderPending,
            'tiket_aktif'           => $tiketAktif,
            'teknisi_bertugas'      => $teknisiBertugas,
            'paket_terlaris'        => $paketTerlaris,
            'pendapatan_per_bulan'  => $pendapatanPerBulan,
            'status_breakdown'      => $statusBreakdown,
        ]);
    }
}
