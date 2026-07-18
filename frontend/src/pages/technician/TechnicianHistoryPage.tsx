import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { History, Wrench, Package, Calendar } from "lucide-react"
import api from "../../services/api"

export function TechnicianHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<'semua' | 'instalasi' | 'gangguan'>('semua')

  const { data: rawHistory = [], isLoading } = useQuery<any[]>({
    queryKey: ["technician-history"],
    queryFn: async () => {
      const res = await api.get("/technician/history")
      return res.data
    },
    refetchInterval: 5000,
  })

  const historyItems = rawHistory.map((item: any) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    customer: item.customer || 'Pelanggan',
    category: item.category,
    date: new Date(item.updated_at),
    icon: item.category === 'instalasi' ? Package : Wrench,
    colorClass: item.category === 'instalasi' ? 'text-blue-500 bg-blue-50' : 'text-amber-500 bg-amber-50',
    badgeClass: item.category === 'instalasi' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
  }))

  const filteredItems = historyItems.filter((item) => {
    if (activeFilter === 'instalasi') return item.category === 'instalasi'
    if (activeFilter === 'gangguan') return item.category === 'gangguan'
    return true
  })

  const countInstalasi = historyItems.filter(i => i.category === 'instalasi').length
  const countGangguan = historyItems.filter(i => i.category === 'gangguan').length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Pekerjaan</h1>
          <p className="text-sm text-slate-500 mt-1">Rekam jejak seluruh instalasi dan perbaikan yang telah Anda selesaikan.</p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveFilter('semua')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'semua' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({historyItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('instalasi')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'instalasi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Instalasi Baru ({countInstalasi})
          </button>
          <button
            onClick={() => setActiveFilter('gangguan')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'gangguan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Tiket Gangguan ({countGangguan})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Menarik data riwayat...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Belum Ada Riwayat</h3>
          <p className="text-slate-500 text-sm mt-1">
            {activeFilter === 'semua' ? 'Anda belum menyelesaikan tugas instalasi atau perbaikan apapun.' :
             activeFilter === 'instalasi' ? 'Belum ada riwayat instalasi baru yang selesai.' :
             'Belum ada riwayat tiket gangguan yang selesai.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item, index) => (
              <div key={index} className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.colorClass}`}>
                   <item.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                      <h4 className="text-base font-bold text-slate-900 truncate">{item.title}</h4>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-auto ${item.badgeClass}`}>
                         {item.type}
                      </span>
                   </div>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                         <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                            {item.customer.charAt(0)}
                         </div>
                         {item.customer}
                      </span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="font-mono text-xs font-semibold text-slate-400">{item.id}</span>
                   </div>
                </div>

                {/* Date / Timestamp */}
                <div className="shrink-0 text-left sm:text-right">
                   <div className="flex items-center gap-1.5 text-slate-500 sm:justify-end mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-bold text-slate-700">
                         {item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                   </div>
                   <p className="text-xs font-medium text-slate-400 sm:pr-1">
                      Pukul {item.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                   </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
