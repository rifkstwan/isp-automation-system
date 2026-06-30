# 📋 LAPORAN TEKNIS FRONTEND
## Sistem Manajemen WiFi — CV Citra Mandiri

**Tanggal:** 29 Juni 2026  
**Versi:** 2.0  
**Platform Web:** React 19, Vite 8.0, Tailwind CSS 4.0, TypeScript 6.0  
**Platform Mobile:** Expo 54, React Native 0.81.5, TypeScript 5.3  
**State & Query Management:** TanStack React Query v5 & React Context API  
**Desain & UI:** Tailwind CSS v4 (Web) & StyleSheet Native + Vector Icons (Mobile)

---

## Daftar Isi

1. [Gambaran Umum Frontend](#1-gambaran-umum-frontend)
2. [Arsitektur & Teknologi](#2-arsitektur--teknologi)
3. [Struktur Direktori Proyek](#3-struktur-direktori-proyek)
4. [Sistem Autentikasi & Otorisasi](#4-sistem-autentikasi--otorisasi)
5. [Aplikasi Web Frontend (Vite + React)](#5-aplikasi-web-frontend-vite--react)
6. [Aplikasi Mobile Frontend (Expo + React Native)](#6-aplikasi-mobile-frontend-expo--react-native)
7. [Integrasi API & Service Client](#7-integrasi-api--service-client)
8. [React Hooks Kustom (State & API Layer)](#8-react-hooks-kustom-state--api-layer)
9. [Detail Implementasi Fitur Utama](#9-detail-implementasi-fitur-utama)
   - 9.1 [Integrasi Pembayaran Midtrans Snap](#91-integrasi-pembayaran-midtrans-snap)
   - 9.2 [Ekspor Laporan PDF Dinamis](#92-ekspor-laporan-pdf-dinamis)
   - 9.3 [Monitoring MikroTik & Visualisasi Grafik](#93-monitoring-mikrotik--visualisasi-grafik)
   - 9.4 [Sistem Input Teknisi Lapangan](#94-sistem-input-teknisi-lapangan)
10. [Konfigurasi Environment](#10-konfigurasi-environment)
11. [Dependensi Proyek](#11-dependensi-proyek)
12. [Ringkasan Statistik Kode](#12-ringkasan-statistik-kode)

---

## 1. Gambaran Umum Frontend

Sistem Frontend Manajemen WiFi CV Citra Mandiri mengadopsi pendekatan **Multi-Platform** untuk memfasilitasi kebutuhan tiga aktor utama dalam ekosistem bisnis:

1. **Aplikasi Web Administrasi & Portal Pengguna (`frontend`):**
   - **Admin Portal:** Digunakan oleh admin utama untuk memantau traffic MikroTik secara *real-time*, mengelola paket internet, melacak order, menyetujui upgrade layanan, menugaskan tiket keluhan ke teknisi, mencetak laporan pemasangan dan keuangan, serta mengubah konfigurasi global sistem (Midtrans, WhatsApp API, SMTP).
   - **Customer Portal:** Digunakan oleh pelanggan yang mengakses via web browser untuk melakukan pendaftaran akun, pemesanan paket internet (order baru), melihat dan membayar tagihan menggunakan payment gateway Midtrans Snap, mengirim keluhan/tiket, melihat jadwal survei/instalasi, dan mengirimkan testimonial/ulasan.
   - **Technician Portal:** Digunakan oleh teknisi lapangan melalui browser responsif untuk memperbarui status pengerjaan tiket keluhan, mengisi data survei (koordinat ODP, redaman dBm, jarak dropcore), dan memperbarui instalasi baru (pengaturan ONT, status OPM).
   - **Owner Portal:** Digunakan oleh pemilik usaha untuk memantau ringkasan laporan eksekutif dan performa penjualan bulanan.

2. **Aplikasi Mobile Pelanggan (`mobile`):**
   - Berbasis **React Native** (menggunakan Expo SDK 54) yang menargetkan pengguna smartphone Android dan iOS. Berfokus pada kemudahan akses bagi pelanggan dalam memantau konektivitas WiFi rumah, melacak masa aktif paket, mengunggah dokumen/foto KTP untuk pemesanan baru, serta melakukan pembayaran langsung menggunakan webview/in-app browser yang terhubung ke Midtrans Snap.

---

## 2. Arsitektur & Teknologi

### Web Frontend Stack:
* **UI Library:** React 19.2.6 (memanfaatkan optimasi rendering baru dan dukungan penuh *concurrent features*).
* **Build System:** Vite 8.0.12 (untuk proses kompilasi instan dan *Hot Module Replacement* yang sangat cepat).
* **Styling Engine:** Tailwind CSS v4.0.12 (menggunakan mesin kustom `@tailwindcss/vite` untuk build super cepat tanpa file konfigurasi eksternal yang kompleks, serta menggunakan variabel CSS modern).
* **Routing:** React Router DOM v7.16.0 (mendukung skema routing bersarang/nested routes dan tata letak dinamis).
* **Data Fetching:** TanStack React Query v5.101.0 (menyediakan *auto-caching*, *synchronization*, *polling network monitoring*, dan penanganan *mutation* yang efisien).
* **Visualisasi Data:** Recharts 3.8.1 (digunakan untuk menampilkan grafik utilisasi CPU, memori MikroTik, dan pertumbuhan pelanggan).
* **Dokumen:** jsPDF 4.2.1 & jsPDF AutoTable 5.0.8 (untuk menghasilkan berkas laporan PDF langsung di sisi klien secara instan).

### Mobile Frontend Stack:
* **Core Framework:** React Native 0.81.5 dengan **Expo SDK 54** (untuk ketersediaan API perangkat native secara konsisten).
* **Navigation:** React Navigation v7 (skema *Native Stack Navigation* untuk transisi layar berkinerja tinggi).
* **Storage:** AsyncStorage v2.2.0 (untuk penyimpanan persisten token autentikasi JWT di perangkat).
* **Native Utilities:** Expo WebBrowser (untuk transaksi Midtrans Snap), Expo Print & Expo Sharing (untuk generate & download invoice PDF), serta Expo ImagePicker (untuk upload KTP & bukti survei).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARSIREKTUR ALUR DATA                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   
      ┌──────────────────┐           ┌──────────────────┐
      │   APLIKASI WEB   │           │ APLIKASI MOBILE  │
      │   (React + Vite) │           │  (React Native)  │
      └────────┬─────────┘           └────────┬─────────┘
               │                              │
               │                              │
               ▼                              ▼
      ┌─────────────────────────────────────────────────┐
      │             HTTP Client (Axios)                 │
      │      - Interceptor: Auth Token Injection        │
      │      - Interceptor: Global 401 Redirect         │
      └──────────────────────┬──────────────────────────┘
                             │
                             ▼
      ┌─────────────────────────────────────────────────┐
      │          RESTful API Gateway (Laravel)          │
      └─────────────────────────────────────────────────┘
```

---

## 3. Struktur Direktori Proyek

### 3.1 Portal Web (`frontend`)
* [App.tsx](file:///Users/user/wifi-management/frontend/src/App.tsx) — Komponen utama root yang merender konfigurasi rute.
* [main.tsx](file:///Users/user/wifi-management/frontend/src/main.tsx) — Titik masuk eksekusi React.
* [index.css](file:///Users/user/wifi-management/frontend/src/index.css) — Desain utama dan variabel CSS (Tailwind v4).
* `contexts/`
  - [AuthContext.tsx](file:///Users/user/wifi-management/frontend/src/contexts/AuthContext.tsx) — React Context untuk autentikasi web global.
* `providers/`
  - [AppProvider.tsx](file:///Users/user/wifi-management/frontend/src/providers/AppProvider.tsx) — Wrapper global untuk router, react query, dan auth.
* `components/`
  - [NotificationDropdown.tsx](file:///Users/user/wifi-management/frontend/src/components/NotificationDropdown.tsx) — Komponen dropdown notifikasi interaktif pada header/navbar.
* `layouts/`
  - [AdminDashboardLayout.tsx](file:///Users/user/wifi-management/frontend/src/layouts/AdminDashboardLayout.tsx) — Layout sidebar & header khusus halaman Admin.
  - [UserDashboardLayout.tsx](file:///Users/user/wifi-management/frontend/src/layouts/UserDashboardLayout.tsx) — Layout portal pengguna untuk pelanggan.
  - [TechnicianDashboardLayout.tsx](file:///Users/user/wifi-management/frontend/src/layouts/TechnicianDashboardLayout.tsx) — Layout responsif ramah sentuhan khusus Teknisi.
  - [MainLayout.tsx](file:///Users/user/wifi-management/frontend/src/layouts/MainLayout.tsx) — Layout dasar untuk publik & halaman otentikasi.
* `services/`
  - [api.ts](file:///Users/user/wifi-management/frontend/src/services/api.ts) — Inisialisasi Axios Client dan interceptor JWT Sanctum.
* `routes/`
  - [index.tsx](file:///Users/user/wifi-management/frontend/src/routes/index.tsx) — Pemetaan rute, proteksi rute, dan logika pengalihan hak akses.
* `hooks/` — Kumpulan React Query hooks kustom:
  - `usePakets.ts`, `useMidtrans.ts`, `useTraffic.ts`, `useOrders.ts`, `useReports.ts`, `useTestimonials.ts`, `useNotifications.ts`, `useSchedules.ts`, `useTechnicianAccounts.ts`, `useSettings.ts`, `useTickets.ts`.

### 3.2 Aplikasi Mobile (`mobile`)
* [App.tsx](file:///Users/user/wifi-management/mobile/App.tsx) — Titik masuk utama mobile, membungkus `NavigationContainer` dan `AuthProvider`.
* `src/utils/`
  - [AuthContext.tsx](file:///Users/user/wifi-management/mobile/src/utils/AuthContext.tsx) — Context otentikasi berbasis AsyncStorage.
* `src/api/`
  - [client.ts](file:///Users/user/wifi-management/mobile/src/api/client.ts) — Axios client dengan dukungan fallback IP lokal LAN fisik.
  - [services.ts](file:///Users/user/wifi-management/mobile/src/api/services.ts) — Definisi tipe data API dan fungsi fetch database backend.
* `src/screens/` — Kumpulan 13 layar aplikasi pelanggan:
  - `DashboardScreen.tsx`, `BillingScreen.tsx`, `OrderScreen.tsx`, `OrderHistoryScreen.tsx`, `TicketScreen.tsx`, `ScheduleScreen.tsx`, `NotificationScreen.tsx`, `ProfileScreen.tsx`, `TestimonialScreen.tsx`, `SearchScreen.tsx`, `OnboardingScreen.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx`.

---

## 4. Sistem Autentikasi & Otorisasi

Autentikasi menggunakan **Laravel Sanctum** berbasis token. Token disimpan di `localStorage` pada Web, dan `AsyncStorage` pada Mobile.

### 4.1 Logika Autentikasi Web (`frontend/src/contexts/AuthContext.tsx`)
Penyedia autentikasi memuat status pengguna secara dinamis saat aplikasi diinisialisasi:
```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get("/me")
        .then((res) => {
          setUser(res.data.user)
          setRoles(res.data.roles)
        })
        .catch(() => {
          localStorage.removeItem("token")
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])
  
  // Fungsi login, register, dan logout terintegrasi...
}
```

### 4.2 Proteksi Rute Web (`frontend/src/routes/index.tsx`)
Mengamankan halaman dari akses ilegal berdasarkan hak akses pengguna (*roles*):
* `ProtectedRoute`: Memeriksa apakah pengguna memiliki token aktif dan memiliki role yang terdaftar dalam `requiredRole` atau `allowedRoles`. Jika tidak berhak, secara otomatis dialihkan ke halaman `/redirect`.
* `SmartRedirect`: Halaman pengarah pintar yang mendeteksi peran pengguna saat berhasil login dan mengarahkannya ke dasbor yang sesuai:
  - `admin` ➔ `/admin`
  - `teknisi` ➔ `/technician`
  - Lainnya (Pelanggan) ➔ `/dashboard`

```typescript
function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { token, roles, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!token) return <Navigate to="/login" replace />
  if (requiredRole && !roles.includes(requiredRole)) return <Navigate to="/redirect" replace />
  if (allowedRoles && !allowedRoles.some(role => roles.includes(role))) return <Navigate to="/redirect" replace />
  return <>{children}</>
}
```

### 4.3 Autentikasi Mobile (`mobile/src/utils/AuthContext.tsx`)
Sistem di mobile menggunakan alur serupa, dioptimalkan untuk performa penyimpanan seluler menggunakan `AsyncStorage`:
- Fungsi `checkToken` mengambil `auth_token` dari penyimpanan lokal.
- Mengambil profil pengguna dari `/me` untuk mendapatkan data terbaru.
- Menentukan status `isAuthenticated` (bernilai `true` jika data pengguna ada).
- Menyediakan status transisi `isLoading` agar navigasi tidak berkedip saat memuat data.

---

## 5. Aplikasi Web Frontend (Vite + React)

Aplikasi Web menyediakan panel admin dengan antarmuka yang sangat responsif, minimalis, dan menggunakan skema warna modern (gelap/terang otomatis).

### 5.1 Tata Letak & Navigasi (Layouts)
Aplikasi membagi halaman ke dalam tata letak khusus sesuai hak akses:
1. **`AdminDashboardLayout.tsx`:** Menyediakan sidebar menu navigasi penuh untuk admin, ikon notifikasi global, menu dropdown profil, dan area konten utama yang responsif.
2. **`UserDashboardLayout.tsx`:** Menyediakan header minimalis dengan informasi paket aktif pengguna, tombol pengaduan cepat, tagihan yang belum dibayar, serta menu navigasi bawah untuk kenyamanan perangkat mobile web.
3. **`TechnicianDashboardLayout.tsx`:** Didesain khusus dengan antarmuka yang ramah sentuhan, menekankan navigasi ke tugas hari ini dan riwayat pekerjaan teknisi.

### 5.2 Fitur Halaman Admin (`pages/admin/`)
* **[AdminDashboardPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminDashboardPage.tsx):** Dashboard ringkasan berisi widget status pendapatan (total & bulan ini), jumlah pelanggan aktif, tiket gangguan aktif, grafik area Recharts untuk tren keuangan, dan monitoring log MikroTik terbaru.
* **[AdminOrdersPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminOrdersPage.tsx):** Kelola instalasi baru. Admin dapat menyetujui pendaftaran, menetapkan teknisi pemasangan, dan membatalkan pemesanan.
* **[AdminPaketsPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminPaketsPage.tsx):** CRUD paket internet (nama paket, kecepatan Mbps, harga bulanan, dan deskripsi promo).
* **[AdminCustomersPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminCustomersPage.tsx):** Database pelanggan lengkap. Memungkinkan pencarian cepat, filter status (aktif/nonaktif/suspend), dan melihat riwayat billing pelanggan.
* **[AdminBillingPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminBillingPage.tsx):** Antarmuka penagihan untuk menerbitkan invoice baru, memproses tagihan bulanan otomatis, dan melacak daftar tagihan per periode.
* **[AdminPaymentsPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminPaymentsPage.tsx):** Log riwayat transaksi lengkap yang masuk melalui Midtrans Snap API, beserta status transaksi (*settlement*, *pending*, *expire*).
* **[AdminTicketsPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminTicketsPage.tsx):** Manajemen tiket keluhan pelanggan. Admin dapat mengubah prioritas tiket dan menetapkan teknisi untuk berkunjung.
* **[AdminTechniciansPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminTechniciansPage.tsx):** Manajemen akun teknisi, pemetaan tugas lapangan, dan memantau performa penyelesaian gangguan.
* **[AdminNetworkPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminNetworkPage.tsx):** Integrasi MikroTik RouterOS API secara *real-time* (Utilisasi CPU, RAM, Uptime, Monitoring Port AP, dan manajemen akun user PPPoE).
* **[AdminSettingsPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminSettingsPage.tsx):** Halaman konfigurasi dinamis yang langsung mengubah data pada tabel database backend untuk kredensial SMTP, WhatsApp Gateway API (Fonnte/kustom), Midtrans Client/Server Key, dan IP MikroTik.
* **[AdminReportsPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminReportsPage.tsx):** Halaman laporan komprehensif dengan filter periode untuk ekspor dokumen PDF secara instan.
* **[AdminUpgradesPage](file:///Users/user/wifi-management/frontend/src/pages/admin/AdminUpgradesPage.tsx):** Memproses dan menyetujui permintaan upgrade/downgrade paket internet pelanggan.

### 5.3 Fitur Halaman Pelanggan (`pages/dashboard/`)
* **[UserDashboardPage](file:///Users/user/wifi-management/frontend/src/pages/dashboard/UserDashboardPage.tsx):** Panel ringkasan pelanggan. Menampilkan status koneksi ("Aktif" atau "Terisolir"), info masa aktif WiFi, total tagihan yang harus segera dibayar, dan daftar tiket keluhan aktif.
* **[ServicesPage](file:///Users/user/wifi-management/frontend/src/pages/dashboard/ServicesPage.tsx):** Fitur bagi pelanggan untuk mengajukan pasang baru atau meminta upgrade paket internet ke kecepatan yang lebih tinggi.
* **[BillingPage](file:///Users/user/wifi-management/frontend/src/pages/dashboard/BillingPage.tsx):** Melihat riwayat invoice tagihan bulanan dan melakukan pembayaran instan secara langsung menggunakan Midtrans Snap SDK.
* **[TicketsPage](file:///Users/user/wifi-management/frontend/src/pages/dashboard/TicketsPage.tsx):** Membuat tiket pengaduan jika terjadi masalah jaringan lambat atau los sinyal (disertai status interaktif penyelesaian tiket).

### 5.4 Fitur Halaman Teknisi (`pages/technician/`)
* **[TechnicianDashboardPage](file:///Users/user/wifi-management/frontend/src/pages/technician/TechnicianDashboardPage.tsx):** Menampilkan tugas yang ditugaskan hari ini, mencakup status pemasangan instalasi baru dan penanganan keluhan gangguan.
* **[TechnicianInstallationsPage](file:///Users/user/wifi-management/frontend/src/pages/technician/TechnicianInstallationsPage.tsx):** Halaman teknisi untuk mengisi data teknis ONT (Merk router, Serial Number, Mac Address) dan mengunggah hasil OPM (Optical Power Meter) redaman kabel dalam satuan dBm.

---

## 6. Aplikasi Mobile Frontend (Expo + React Native)

Aplikasi Mobile dirancang khusus untuk pelanggan agar mendapatkan pengalaman native yang cepat. Menggunakan desain minimalis bernuansa biru/slate gelap.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ALUR NAVIGASI MOBILE                             │
└─────────────────────────────────────────────────────────────────────────────┘

    (Belum Autentikasi)
      OnboardingScreen ───▶ LoginScreen ───▶ RegisterScreen
                                │
                                │ (Autentikasi Sukses)
                                ▼
                         DashboardScreen 
      ┌─────────────────────────┼─────────────────────────┐
      ▼                         ▼                         ▼
  BillingScreen            TicketScreen              OrderScreen
  (Bayar via Snap          (Buat Tiket               (Form Pasang
   WebView & PDF            Pengaduan &               Baru + Upload
   Invoice)                 Riwayat Keluhan)          Foto KTP)
      │                         │                         │
      ▼                         ▼                         ▼
  ProfileScreen            ScheduleScreen         OrderHistoryScreen
  (Ganti Sandi &           (Lihat Jadwal          (Lacak Status
   Info Akun)               Survei/Instalasi)      Pemasangan Kabel)
```

### 6.1 Layar Utama & Deskripsi Fitur (`mobile/src/screens/`)
* **[OnboardingScreen](file:///Users/user/wifi-management/mobile/src/screens/OnboardingScreen.tsx):** Layar pembuka interaktif yang menampilkan *value proposition* layanan internet CV Citra Mandiri.
* **[LoginScreen](file:///Users/user/wifi-management/mobile/src/screens/LoginScreen.tsx) & [RegisterScreen](file:///Users/user/wifi-management/mobile/src/screens/RegisterScreen.tsx):** Antarmuka masukan form dengan validasi error real-time untuk masuk ke akun pelanggan.
* **[DashboardScreen](file:///Users/user/wifi-management/mobile/src/screens/DashboardScreen.tsx):** Dashboard utama dengan status dinamis. Menggunakan komponen *linear gradient* untuk menampilkan status keaktifan internet, sisa hari aktif layanan, shortcut menu cepat (Bayar Tagihan, Layanan Tiket, Order Pemasangan, Jadwal Kunjungan), serta grafik utilisasi mini.
* **[BillingScreen](file:///Users/user/wifi-management/mobile/src/screens/BillingScreen.tsx):** Antarmuka daftar tagihan interaktif. Pelanggan dapat mengklik "Bayar" untuk membuka In-App browser Midtrans Snap, atau mengunduh invoice lunas sebagai file PDF lokal menggunakan `expo-print` and `expo-sharing`.
* **[OrderScreen](file:///Users/user/wifi-management/mobile/src/screens/OrderScreen.tsx):** Formulir pendaftaran pasang baru. Terintegrasi dengan `expo-image-picker` agar pelanggan dapat mengambil foto KTP menggunakan kamera atau galeri untuk diunggah sebagai syarat verifikasi.
* **[TicketScreen](file:///Users/user/wifi-management/mobile/src/screens/TicketScreen.tsx):** Formulir pengaduan masalah internet lengkap dengan riwayat pelaporan.

---

## 7. Integrasi API & Service Client

Frontend berinteraksi dengan Laravel REST API menggunakan pustaka **Axios**. Konfigurasi diatur agar menyisipkan token JWT Sanctum secara otomatis dan menangani token kedaluwarsa secara global.

### 7.1 Web API Client Configuration (`frontend/src/services/api.ts`)
```typescript
import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
})

// Interceptor Request: Otomatis sisipkan token JWT ke Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor Response: Mengarahkan paksa ke /login jika token kadaluwarsa (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
```

### 7.2 Mobile API Client Configuration (`mobile/src/api/client.ts`)
Konfigurasi mobile menggunakan penanganan asinkronus (`AsyncStorage`) untuk menyisipkan token dan memiliki opsi pengalihan base URL adaptif untuk pengujian emulator maupun perangkat fisik:
- **Android Emulator IP:** `http://10.0.2.2:8000/api`
- **Physical Device IP:** Menggunakan alamat IP internal LAN lokal (contoh: `http://192.168.1.5:8000/api`) agar perangkat Android/iOS fisik dapat mendeteksi server lokal pengembang.

---

## 8. React Hooks Kustom (State & API Layer)

Frontend Web menggunakan **TanStack React Query** yang dibungkus dalam bentuk kustom React Hooks di dalam folder `frontend/src/hooks/`. Peta kustom hooks tersebut meliputi:

| Kustom Hook | Fungsi Utama & Modul API |
|---|---|
| `usePakets.ts` | Mengambil data paket internet publik maupun manajemen paket di Admin (CRUD). |
| `useMidtrans.ts` | Berinteraksi dengan endpoint pembayaran untuk mengambil token Snap transaksi tagihan. |
| `useTraffic.ts` | Digunakan untuk melacak data monitoring jaringan real-time dari router. |
| `useOrders.ts` | Mengelola pendaftaran pasang baru, pembaruan status order, dan penugasan teknisi. |
| `useReports.ts` | Melayani pengambilan data analitik keuangan dan laporan operasional admin. |
| `useTestimonials.ts` | Manajemen review testimoni pelanggan di halaman utama beserta moderasinya. |
| `useNotifications.ts`| Mengelola penandaan notifikasi dibaca dan pengiriman pengumuman global. |
| `useSchedules.ts` | Mengatur sinkronisasi kalender kerja teknisi dan jadwal instalasi/survei. |
| `useTechnicianAccounts.ts` | CRUD manajemen data akun teknisi lapangan dan evaluasi status kerja. |
| `useSettings.ts` | Mengambil dan memperbarui konfigurasi sistem pada tabel pengaturan dinamis database. |
| `useTickets.ts` | Mengontrol pembuatan tiket keluhan pelanggan dan penugasan tim perbaikan. |

---

## 9. Detail Implementasi Fitur Utama

### 9.1 Integrasi Pembayaran Midtrans Snap

Skema pembayaran tagihan bulanan dirancang agar aman dan *real-time*. Frontend meminta Snap Token ke backend, lalu merender halaman pembayaran melalui UI Snap Popup (Web) atau In-App Browser (Mobile).

#### Alur Integrasi Web (`frontend/src/pages/dashboard/BillingPage.tsx`)
```typescript
const handlePay = async (billingId: number) => {
  try {
    // 1. Dapatkan snap token transaksi dari backend
    const res = await api.post(`/billings/${billingId}/pay`)
    const snapToken = res.data.snap_token

    // 2. Gunakan library snap window midtrans yang dimuat di index.html
    if ((window as any).snap) {
      (window as any).snap.pay(snapToken, {
        onSuccess: function (result: any) {
          // Refresh data tagihan setelah sukses
          queryClient.invalidateQueries({ queryKey: ["billings"] })
        },
        onPending: function (result: any) {
          alert("Pembayaran Anda sedang diproses. Silakan selesaikan transaksi.")
        },
        onError: function (result: any) {
          alert("Pembayaran gagal. Silakan coba kembali.")
        }
      })
    }
  } catch (error) {
    console.error("Payment error:", error)
  }
}
```

#### Alur Integrasi Mobile (`mobile/src/screens/BillingScreen.tsx`)
Di mobile, pembayaran dilakukan dengan membuka URL Snap sandbox menggunakan browser bawaan sistem (`WebBrowser`):
```typescript
const handlePay = async (billingId: number) => {
  setPaying(billingId);
  try {
    const res = await apiClient.post(`/billings/${billingId}/pay`);
    const snapToken = res.data.snap_token;

    if (!snapToken) {
      Alert.alert('Gagal', 'Tidak mendapatkan token pembayaran.');
      return;
    }

    const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;
    await WebBrowser.openBrowserAsync(paymentUrl);

    // Refresh list setelah browser ditutup
    fetchBillings();
  } catch (error: any) {
    Alert.alert('Gagal', error.response?.data?.message || 'Gagal memproses pembayaran');
  } finally {
    setPaying(null);
  }
};
```

---

### 9.2 Ekspor Laporan PDF Dinamis

Aplikasi Web dan Mobile dapat menghasilkan dokumen PDF langsung tanpa membebani server backend (Client-Side Rendering PDF).

#### Implementasi Web (jsPDF & jsPDF AutoTable)
Admin dapat mengunduh laporan keuangan dan operasional secara instan:
```typescript
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const handleExportPDF = () => {
  const doc = new jsPDF()
  
  // Set Header Laporan
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Laporan Analitik Bisnis", 14, 20)
  
  // Memasukkan Tabel Data Menggunakan AutoTable
  autoTable(doc, {
    startY: 40,
    head: [['Indikator Kinerja Utama', 'Nilai/Total']],
    body: [
      ['Total Pendapatan (Keseluruhan)', formatCurrency(report.total_pendapatan)],
      ['Pendapatan (Bulan Ini)', formatCurrency(report.pendapatan_bulan_ini)],
      ['Pelanggan Aktif', `${report.pelanggan_aktif} Orang`],
    ],
    theme: 'plain',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' }
  })

  doc.save("Laporan-Ringkasan.pdf")
}
```

#### Implementasi Mobile (Expo Print)
Pelanggan dapat mengunduh invoice lunas menggunakan berkas HTML template yang kemudian dikonversi menjadi berkas PDF lokal:
```typescript
const { uri } = await Print.printToFileAsync({ html: htmlInvoiceString });
await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Unduh Invoice' });
```

---

### 9.3 Monitoring MikroTik & Visualisasi Grafik

Panel Admin memantau parameter krusial perangkat router MikroTik untuk memastikan ketersediaan jaringan.

#### Antarmuka Web (`frontend/src/pages/admin/AdminNetworkPage.tsx`)
* **Polling Data Otomatis:** Menggunakan React Query dengan opsi `refetchInterval: 5000` untuk melakukan sinkronisasi data utilisasi CPU, RAM, temperatur, dan port aktif setiap 5 detik.
* **Grafik Recharts:** Menggunakan grafik `AreaChart` dengan animasi halus untuk memvisualisasikan data historis naik-turunnya beban utilisasi CPU Router.
* **PPPoE Monitoring:** Menampilkan tabel aktif berisi nama pengguna PPPoE, alamat IP lokal yang dialokasikan, dan uptime masing-masing sesi koneksi.

```typescript
// Komponen Visualisasi CPU
<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={cpuHistory}>
    <defs>
      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="time" />
    <YAxis unit="%" />
    <Tooltip />
    <Area type="monotone" dataKey="usage" stroke="#8b5cf6" fillOpacity={1} fill="url(#cpuGradient)" />
  </AreaChart>
</ResponsiveContainer>
```

---

### 9.4 Sistem Input Teknisi Lapangan

Untuk menjaga akurasi instalasi fisik di rumah pelanggan, teknisi wajib memasukkan beberapa data penting lewat aplikasi sebelum menyelesaikan tugas.

* **Pengukuran OPM (dBm):** Teknisi memasukkan nilai redaman optik kabel dropcore yang terpasang. Batas aman redaman standar industri berkisar antara `-13 dBm` sampai `-25 dBm`. Jika redaman lebih tinggi (misal `-28 dBm`), sistem memberikan peringatan visual kepada teknisi agar memperbaiki sambungan *fast connector*.
* **Data ONT:** Input serial number, tipe modem/ONT yang diberikan ke pelanggan untuk memudahkan pelacakan inventaris.
* **Foto Pengerjaan:** Integrasi unggah foto instalasi modem sebagai bukti pengerjaan telah selesai dilakukan dengan rapi.

---

## 10. Konfigurasi Environment

Aplikasi membutuhkan berkas `.env` di masing-masing platform untuk mengarahkan komunikasi API ke alamat server backend yang tepat.

### 10.1 Web Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### 10.2 Mobile Environment Configuration (`mobile/app.json`)
Konfigurasi Expo CLI diatur di dalam berkas manifest:
```json
{
  "expo": {
    "name": "WiFi Citra Mandiri Client",
    "slug": "wifi-management-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      }
    }
  }
}
```

---

## 11. Dependensi Proyek

Berikut adalah daftar pustaka utama yang digunakan pada masing-masing platform untuk menopang jalannya sistem aplikasi:

### 11.1 Dependensi Web App (`frontend/package.json`)
```json
"dependencies": {
  "@tailwindcss/vite": "^4.3.0",
  "@tanstack/react-query": "^5.101.0",
  "axios": "^1.17.0",
  "jspdf": "^4.2.1",
  "jspdf-autotable": "^5.0.8",
  "lucide-react": "^1.17.0",
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "react-router-dom": "^7.16.0",
  "recharts": "^3.8.1"
}
```

### 11.2 Dependensi Mobile App (`mobile/package.json`)
```json
"dependencies": {
  "@expo/vector-icons": "^14.0.2",
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-navigation/native": "^7.0.14",
  "@react-navigation/native-stack": "^7.2.0",
  "axios": "^1.7.9",
  "expo": "~54.0.0",
  "expo-asset": "~12.0.13",
  "expo-file-system": "~19.0.23",
  "expo-image-picker": "~17.0.11",
  "expo-linear-gradient": "~15.0.8",
  "expo-print": "~15.0.8",
  "expo-sharing": "~14.0.8",
  "expo-status-bar": "~3.0.9",
  "expo-web-browser": "~15.0.11",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0"
}
```

---

## 12. Ringkasan Statistik Kode

Berikut adalah statistik baris kode (Lines of Code) dan berkas kode sumber yang menyusun aplikasi frontend:

### 12.1 Jumlah Berkas Berdasarkan Ekstensi:
* **Web Frontend (`frontend/src`):**
  - Berkas `.tsx` (Komponen & Halaman): **53 berkas**
  - Berkas `.ts` (Services, Hooks, Rute): **13 berkas**
  - Berkas `.css` (Styling): **3 berkas**
  - **Total Berkas:** **69 berkas**
* **Mobile Frontend (`mobile/src`):**
  - Berkas `.tsx` (Screens): **13 berkas**
  - Berkas `.ts` (API Client & Services): **3 berkas**
  - **Total Berkas:** **16 berkas**

### 12.2 Analisis Baris Kode (Lines of Code - LOC):
* **Web Frontend (`frontend/src`):** ~15.915 baris kode terstruktur.
* **Mobile Frontend (`mobile/src`):** ~4.981 baris kode terstruktur.
* **Total Kumulatif Frontend:** **~20.896 baris kode.**

### 12.3 Distribusi Baris Kode Utama (Web):
1. **Landing Page (`HomePage.tsx`):** 1.128 baris.
2. **Dasbor Utama Pelanggan (`UserDashboardPage.tsx`):** 596 baris.
3. **Manajemen Pengaturan (`AdminSettingsPage.tsx`):** 484 baris.
4. **Monitoring Jaringan (`AdminNetworkPage.tsx`):** 423 baris.
5. **Halaman Billing & Midtrans (`BillingPage.tsx`):** 437 baris.

---

> Laporan teknis frontend ini sah dan sesuai dengan struktur kode program terbaru yang diimplementasikan dalam repositori proyek Sistem Manajemen WiFi CV Citra Mandiri.
