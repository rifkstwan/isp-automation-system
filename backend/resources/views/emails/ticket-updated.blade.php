<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2563eb; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .body { padding: 32px; }
    .body p { color: #444; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card p { margin: 4px 0; color: #1e40af; font-size: 14px; }
    .card strong { color: #1d4ed8; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Pembaruan Status Tiket #{{ $ticket->id }}</h1>
    </div>
    <div class="body">
      <p>Halo, <strong>{{ $ticket->user->name }}</strong>!</p>
      <p>Terdapat pembaruan pada status laporan gangguan Anda:</p>
      <div class="card">
        <p>Judul Laporan: <strong>{{ $ticket->judul }}</strong></p>
        <p>Status Terbaru: 
          <strong>
            @if($ticket->status === 'diproses')
              ⚙️ Sedang Dikerjakan Teknisi
            @elseif($ticket->status === 'selesai')
              ✅ Selesai Diperbaiki
            @else
              {{ ucfirst($ticket->status) }}
            @endif
          </strong>
        </p>
      </div>
      @if($ticket->status === 'selesai')
        <p>Kendala pada jaringan Anda telah berhasil diperbaiki oleh teknisi kami. Terima kasih atas kesabaran Anda! 🙏</p>
      @else
        <p>Tim teknisi kami sedang menangani kendala Anda. Kami akan terus menginformasikan perkembangannya.</p>
      @endif
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} CV Citra Mandiri — Layanan Internet Terpercaya</p>
    </div>
  </div>
</body>
</html>
