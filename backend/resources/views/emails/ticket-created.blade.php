<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #ea580c; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .body { padding: 32px; }
    .body p { color: #444; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card p { margin: 4px 0; color: #9a3412; font-size: 14px; }
    .card strong { color: #c2410c; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 Tiket Gangguan Diterima</h1>
    </div>
    <div class="body">
      <p>Halo, <strong>{{ $ticket->user->name }}</strong>!</p>
      <p>Laporan gangguan Anda telah kami terima dan sedang masuk antrean penanganan oleh tim teknisi kami.</p>
      <div class="card">
        <p><strong>Detail Tiket #{{ $ticket->id }}:</strong></p>
        <p>Judul Laporan: <strong>{{ $ticket->judul }}</strong></p>
        <p>Prioritas: <strong>{{ ucfirst($ticket->prioritas) }}</strong></p>
        <p>Status: <strong>{{ ucfirst($ticket->status) }}</strong></p>
        <p>Deskripsi Kendala: <em>"{{ $ticket->deskripsi }}"</em></p>
      </div>
      <p>Tim teknisi kami akan segera menangani kendala ini. Anda dapat memantau perkembangan tiket langsung di Dashboard Aplikasi.</p>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} CV Citra Mandiri — Layanan Internet Terpercaya</p>
    </div>
  </div>
</body>
</html>
