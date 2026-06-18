<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class WhatsAppService
{
    /**
     * Send a WhatsApp message using the configured API settings.
     * 
     * Mendukung provider:
     * - Fonnte (https://fonnte.com) — Default, gunakan wa_api_url = https://api.fonnte.com/send
     * - Wablas (https://wablas.com) — Gunakan wa_api_url = https://pati.wablas.com/api/send-message
     * 
     * Konfigurasi dilakukan melalui tabel settings:
     * - wa_api_url: URL endpoint API provider
     * - wa_api_key: Token/API Key dari provider
     */
    public static function sendMessage(string $phone, string $message): bool
    {
        Log::channel('single')->info('=== WHATSAPP MESSAGE TRIGGERED ===');
        Log::channel('single')->info('To: ' . $phone);
        Log::channel('single')->info('Message: ' . $message);
        
        $apiUrl = Setting::where('key', 'wa_api_url')->value('value');
        $apiKey = Setting::where('key', 'wa_api_key')->value('value');

        if (empty($apiUrl) || empty($apiKey)) {
            Log::channel('single')->warning('WhatsApp API URL or Key is not configured. Message logged only.');
            return false;
        }

        try {
            // Deteksi provider berdasarkan URL
            if (str_contains($apiUrl, 'fonnte.com')) {
                // === FONNTE API ===
                // Docs: https://docs.fonnte.com/
                $response = Http::withHeaders([
                    'Authorization' => $apiKey,
                ])->post($apiUrl, [
                    'target'  => self::formatPhone($phone),
                    'message' => $message,
                    'countryCode' => '62', // Indonesia
                ]);
            } elseif (str_contains($apiUrl, 'wablas.com')) {
                // === WABLAS API ===
                // Docs: https://docs.wablas.com/
                $response = Http::withHeaders([
                    'Authorization' => $apiKey,
                ])->post($apiUrl, [
                    'phone'   => self::formatPhone($phone),
                    'message' => $message,
                ]);
            } else {
                // === GENERIC API ===
                // Format standar untuk provider lainnya
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                ])->post($apiUrl, [
                    'phone'   => self::formatPhone($phone),
                    'message' => $message,
                ]);
            }

            if ($response->successful()) {
                Log::channel('single')->info('WhatsApp message sent successfully via ' . $apiUrl);
                Log::channel('single')->info('Response: ' . $response->body());
                return true;
            } else {
                Log::channel('single')->error('WhatsApp API returned error: ' . $response->status() . ' - ' . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::channel('single')->error('Exception during WhatsApp sending: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Format nomor telepon ke format internasional (62xxx).
     * Mengubah format 08xx menjadi 628xx.
     */
    private static function formatPhone(string $phone): string
    {
        // Hapus spasi, strip, dan karakter non-digit
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Konversi 08xx → 628xx
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        
        // Konversi +62 → 62 (jika ada prefix +)
        if (str_starts_with($phone, '+')) {
            $phone = substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Send a welcome message to newly registered users.
     */
    public static function sendWelcomeMessage($user)
    {
        if (empty($user->phone)) return;

        $message = "Halo {$user->name}, selamat datang di layanan CV. Citra Mandiri!\n\n"
                 . "Akun Anda telah berhasil dibuat. Kami siap memberikan layanan WiFi terbaik untuk Anda.\n"
                 . "Silakan cek halaman dashboard untuk memilih paket langganan Anda.";

        self::sendMessage($user->phone, $message);
    }

    /**
     * Send an order confirmation to the user.
     */
    public static function sendOrderNotification($user, $order, $paket)
    {
        if (empty($user->phone)) return;

        $formattedPrice = "Rp " . number_format($paket->harga, 0, ',', '.');
        $message = "Halo {$user->name}, terima kasih telah melakukan pemesanan paket WiFi!\n\n"
                 . "Detail Pesanan:\n"
                 . "- Paket: {$paket->nama}\n"
                 . "- Harga: {$formattedPrice}/bulan\n"
                 . "- Status: {$order->status}\n\n"
                 . "Pesanan Anda sedang kami proses. Teknisi kami akan segera menghubungi Anda untuk jadwal pemasangan.";

        self::sendMessage($user->phone, $message);
    }

    /**
     * Send a billing notification or receipt to the user.
     */
    public static function sendBillingNotification($user, $billing)
    {
        if (empty($user->phone)) return;

        $formattedTotal = "Rp " . number_format($billing->jumlah_tagihan, 0, ',', '.');
        
        if ($billing->status === 'paid') {
            $message = "Terima kasih {$user->name}!\n\n"
                     . "Pembayaran tagihan Anda sebesar {$formattedTotal} untuk periode " 
                     . \Carbon\Carbon::parse($billing->jatuh_tempo)->format('F Y') 
                     . " telah BERHASIL kami terima. Layanan WiFi Anda aktif seperti biasa.";
        } else {
            $message = "Halo {$user->name}, ini adalah pengingat tagihan WiFi Anda.\n\n"
                     . "Total Tagihan: {$formattedTotal}\n"
                     . "Jatuh Tempo: " . \Carbon\Carbon::parse($billing->jatuh_tempo)->format('d M Y') . "\n\n"
                     . "Mohon segera lakukan pembayaran sebelum tanggal jatuh tempo agar layanan tidak terputus. Abaikan pesan ini jika Anda sudah membayar.";
        }

        self::sendMessage($user->phone, $message);
    }

    /**
     * Send a ticket status update to the user.
     */
    public static function sendTicketUpdateNotification($user, $ticket)
    {
        if (empty($user->phone)) return;

        $statusIndo = match($ticket->status) {
            'menunggu' => 'Sedang Menunggu Teknisi',
            'diproses' => 'Sedang Dikerjakan Teknisi',
            'selesai' => 'Selesai Diperbaiki',
            default => ucfirst($ticket->status)
        };

        $message = "Halo {$user->name},\n\n"
                 . "Terdapat pembaruan pada tiket pengaduan Anda (Tiket ID: #{$ticket->id}):\n"
                 . "Status Saat Ini: *{$statusIndo}*\n\n";
                 
        if ($ticket->status === 'selesai') {
            $message .= "Gangguan jaringan Anda telah berhasil kami perbaiki. Terima kasih atas kesabarannya!";
        } else {
            $message .= "Tim kami sedang berusaha menangani kendala Anda secepat mungkin.";
        }

        self::sendMessage($user->phone, $message);
    }

    /**
     * Send a suspend/isolation notification to the user.
     */
    public static function sendSuspendNotification($user, $billing)
    {
        if (empty($user->phone)) return;

        $formattedTotal = "Rp " . number_format($billing->jumlah_tagihan, 0, ',', '.');

        $message = "Halo {$user->name},\n\n"
                 . "Layanan internet Anda sementara *DIISOLIR* karena tagihan sebesar {$formattedTotal} telah melewati tanggal jatuh tempo.\n\n"
                 . "Segera lunasi tagihan Anda agar koneksi internet dapat aktif kembali.\n"
                 . "Hubungi admin jika memerlukan bantuan.";

        self::sendMessage($user->phone, $message);
    }
}
