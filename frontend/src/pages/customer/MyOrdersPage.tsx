import { useState } from "react"
import { Link } from "react-router-dom"
import { useMyOrders } from "../../hooks/useOrders"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../../services/api"
import { CreditCard, CalendarDays, MapPin, Wifi, CheckCircle2, AlertCircle, Loader2, FileText, ArrowRight } from "lucide-react"
import { useMidtrans } from "../../hooks/useMidtrans"

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka)
}

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending:  { label: "Menunggu Pembayaran", bg: "bg-orange-50", text: "text-orange-600", icon: AlertCircle },
  dibayar:  { label: "Menunggu Pemasangan", bg: "bg-blue-50", text: "text-blue-600", icon: AlertCircle },
  aktif:    { label: "Layanan Aktif", bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
  ditolak:  { label: "Dibatalkan", bg: "bg-red-50", text: "text-red-600", icon: AlertCircle },
  selesai:  { label: "Selesai / Berakhir", bg: "bg-slate-100", text: "text-slate-600", icon: FileText },
}

export function MyOrdersPage() {
  const { data: orders, isLoading } = useMyOrders()
  const { isReady: isMidtransReady } = useMidtrans()
  const queryClient = useQueryClient()
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null)

  const payMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await api.post(`/orders/${orderId}/pay`);
      return res.data;
    },
    onSuccess: (data, orderId) => {
      if ((window as any).snap) {
        (window as any).snap.pay(data.snap_token, {
          onSuccess: async function() {
             try {
               await api.post(`/orders/${orderId}/demo-pay-success`);
             } catch (e) {
               console.error(e);
             }
             alert("Pembayaran berhasil!");
             queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          },
          onPending: function() {
             queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          },
          onError: function() {
             alert("Pembayaran gagal!");
          },
          onClose: function() {
             queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          }
        });
      } else {
        alert("Sistem pembayaran sedang tidak tersedia. Harap muat ulang halaman.");
      }
    },
    onError: (err: any) => {
      alert("Gagal memproses pembayaran: " + (err.response?.data?.message || err.message));
    },
    onSettled: () => {
      setPayingOrderId(null)
    }
  })

  const handlePay = (orderId: number) => {
    setPayingOrderId(orderId)
    payMutation.mutate(orderId)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan Saya</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Riwayat layanan internet dan pembayaran Anda</p>
        </div>
        <Link
          to="/dashboard/services"
          className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-[13px] transition-all shadow-[0_4px_15px_-3px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_-3px_rgba(37,99,235,0.5)] active:scale-95"
        >
          <Wifi className="w-4 h-4" />
          <span>Pasang Internet Baru</span>
        </Link>
      </div>

      <div className="space-y-6">
        {isLoading && (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 h-48 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && orders?.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Tagihan</h3>
            <p className="text-slate-500 text-[15px] max-w-md mb-8">Anda belum memiliki pesanan paket internet. Jelajahi pilihan paket kami dan nikmati koneksi tanpa batas.</p>
            <Link to="/dashboard/services" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-[15px] font-bold transition-all shadow-[0_4px_15px_-3px_rgba(0,0,0,0.3)] active:scale-95">
              Lihat Paket Internet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="grid gap-6">
          {orders?.map((order) => {
            const status = statusConfig[order.status] || statusConfig['pending'];
            const StatusIcon = status.icon;
            const isPending = order.status === 'pending';

            return (
              <div key={order.id} className="bg-white rounded-[24px] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] group">
                {/* Header Card */}
                <div className="border-b border-slate-100 p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner text-white">
                         <Wifi className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">INV-{String(order.id).padStart(4, '0')}</p>
                         <h3 className="text-[16px] font-bold text-slate-800">{order.paket?.nama || "Paket Dihapus"} <span className="text-[13px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ml-2">{order.paket?.kecepatan} Mbps</span></h3>
                      </div>
                   </div>
                   <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} ${status.text} border border-current/10 w-fit`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-bold">{status.label}</span>
                   </div>
                </div>

                {/* Body Card */}
                <div className="p-6 sm:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     
                     {/* Info List */}
                     <div className="md:col-span-2 space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                              <MapPin className="w-4 h-4 text-slate-400" />
                           </div>
                           <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lokasi Pemasangan</p>
                              <p className="text-[14px] font-semibold text-slate-700 leading-relaxed">{order.alamat?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()}</p>
                           </div>
                        </div>

                        {order.catatan && (
                           <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                 <FileText className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan</p>
                                 <p className="text-[14px] font-semibold text-slate-700 leading-relaxed">{order.catatan}</p>
                              </div>
                           </div>
                        )}

                        {order.status === 'aktif' && order.tanggal_mulai && (
                           <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                 <CalendarDays className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Periode Aktif Layanan</p>
                                 <div className="flex items-center gap-2 text-[14px] font-bold text-slate-700">
                                    <span className="text-emerald-600">{formatDate(order.tanggal_mulai)}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                    <span>{formatDate(order.tanggal_selesai)}</span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Payment Summary */}
                     <div className="flex flex-col justify-between bg-gradient-to-b from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200/50">
                        <div>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tagihan</p>
                           <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatRupiah(order.total_harga)}</p>
                           <p className="text-[12px] font-medium text-slate-500 mt-2 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Sudah termasuk PPN 11%</p>
                        </div>
                        
                        {isPending && (
                           <div className="mt-6 pt-6 border-t border-slate-200/60">
                              <button 
                                 onClick={() => handlePay(order.id)}
                                 disabled={payingOrderId === order.id || !isMidtransReady}
                                 className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.2)] transition-all active:scale-95 text-[14px]"
                              >
                                 {payingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                 {!isMidtransReady ? "Memuat Gateway..." : payingOrderId === order.id ? "Memproses..." : "Bayar Sekarang"}
                              </button>
                           </div>
                        )}
                     </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
