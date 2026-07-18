<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0284c7; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .body { padding: 32px; }
    .body p { color: #444; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card p { margin: 4px 0; color: #0369a1; font-size: 14px; }
    .card strong { color: #0284c7; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Selamat Datang!</h1>
    </div>
    <div class="body">
      <p>Halo, <strong>{{ $user->name }}</strong>!</p>
      <p>Terima kasih telah mendaftar di layanan internet <strong>CV Citra Mandiri</strong>. Akun Anda telah berhasil dibuat.</p>
      <div class="card">
        <p><strong>Informasi Akun Anda:</strong></p>
        <p>Nama: <strong>{{ $user->name }}</strong></p>
        <p>Email: <strong>{{ $user->email }}</strong></p>
        <p>No. Telepon: <strong>{{ $user->phone }}</strong></p>
      </div>
      <p>Anda sekarang dapat memilih paket internet terbaik dan mengelola tagihan langsung dari Dashboard kami.</p>
      <p>Terima kasih telah mempercayai CV Citra Mandiri! 🙏</p>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} CV Citra Mandiri — Layanan Internet Terpercaya</p>
    </div>
  </div>
</body>
</html>
