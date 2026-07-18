<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    /**
     * Kirim link reset password ke email user.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Selalu kirim response sukses agar tidak bocor info akun
        if (!$user) {
            return response()->json([
                'message' => 'Jika email terdaftar, link reset password telah dikirim.',
            ]);
        }

        // Hapus token lama jika ada
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Buat token baru
        $token = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email'      => $request->email,
            'token'      => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        // URL reset password di frontend
        $resetUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') 
                    . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        // Kirim email
        Mail::send([], [], function ($message) use ($user, $resetUrl) {
            $message->to($user->email, $user->name)
                ->subject('Reset Password - CV Citra Mandiri')
                ->html($this->buildEmailHtml($user->name, $resetUrl));
        });

        return response()->json([
            'message' => 'Jika email terdaftar, link reset password telah dikirim.',
        ]);
    }

    /**
     * Reset password dengan token yang valid.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required|string',
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'Token tidak valid atau sudah kadaluarsa.',
            ], 422);
        }

        // Cek apakah token sudah kadaluarsa (60 menit)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Token reset password telah kadaluarsa. Silakan minta link baru.',
            ], 422);
        }

        // Verifikasi token
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => 'Token tidak valid atau sudah kadaluarsa.',
            ], 422);
        }

        // Update password user
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Hapus semua token lama
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Hapus semua sesi aktif user agar harus login ulang
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password berhasil direset. Silakan login dengan password baru Anda.',
        ]);
    }

    private function buildEmailHtml(string $name, string $resetUrl): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:36px 40px;text-align:center;">
              <p style="color:#bfdbfe;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">CV Citra Mandiri</p>
              <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Reset Password Anda</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#475569;font-size:15px;margin:0 0 16px;">Halo, <strong style="color:#1e293b;">{$name}</strong></p>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 32px;">
                Kami menerima permintaan untuk mereset password akun Anda di <strong>CV Citra Mandiri WiFi</strong>. 
                Klik tombol di bawah untuk membuat password baru. Link ini hanya berlaku selama <strong>60 menit</strong>.
              </p>
              <div style="text-align:center;margin:0 0 32px;">
                <a href="{$resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;">
                  Reset Password Sekarang
                </a>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:0 0 24px;">
                <p style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Atau salin link berikut:</p>
                <p style="color:#3b82f6;font-size:12px;word-break:break-all;margin:0;">{$resetUrl}</p>
              </div>
              <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
                Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                © 2025 CV Citra Mandiri WiFi · Semarang, Jawa Tengah
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
