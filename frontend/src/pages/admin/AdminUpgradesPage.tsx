import { useState, useEffect } from "react"
import api from "../../services/api"
import { ArrowUpCircle, CheckCircle2, XCircle } from "lucide-react"

export function AdminUpgradesPage() {
  const [upgrades, setUpgrades] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUpgrades()
  }, [])

  const fetchUpgrades = async () => {
    try {
      const res = await api.get("/admin/upgrades")
      setUpgrades(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcess = async (id: number, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} permintaan ini?`)) {
      return
    }

    try {
      await api.patch(`/admin/upgrades/${id}/status`, { status, admin_catatan: '' })
      fetchUpgrades() // refresh data
    } catch (err) {
      console.error(err)
      alert("Gagal memproses permintaan.")
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Permintaan Upgrade</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola permohonan mutasi / ganti paket internet dari pelanggan.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Perubahan Paket</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {upgrades.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-500">{formatDate(req.created_at)}</td>
                  <td className="p-4 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      <img src={req.user.avatar_url || `https://ui-avatars.com/api/?name=${req.user.name}&background=f1f5f9&color=0f172a&bold=true`} className="w-8 h-8 rounded-full" alt="avatar" />
                      <div>
                        <p>{req.user.name}</p>
                        <p className="text-[11px] text-slate-400">Order #{req.order_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 line-through">
                          {req.old_paket?.nama} ({req.old_paket?.kecepatan}Mbps) - {formatRupiah(req.old_paket?.harga || 0)}
                        </span>
                        <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          {req.new_paket?.nama} ({req.new_paket?.kecepatan}Mbps) - {formatRupiah(req.new_paket?.harga || 0)}
                        </span>
                     </div>
                  </td>
                  <td className="p-4">
                    {req.status === 'pending' && <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[11px] font-bold uppercase">Menunggu</span>}
                    {req.status === 'approved' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold uppercase">Disetujui</span>}
                    {req.status === 'rejected' && <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-md text-[11px] font-bold uppercase">Ditolak</span>}
                  </td>
                  <td className="p-4 text-right">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleProcess(req.id, 'approved')} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors tooltip" title="Setujui">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleProcess(req.id, 'rejected')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors tooltip" title="Tolak">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {upgrades.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada riwayat permintaan upgrade paket.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
