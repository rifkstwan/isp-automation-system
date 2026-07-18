<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SurveyRequest;
use App\Models\Notification;
use App\Services\WhatsAppService;
use App\Mail\SurveyStatusMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;

class SurveyRequestController extends Controller
{
    // Public: Submit a new location survey request
    public function store(Request $request)
    {
        $request->validate([
            'nama'      => 'required|string|max:255',
            'phone'     => 'required|string|max:50',
            'email'     => 'nullable|email|max:255',
            'alamat'    => 'required|string|max:1000',
            'latitude'  => 'nullable|string|max:100',
            'longitude' => 'nullable|string|max:100',
            'catatan'   => 'nullable|string|max:1000',
        ]);

        $survey = SurveyRequest::create([
            'nama'      => $request->nama,
            'phone'     => $request->phone,
            'email'     => $request->email,
            'alamat'    => $request->alamat,
            'latitude'  => $request->latitude,
            'longitude' => $request->longitude,
            'catatan'   => $request->catatan,
            'status'    => 'pending',
        ]);

        // Notify Admins
        try {
            Notification::notifyAdmins(
                'Permohonan Survey Baru',
                'Calon pelanggan ' . $survey->nama . ' mengajukan survey lokasi di: ' . substr($survey->alamat, 0, 80),
                'survey'
            );
        } catch (\Exception $e) {
            \Log::error('Notification survey error: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Permohonan survey berhasil dikirim! Tim kami akan menghubungi Anda segera.',
            'survey'  => $survey,
        ], 201);
    }

    // Technician/Admin: Get all survey requests
    public function index()
    {
        $surveys = SurveyRequest::orderBy('created_at', 'desc')->get();
        return response()->json($surveys);
    }

    // Technician/Admin: Update survey status ('pending', 'dijadwalkan', 'layak', 'ditolak')
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,dijadwalkan,layak,ditolak',
        ]);

        $survey = SurveyRequest::findOrFail($id);
        $oldStatus = $survey->status;
        $survey->status = $request->status;
        $survey->save();

        if ($request->status === 'layak' && $oldStatus !== 'layak') {
            Notification::notifyAdmins(
                'Survey Lokasi Diverifikasi LAYAK',
                'Lokasi survey ' . $survey->nama . ' (' . substr($survey->alamat, 0, 50) . ') dikonfirmasi LAYAK oleh teknisi.',
                'survey'
            );
        }

        // Send WhatsApp Notification to applicant
        try {
            WhatsAppService::sendSurveyNotification($survey);
        } catch (\Exception $e) {
            \Log::error('Gagal mengirimkan notifikasi WA survey: ' . $e->getMessage());
        }

        // Send Email Notification to applicant if email present
        if (!empty($survey->email)) {
            try {
                Mail::to($survey->email)->send(new SurveyStatusMail($survey));
            } catch (\Exception $e) {
                \Log::error('Gagal mengirimkan email survey: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Status survey berhasil diperbarui',
            'survey'  => $survey,
        ]);
    }

    // Admin: Assign technician to survey request
    public function assignTechnician(Request $request, $id)
    {
        $request->validate([
            'nama_teknisi'   => 'required|string|max:255',
            'tanggal_survey' => 'required|date',
        ]);

        $survey = SurveyRequest::findOrFail($id);
        $survey->nama_teknisi   = $request->nama_teknisi;
        $survey->tanggal_survey = $request->tanggal_survey;
        $survey->status         = 'dijadwalkan';
        $survey->save();

        // Notify Technician
        try {
            Notification::notifyTechnician(
                $request->nama_teknisi,
                'Tugas Survey Lokasi Baru',
                'Anda ditugaskan untuk melakukan survey lokasi atas nama ' . $survey->nama . ' pada tanggal ' . \Carbon\Carbon::parse($request->tanggal_survey)->format('d/m/Y H:i') . ' di ' . substr($survey->alamat, 0, 50),
                'survey'
            );
        } catch (\Exception $e) {
            \Log::error('Notification assign technician error: ' . $e->getMessage());
        }

        // Send WhatsApp Notification to applicant
        try {
            WhatsAppService::sendSurveyNotification($survey);
        } catch (\Exception $e) {
            \Log::error('Gagal mengirimkan notifikasi WA survey penugasan: ' . $e->getMessage());
        }

        // Send Email Notification to applicant if email present
        if (!empty($survey->email)) {
            try {
                Mail::to($survey->email)->send(new SurveyStatusMail($survey));
            } catch (\Exception $e) {
                \Log::error('Gagal mengirimkan email survey penugasan: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Teknisi berhasil ditugaskan untuk survey lokasi.',
            'survey'  => $survey,
        ]);
    }



    // Public: Fetch verified eligible survey locations to dynamically augment coverage checks
    public function verifiedLocations()
    {
        $layakLocations = SurveyRequest::where('status', 'layak')
            ->select('id', 'nama', 'alamat', 'latitude', 'longitude', 'catatan')
            ->get();

        return response()->json($layakLocations);
    }
}
