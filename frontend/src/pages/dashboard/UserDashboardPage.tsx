import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../contexts/AuthContext"
import { useMyOrders } from "../../hooks/useOrders"
import { useTickets } from "../../hooks/useTickets"
import { useTraffic } from "../../hooks/useTraffic"
import api from "../../services/api"
import {
  Wifi,
  CreditCard,
  Activity,
  Ticket,
  CheckCircle2,
  Clock,
  Zap,
  XCircle,
  Star,
  Send,
  Quote
} from "lucide-react"
import { useMyTestimonial, useSubmitTestimonial } from "../../hooks/useTestimonials"
import { useMidtrans } from "../../hooks/useMidtrans"

export function UserDashboardPage() {
  useAuth()
  const { data: orders, refetch: refetchOrders } = useMyOrders()
  const { data: tickets } = useTickets()
  const { data: traffic, refetch: refetchTraffic } = useTraffic()

  // Fetch Billings
  const { data: billings = [], refetch: refetchBillings } = useQuery({
    queryKey: ["my-billings"],
    queryFn: async () => {
      const res = await api.get("/my-billings")
      return res.data
    },
    refetchInterval: 5000,
  })

  // Calculated stats from billings
  const unpaidBillings = billings?.filter((b: any) => b.status === "unpaid" || b.status === "overdue") || []
  const latestUnpaidBilling = unpaidBillings.length > 0 ? unpaidBillings[0] : null

  // Calculated stats from orders
  const pendingOrders = orders?.filter((o) => o.status === "pending") || []
  const pendingCount = pendingOrders.length + unpaidBillings.length

  // Calculated stats from tickets
  const activeTicketsCount = tickets?.filter(t => t.status !== "selesai" && t.status !== "ditolak").length || 0
  const processingTicketsCount = tickets?.filter(t => t.status === "diproses").length || 0
  const completedTicketsCount = tickets?.filter(t => t.status === "selesai").length || 0

  // Get the most relevant order to display
  const currentOrder = orders?.find(o => o.status === "aktif" || o.status === "dibayar" || o.status === "pending" || o.status === "suspend") || null
  const latestPendingOrder = pendingOrders.length > 0 ? pendingOrders[0] : null

  // Choose which bill to display for quick payment
  const activePayment = latestPendingOrder 
    ? {
        type: 'order',
        id: latestPendingOrder.id,
        nama: latestPendingOrder.paket.nama,
        kecepatan: latestPendingOrder.paket.kecepatan,
        invoiceNo: `ORD-${String(latestPendingOrder.id).padStart(3, '0')}`,
        total: latestPendingOrder.total_harga
      }
    : latestUnpaidBilling 
      ? {
          type: 'billing',
          id: latestUnpaidBilling.id,
          nama: latestUnpaidBilling.order?.paket?.nama || currentOrder?.paket?.nama || 'Layanan WiFi',
          kecepatan: latestUnpaidBilling.order?.paket?.kecepatan || currentOrder?.paket?.kecepatan || 0,
          invoiceNo: `INV-${String(latestUnpaidBilling.id).padStart(3, '0')}`,
          total: latestUnpaidBilling.jumlah_tagihan
        }
      : null;

  const { data: myTestimonial } = useMyTestimonial()
  const submitTestimonial = useSubmitTestimonial()
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [roleText, setRoleText] = useState("")
  const [isTestiEditing, setIsTestiEditing] = useState(false)

  useEffect(() => {
    if (myTestimonial) {
      setRating(myTestimonial.rating || 5)
      setContent(myTestimonial.content || "")
      setRoleText(myTestimonial.role || "")
    }
  }, [myTestimonial])

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitTestimonial.mutate({ rating, content, role: roleText }, {
      onSuccess: () => {
        setIsTestiEditing(false)
        alert("Terima kasih! Ulasan Anda berhasil dikirim.")
      }
    })
  }


  const { isReady: isMidtransReady } = useMidtrans()
  const [isPaying, setIsPaying] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'va'|'qris'>('va')

  const handlePayment = async (id: number, isOrder = true) => {
    try {
      setIsPaying(true)
      const res = await api.post(isOrder ? `/orders/${id}/pay` : `/billings/${id}/pay`)
      const snapToken = res.data.snap_token

      // @ts-ignore
      window.snap.pay(snapToken, {
        onSuccess: async function () {
          try {
            await api.post(isOrder ? `/orders/${id}/demo-pay-success` : `/billings/${id}/demo-pay-success`)
          } catch (e) {
            console.error(e)
          }
          alert("Pembayaran berhasil!");
          refetchOrders();
          refetchBillings();
          refetchTraffic();
        },
        onPending: function () {
          alert("Menunggu pembayaran Anda!");
          refetchOrders();
          refetchBillings();
        },
        onError: function () {
          alert("Pembayaran gagal!");
        },
        onClose: function () {
          console.log('Popup ditutup');
        }
      })
    } catch (error) {
      console.error(error)
      alert("Gagal memproses pembayaran. Pastikan Midtrans Key sudah diset di .env")
    } finally {
      setIsPaying(false)
    }
  }

  // Helper for currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Helper for date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Center / Main Column */}
      <div className="flex-1 space-y-8">

        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Ringkasan Layanan</h2>
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                {pendingCount} tagihan menunggu
              </span>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Paket Internet */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Wifi className="w-4 h-4" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-500">Paket Saat Ini</h3>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {currentOrder ? `${currentOrder.paket.kecepatan} Mbps` : 'Belum Ada'}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[13px] font-medium text-slate-500">
                  {currentOrder ? currentOrder.paket.nama : 'Status Layanan'}
                </span>
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${
                    currentOrder?.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 
                    currentOrder?.status === 'dibayar' ? 'bg-blue-50 text-blue-600' : 
                    currentOrder?.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                    currentOrder?.status === 'suspend' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {currentOrder?.status === 'aktif' ? 'Aktif' : 
                   currentOrder?.status === 'dibayar' ? 'Menunggu Pemasangan' : 
                   currentOrder?.status === 'pending' ? 'Menunggu Pembayaran' : 
                   currentOrder?.status === 'suspend' ? 'Terisolir (Belum Bayar)' : 'Tidak Aktif'}
                </span>
              </div>
            </div>

            {/* Tagihan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${activePayment ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-500">Tagihan Bulan Ini</h3>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {activePayment ? formatRupiah(activePayment.total) : 'Rp0'}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                {activePayment ? (
                  <>
                    <span className="text-[12px] font-bold text-orange-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Belum Dibayar
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Semua Lunas
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">Terima kasih!</span>
                  </>
                )}
              </div>
            </div>

            {/* Penggunaan Data (Connected to mock backend) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-500">Total Traffic</h3>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {traffic?.total || 0} <span className="text-xl font-semibold text-slate-400">GB</span>
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Download</p>
                  <p className="text-[14px] font-bold text-slate-700 mt-0.5">{traffic?.download || 0} GB</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upload</p>
                  <p className="text-[14px] font-bold text-slate-700 mt-0.5">{traffic?.upload || 0} GB</p>
                </div>
              </div>
            </div>

            {/* Tiket Aktif (Connected to backend) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                  <Ticket className="w-4 h-4" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-500">Tiket Aktif</h3>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{activeTicketsCount}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diproses</p>
                  <p className="text-[14px] font-bold text-yellow-600 mt-0.5">{processingTicketsCount} Tiket</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selesai</p>
                  <p className="text-[14px] font-bold text-teal-600 mt-0.5">{completedTicketsCount} Tiket</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Router Status Section */}
          <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-500" />
                Status Perangkat (ONT/Router Pelanggan)
              </h3>
              {currentOrder?.status === 'aktif' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              ) : currentOrder?.status === 'dibayar' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Menunggu Pemasangan
                </span>
              ) : currentOrder?.status === 'pending' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Menunggu Pembayaran
                </span>
              ) : currentOrder?.status === 'suspend' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Terisolir
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Offline
                </span>
              )}
            </div>

            {currentOrder?.status === 'aktif' || currentOrder?.status === 'suspend' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</p>
                  <p className="text-sm font-bold text-slate-700 font-mono">
                    {currentOrder.ip_address || "10.10." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uptime</p>
                  <p className="text-sm font-bold text-slate-700">
                    {currentOrder.status === 'aktif' ? "14d 3h 22m" : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kualitas Sinyal</p>
                  <p className={`text-sm font-bold ${currentOrder.status === 'aktif' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {currentOrder.status === 'aktif' ? "-18 dBm (Sangat Baik)" : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Perangkat</p>
                  <p className="text-sm font-bold text-slate-700">
                    {currentOrder.tipe_perangkat || "FiberHome HG6243C"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center">
                <Wifi className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-600 mb-1">Perangkat Belum Terpasang</p>
                <p className="text-xs text-slate-500 max-w-sm">Status Anda saat ini sedang dalam antrean jadwal pemasangan. Informasi perangkat akan muncul di sini setelah teknisi selesai memasang koneksi di lokasi Anda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Riwayat Pembayaran Table */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-extrabold text-slate-800">Riwayat Pembayaran</h3>
            <Link to="/dashboard/orders" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">Lihat Semua &rarr;</Link>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${order.status === 'pending' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            <CreditCard className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">INV-{String(order.id).padStart(3, '0')}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate max-w-[120px] sm:max-w-none">
                              {order.paket.nama}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{formatDate(order.created_at)}</td>
                      <td className="p-4">
                        {order.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100/50">
                            <Clock className="w-3.5 h-3.5" />
                            Menunggu
                          </span>
                        )}
                        {order.status === 'dibayar' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100/50">
                            <Clock className="w-3.5 h-3.5" />
                            Menunggu Pemasangan
                          </span>
                        )}
                        {(order.status === 'aktif' || order.status === 'selesai') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-600 border border-green-100/50">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Berhasil
                          </span>
                        )}
                        {order.status === 'suspend' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100/50">
                            <XCircle className="w-3.5 h-3.5" />
                            Terisolir
                          </span>
                        )}
                        {order.status === 'ditolak' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100/50">
                            <XCircle className="w-3.5 h-3.5" />
                            Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right font-extrabold text-slate-800">{formatRupiah(order.total_harga)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Belum ada riwayat pesanan atau pembayaran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ulasan & Testimoni */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-extrabold text-slate-800">Ulasan Anda</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 p-6">
            {!myTestimonial || isTestiEditing ? (
              <form onSubmit={handleTestimonialSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Penilaian Bintang</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 transition-transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        <Star className="w-8 h-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pekerjaan / Status (Opsional)</label>
                  <p className="text-xs text-slate-400 mb-2">
                    Misal: <em>Pengusaha Cafe, Guru SD, Mahasiswa</em>. Biarkan kosong untuk menggunakan otomatisasi paket & lokasi Anda.
                  </p>
                  <input
                    type="text"
                    value={roleText}
                    onChange={(e) => setRoleText(e.target.value)}
                    placeholder="Contoh: Pengusaha Cafe Purwodadi (Biarkan kosong untuk otomatisasi)"
                    className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pengalaman Anda</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Ceritakan pengalaman Anda menggunakan layanan kami..."
                    className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                    rows={4}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  {myTestimonial && isTestiEditing && (
                    <button
                      type="button"
                      onClick={() => setIsTestiEditing(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitTestimonial.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {submitTestimonial.isPending ? 'Mengirim...' : 'Kirim Ulasan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-100">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < myTestimonial.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    {myTestimonial.is_published ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200/50">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         Telah Ditayangkan
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200/50">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         Terima kasih atas ulasan Anda!
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="relative bg-white border border-slate-100 rounded-xl p-4 mb-4">
                   <Quote className="w-6 h-6 text-blue-200 absolute -top-3 left-4 bg-slate-50 px-1" />
                   <p className="text-slate-700 text-[14px] leading-relaxed font-medium italic relative z-10 mt-1">
                      "{myTestimonial.content}"
                   </p>
                </div>
                
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      setRating(myTestimonial.rating)
                      setContent(myTestimonial.content)
                      setIsTestiEditing(true)
                    }}
                    className="flex items-center gap-2 text-[12px] font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    Edit Ulasan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Column / Quick Transactions */}
      <div className="w-full xl:w-[320px] shrink-0 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden">

          <div className="mb-6">
            <h3 className="text-[15px] font-extrabold text-slate-800">Pembayaran Cepat</h3>
          </div>

          <div className="space-y-3 mb-7 relative z-10">
            <label 
              onClick={() => setPaymentMethod('va')}
              className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors shadow-sm ${paymentMethod === 'va' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="pt-1">
                <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === 'va' ? 'border-[5px] border-blue-600 bg-white' : 'border-slate-300'}`}></div>
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800">Virtual Account / Transfer</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1.5 leading-relaxed">Verifikasi otomatis, dari berbagai bank.</p>
              </div>
            </label>

            <label 
              onClick={() => setPaymentMethod('qris')}
              className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors shadow-sm ${paymentMethod === 'qris' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="pt-1">
                <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === 'qris' ? 'border-[5px] border-blue-600 bg-white' : 'border-slate-300'}`}></div>
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800">QRIS / GoPay</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1.5 leading-relaxed">Scan QR dengan dompet digital pilihan Anda.</p>
              </div>
            </label>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Rincian Langganan</h4>

            {activePayment || currentOrder ? (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200/60">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Zap className="w-4 h-4" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">
                        {activePayment ? activePayment.nama : currentOrder?.paket.nama}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {activePayment ? activePayment.invoiceNo : `INV-${String(currentOrder?.id).padStart(3, '0')}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-medium text-slate-600">Kecepatan stabil {activePayment ? activePayment.kecepatan : currentOrder?.paket.kecepatan} Mbps</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-medium text-slate-600">Akses internet Unlimited tanpa FUP</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-[13px] font-extrabold text-slate-800">Total Tagihan</span>
                  <span className="text-lg font-extrabold text-orange-500">
                    {formatRupiah(activePayment ? activePayment.total : 0)}
                  </span>
                </div>

                {activePayment ? (
                  <button
                    onClick={() => handlePayment(activePayment.id, activePayment.type === 'order')}
                    disabled={isPaying || !isMidtransReady}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
                    {!isMidtransReady ? "Memuat Gateway..." : isPaying ? "Memproses..." : "Lanjutkan Pembayaran"}
                  </button>
                ) : (
                  <button className="w-full bg-slate-100 text-slate-400 font-bold py-3.5 rounded-xl transition-all cursor-not-allowed">
                    Tidak Ada Tagihan Aktif
                  </button>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-slate-500 text-sm">
                Belum ada paket aktif atau tagihan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
