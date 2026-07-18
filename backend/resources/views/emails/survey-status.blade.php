<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header-layak { background: #059669; padding: 32px; text-align: center; }
    .header-ditolak { background: #dc2626; padding: 32px; text-align: center; }
    .header-dijadwalkan { background: #2563eb; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .body { padding: 32px; }
    .body p { color: #444; line-height: 1.6; margin: 0 0 16px; }
    .card-layak { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card-ditolak { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card-dijadwalkan { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card p { margin: 4px 0; color: #334155; font-size: 14px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    @if($survey->status === 'layak')
      <div class="header-layak">
        <h1>✅ Lokasi Verified Terjangkau</h1>
      </div>
      <div class="body">
        <p>Halo, <strong>{{ $survey->nama }}</strong>!</p>
        <p>Kabar gembira! Permohonan survey lokasi yang Anda ajukan telah berhasil diverifikasi oleh tim teknisi kami dan dinyatakan <strong>LAYAK & Terjangkau</strong> oleh jaringan fiber optik CV. Citra Mandiri.</p>
        <div class="card-layak">
          <p><strong>Detail Survey:</strong></p>
          <p>Alamat: <strong>{{ $survey->alamat }}</strong></p>
          <p>Status: <strong style="color: #047857;">LAYAK & TERJANGKAU</strong></p>
        </div>
        <p>Anda dapat segera memilih paket internet dan melakukan pendaftaran di website kami.</p>
        <div style="text-align: center;">
          <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/register" class="btn">Daftar Paket Internet Sekarang</a>
        </div>
      </div>
    @elseif($survey->status === 'ditolak')
      <div class="header-ditolak">
        <h1>❌ Permohonan Survey Ditolak</h1>
      </div>
      <div class="body">
        <p>Halo, <strong>{{ $survey->nama }}</strong>!</p>
        <p>Mohon maaf, lokasi yang Anda ajukan saat ini <strong>belum terjangkau</strong> oleh jaringan kabel fiber optik / ODP CV. Citra Mandiri.</p>
        <div class="card-ditolak">
          <p><strong>Detail Survey:</strong></p>
          <p>Alamat: <strong>{{ $survey->alamat }}</strong></p>
          <p>Status: <strong style="color: #b91c1c;">Luar Jangkauan (Ditolak)</strong></p>
        </div>
        <p>Tim kami terus memperluas jaringan ke berbagai wilayah di Kabupaten Grobogan. Kami akan menghubungi Anda kembali begitu wilayah Anda sudah terjangkau.</p>
      </div>
    @else
      <div class="header-dijadwalkan">
        <h1>📅 Jadwal Kunjungan Survey</h1>
      </div>
      <div class="body">
        <p>Halo, <strong>{{ $survey->nama }}</strong>!</p>
        <p>Permohonan survey lokasi Anda telah kami terima dan telah dijadwalkan untuk peninjauan langsung oleh teknisi lapangan kami.</p>
        <div class="card-dijadwalkan">
          <p><strong>Detail Penugasan:</strong></p>
          <p>Teknisi: <strong>{{ $survey->nama_teknisi ?? 'Tim Teknisi Lapangan' }}</strong></p>
          <p>Jadwal Survey: <strong>{{ $survey->tanggal_survey ? \Carbon\Carbon::parse($survey->tanggal_survey)->format('d F Y - H:i') : '-' }} WIB</strong></p>
          <p>Alamat: <strong>{{ $survey->alamat }}</strong></p>
        </div>
        <p>Teknisi kami akan menghubungi Anda sebelum meluncur ke lokasi.</p>
      </div>
    @endif

    <div class="footer">
      <p>© {{ date('Y') }} CV Citra Mandiri — Internet Fiber Optik Cepat & Terpercaya</p>
    </div>
  </div>
</body>
</html>
