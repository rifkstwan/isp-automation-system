import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Clock, Wrench, CheckCircle2, AlertTriangle, AlertCircle, Info, Ticket as TicketIcon, Plus, X } from "lucide-react"
import api from "../../services/api"

type Ticket = {
  id: number
  judul: string
  deskripsi: string
  prioritas: "rendah" | "sedang" | "tinggi"
  status: "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "ditolak"
  foto: string | null
  created_at: string
  user: {
    id?: number
    name: string
    email: string
    phone?: string
    address?: string
  }
}

import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

const statusConfig = {
  menunggu:    { label: "Menunggu",    color: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock },
  diproses:    { label: "Diproses",    color: "bg-blue-100 text-blue-700 border-blue-200",     icon: Wrench },
  dijadwalkan: { label: "Dijadwalkan", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Clock },
  selesai:     { label: "Selesai",     color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  ditolak:     { label: "Ditolak",     color: "bg-red-100 text-red-700 border-red-200",         icon: AlertTriangle },
}

const prioritasConfig = {
  rendah: { label: "Rendah", color: "text-blue-500 bg-blue-50", icon: Info },
  sedang: { label: "Sedang", color: "text-amber-500 bg-amber-50", icon: AlertCircle },
  tinggi: { label: "Tinggi", color: "text-red-500 bg-red-50", icon: AlertTriangle },
}

export function AdminTicketsPage() {
  const getStorageUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost';
    return `${baseUrl}/storage/${path}`;
  }

  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("semua")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})

  const [isProactiveModalOpen, setIsProactiveModalOpen] = useState(false)
  const [proactiveData, setProactiveData] = useState({ user_id: "", judul: "Deteksi Otomatis NOC: Router Offline", deskripsi: "Sistem mendeteksi bahwa koneksi pada router pelanggan terputus (Offline). Mohon segera tindak lanjuti." })

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const res = await api.get("/admin/users")
      // Filter for customers. `roles` is an array of strings.
      return res.data.filter((u: any) => u.roles.includes('customer'))
    },
  })

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const res = await api.get("/admin/tickets")
      return res.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await api.patch(`/admin/tickets/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
    },
  })

  const createProactiveTicket = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/admin/tickets`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
      setIsProactiveModalOpen(false)
      setProactiveData({ user_id: "", judul: "Deteksi Otomatis NOC: Router Offline", deskripsi: "Sistem mendeteksi bahwa koneksi pada router pelanggan terputus (Offline). Mohon segera tindak lanjuti." })
    },
  })

  const handleCreateProactive = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proactiveData.user_id) return
    createProactiveTicket.mutate({ ...proactiveData, prioritas: 'tinggi' })
  }

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString().includes(searchTerm)
      
    const matchesStatus = filterStatus === "semua" || t.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tiket Gangguan</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau dan tindak lanjuti laporan kendala dari pelanggan.</p>
        </div>
        <button 
          onClick={() => setIsProactiveModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Buat Tiket Proaktif
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari keluhan atau nama pelanggan..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="semua">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="diproses">Sedang Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Grid Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Memuat laporan pelanggan...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <TicketIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tidak ada keluhan</h3>
          <p className="text-slate-500 text-sm mt-1">Bagus! Semua koneksi pelanggan berjalan lancar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const PrioIcon = prioritasConfig[ticket.prioritas].icon
            const StatIcon = statusConfig[ticket.status].icon

            return (
              <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${prioritasConfig[ticket.prioritas].color}`}>
                      <PrioIcon className="w-3.5 h-3.5" />
                      Prioritas {ticket.prioritas}
                    </span>
                    <span className="text-xs font-bold text-slate-400">#TKT-{ticket.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{ticket.judul}</h3>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Dilaporkan oleh: <span className="text-indigo-600">{ticket.user.name}</span></p>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-4 flex-1 whitespace-pre-wrap border border-slate-100/50 shadow-inner">
                    {ticket.deskripsi}
                  </div>
                  
                  {ticket.foto && (
                    <button 
                      onClick={() => setSelectedImage(getStorageUrl(ticket.foto!))}
                      className="w-full text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2"
                    >
                      Lihat Foto Bukti Keluhan
                    </button>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-4 border-t border-slate-100 pt-4">
                    <span>Waktu Keluhan:</span>
                    <span>{new Date(ticket.created_at).toLocaleString('id-ID')}</span>
                  </div>

                  {/* Actions & Status */}
                  <div className="mt-auto space-y-2">
                    <button
                      onClick={() => {
                        setWaRecipient({
                          name: ticket.user.name,
                          phone: ticket.user.phone || "",
                          address: ticket.user.address || "",
                          code: String(ticket.id),
                          notes: ticket.judul,
                          type: "ticket"
                        })
                        setWaModalOpen(true)
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Hubungi Pelanggan via WA
                    </button>
                    {ticket.status === 'selesai' ? (
                      <div className="w-full py-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" /> Keluhan Selesai Diatasi
                      </div>
                    ) : ticket.status === 'ditolak' ? (
                      <div className="w-full py-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center gap-2 text-red-600 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5" /> Tiket Ditolak
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {ticket.status === 'menunggu' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: ticket.id, status: 'diproses' })}
                            disabled={updateStatus.isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors disabled:opacity-50"
                          >
                            <Wrench className="w-4 h-4" /> Tandai Diproses
                          </button>
                        )}
                        {(ticket.status === 'diproses' || ticket.status === 'dijadwalkan') && (
                          <button
                            onClick={() => updateStatus.mutate({ id: ticket.id, status: 'selesai' })}
                            disabled={updateStatus.isPending}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Selesaikan Laporan
                          </button>
                        )}
                        <div className={`shrink-0 px-4 py-3 rounded-xl flex items-center justify-center border ${statusConfig[ticket.status].color}`}>
                          <StatIcon className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <img src={selectedImage} alt="Bukti Kendala" className="w-full h-full object-contain" />
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md cursor-pointer hover:bg-black/70">
              Tutup (Klik Area Gelap)
            </div>
          </div>
        </div>
      )}

      {/* Proactive Ticket Modal */}
      {isProactiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Buat Tiket Proaktif</h2>
                <p className="text-xs text-slate-500 mt-1">Buatkan tiket keluhan atas nama pelanggan.</p>
              </div>
              <button onClick={() => setIsProactiveModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProactive} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pelanggan yang Mengalami Gangguan</label>
                <select
                  required
                  value={proactiveData.user_id}
                  onChange={e => setProactiveData({ ...proactiveData, user_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Judul Tiket</label>
                <input
                  required
                  type="text"
                  value={proactiveData.judul}
                  onChange={e => setProactiveData({ ...proactiveData, judul: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Deskripsi Lengkap</label>
                <textarea
                  required
                  value={proactiveData.deskripsi}
                  onChange={e => setProactiveData({ ...proactiveData, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createProactiveTicket.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createProactiveTicket.isPending ? "Menyimpan..." : "Buat Tiket (Prioritas Tinggi)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WhatsApp Template Modal */}
      <WhatsAppTemplateModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        role="admin"
        recipient={waRecipient}
      />
    </div>
  )
}
