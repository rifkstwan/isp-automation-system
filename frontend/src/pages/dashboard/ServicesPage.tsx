import { useState } from "react"
import { Link } from "react-router-dom"
import { useMyOrders } from "../../hooks/useOrders"
import { useSchedules } from "../../hooks/useSchedules"
import { Globe, MapPin, CheckCircle2, AlertCircle, Cpu, Zap, Activity, ArrowRight, ShieldCheck, Server, X } from "lucide-react"
import { OrderPage } from "../customer/OrderPage"
import api from "../../services/api"

export function ServicesPage() {
  const { data: orders, refetch } = useMyOrders()
  const { data: schedules } = useSchedules()
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [pakets, setPakets] = useState<any[]>([])
  const [selectedPaketId, setSelectedPaketId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Find the active order
  const activeOrder = orders?.find((o) => o.status === "aktif")
  const paidOrder = orders?.find((o) => o.status === "dibayar")
  const pendingOrder = orders?.find((o) => o.status === "pending")
  const suspendOrder = orders?.find((o) => o.status === "suspend")
  const currentService = activeOrder || paidOrder || pendingOrder || suspendOrder

  // Check if there's a pending upgrade request for this order
  const pendingUpgrade = currentService?.upgrade_requests && currentService.upgrade_requests.length > 0 
    ? currentService.upgrade_requests[0] 
    : null

  // Find latest schedule to determine technician
  const latestSchedule = schedules && schedules.length > 0 
    ? schedules.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  }

  const handleOpenUpgrade = async () => {
    if (pendingUpgrade) return // Already pending
    setShowUpgradeModal(true)
    try {
      const res = await api.get("/pakets")
      // Filter out current package and inactive packages
      const available = res.data.filter((p: any) => p.is_aktif && p.id !== currentService?.paket_id)
      setPakets(available)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmitUpgrade = async () => {
    if (!selectedPaketId || !currentService) return
    setIsSubmitting(true)
    try {
      await api.post(`/orders/${currentService.id}/upgrade`, {
        new_paket_id: selectedPaketId
      })
      alert("Permintaan upgrade berhasil dikirim. Menunggu persetujuan admin.")
      setShowUpgradeModal(false)
      refetch() // Refresh order data
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || "Gagal mengirim permintaan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!orders) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!currentService) {
    return <OrderPage />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return {
          label: 'Aktif & Terkoneksi',
          className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        }
      case 'dibayar':
        return {
          label: 'Menunggu Pemasangan',
          className: 'bg-blue-50 text-blue-600 border-blue-100',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        }
      case 'pending':
        return {
          label: 'Menunggu Pembayaran',
          className: 'bg-amber-50 text-amber-600 border-amber-100',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        }
      case 'suspend':
        return {
          label: 'Layanan Diisolir',
          className: 'bg-red-50 text-red-600 border-red-100',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        }
      default:
        return {
          label: status.toUpperCase(),
          className: 'bg-slate-50 text-slate-600 border-slate-100',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        }
    }
  }

  const badge = getStatusBadge(currentService.status)

  return (
    <div className="max-w-6xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Layanan Saya</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola spesifikasi teknis dan detail pemasangan internet Anda.</p>
        </div>
      </div>

      {/* Hero Service Banner (Modern & Simple) */}
      <div className="bg-gradient-to-br from-slate-100 to-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-200/50 to-transparent rounded-bl-full z-0 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2.5 py-1 text-[11px] font-extrabold tracking-wider uppercase rounded-md border flex items-center gap-1.5 ${badge.className}`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-extrabold tracking-wider uppercase rounded-md bg-slate-50 border border-slate-200 text-slate-500">
                    ID: #SRV-{String(currentService.id).padStart(4, '0')}
                  </span>
               </div>
               
               <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                 {currentService.paket.kecepatan} <span className="text-2xl text-slate-400">Mbps</span>
               </h2>
               <p className="text-sm font-bold text-slate-500">{currentService.paket.nama} — Akses Internet Tanpa Batas</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 w-full lg:w-72">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tagihan Bulanan</p>
               <p className="text-2xl font-extrabold text-slate-800">{formatRupiah(currentService.paket.harga)}</p>
               <Link to="/dashboard/billing" className="mt-4 w-full py-2.5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-colors bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600 shadow-sm">
                 Lihat Tagihan <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Spesifikasi Teknis */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
             <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
               <Server className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-[15px] font-extrabold text-slate-800">Spesifikasi Teknis</h3>
               <p className="text-[12px] font-medium text-slate-500">Konfigurasi jaringan perangkat Anda</p>
             </div>
          </div>
          <div className="p-6 space-y-5">
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500 flex items-center gap-2"><Cpu className="w-4 h-4 text-slate-400"/> Kecepatan Maksimal</span>
                <span className="text-[14px] font-extrabold text-slate-800">{currentService.paket.kecepatan} Mbps</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500 flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400"/> IP Address</span>
                <span className="text-[14px] font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{currentService.ip_address || "Menunggu Konfigurasi"}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-slate-400"/> FUP (Batas Wajar)</span>
                <span className="text-[14px] font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{currentService.paket.fup || "Tanpa Batas (Unlimited)"}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500 flex items-center gap-2"><Zap className="w-4 h-4 text-slate-400"/> Tipe Perangkat</span>
                <span className="text-[14px] font-extrabold text-slate-800">{currentService.tipe_perangkat || "Menunggu Pemasangan"}</span>
             </div>
          </div>
        </div>

        {/* Detail Pemasangan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
             <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
               <MapPin className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-[15px] font-extrabold text-slate-800">Detail Lokasi & Teknisi</h3>
               <p className="text-[12px] font-medium text-slate-500">Informasi alamat dan penanggung jawab</p>
             </div>
          </div>
          <div className="p-6 space-y-5">
             <div className="flex flex-col gap-2 pb-4 border-b border-slate-50">
                <span className="text-[13px] font-bold text-slate-500">Alamat Pemasangan</span>
                <span className="text-[14px] font-extrabold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {currentService.alamat?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()}
                </span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500">Tanggal Order</span>
                <span className="text-[14px] font-extrabold text-slate-800">
                  {formatDate(currentService.created_at)}
                </span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500">Teknisi Penanggung Jawab</span>
                <span className="text-[14px] font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100/50">
                  {latestSchedule ? latestSchedule.nama_teknisi : "Menunggu Penugasan"}
                </span>
             </div>
          </div>
        </div>

      </div>

      {/* Quick Actions (Interactive portion) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
         <h3 className="text-[15px] font-extrabold text-slate-800 mb-5">Aksi Layanan</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {currentService.status === 'aktif' ? (
               <Link to="/dashboard/tickets" className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                     <Activity className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-[14px] font-bold text-slate-800">Lapor Gangguan</h4>
                     <p className="text-[12px] font-medium text-slate-500 mt-0.5">Internet lambat atau mati? Buat tiket laporan ke teknisi.</p>
                  </div>
               </Link>
             ) : (
               <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                     <Activity className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-[14px] font-bold text-slate-800">Lapor Gangguan</h4>
                     <p className="text-[12px] font-medium text-slate-500 mt-0.5">Tersedia setelah layanan terpasang & aktif oleh teknisi.</p>
                  </div>
               </div>
             )}
            
            <button 
               onClick={handleOpenUpgrade} 
               disabled={pendingUpgrade !== null || currentService.status !== 'aktif'}
               className={`flex items-center gap-4 p-4 rounded-xl border transition-all group text-left
                 ${pendingUpgrade || currentService.status !== 'aktif' ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed' : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50/50'}
               `}>
               <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform
                 ${pendingUpgrade || currentService.status !== 'aktif' ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 text-orange-600 group-hover:scale-110'}
               `}>
                  <Zap className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-[14px] font-bold text-slate-800">
                    {pendingUpgrade ? 'Upgrade Sedang Diproses' : 'Upgrade Paket'}
                  </h4>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                    {currentService.status !== 'aktif' 
                      ? 'Tersedia setelah layanan terpasang & aktif oleh teknisi.' 
                      : pendingUpgrade 
                        ? 'Menunggu persetujuan dari tim Admin.'
                        : 'Butuh kecepatan lebih? Ganti paket internet Anda.'}
                  </p>
               </div>
            </button>
         </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pilih Paket Baru</h3>
                <p className="text-sm text-slate-500">Pilih kecepatan internet yang Anda inginkan</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-slate-50">
              {pakets.length === 0 ? (
                <div className="text-center p-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                pakets.map(paket => (
                  <label key={paket.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPaketId === paket.id ? 'border-orange-500 bg-orange-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="upgrade_paket" 
                      className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500" 
                      checked={selectedPaketId === paket.id}
                      onChange={() => setSelectedPaketId(paket.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800">{paket.nama}</h4>
                        <span className="text-orange-600 font-extrabold">{paket.kecepatan} Mbps</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 mt-2">{formatRupiah(paket.harga)} <span className="text-xs font-normal text-slate-500">/ bulan</span></p>
                      {paket.fup && <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> FUP: {paket.fup}</p>}
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Batal</button>
              <button 
                onClick={handleSubmitUpgrade} 
                disabled={!selectedPaketId || isSubmitting}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
