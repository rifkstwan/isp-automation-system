import { useState } from "react"
import { Search, Calendar, User, Wrench, CheckCircle2, AlertTriangle, Plus, X, Trash2, Edit } from "lucide-react"
import { useAdminSchedules, useCreateAdminSchedule, useUpdateAdminScheduleStatus, useDeleteAdminSchedule } from "../../hooks/useSchedules"
import { useAdminTickets } from "../../hooks/useTickets"
import { useTechnicianAccounts, useCreateTechnicianAccount, useDeleteTechnicianAccount, useUpdateTechnicianAccount, type TechnicianAccount } from "../../hooks/useTechnicianAccounts"
import { useQuery } from "@tanstack/react-query"
import api from "../../services/api"

const statusConfig = {
  menunggu: { label: "Menunggu", color: "bg-amber-100 text-amber-700 border-amber-200" },
  berangkat: { label: "Berangkat", color: "bg-blue-100 text-blue-700 border-blue-200" },
  pengerjaan: { label: "Pengerjaan", color: "bg-purple-100 text-purple-700 border-purple-200" },
  selesai: { label: "Selesai", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  dibatalkan: { label: "Dibatalkan", color: "bg-red-100 text-red-700 border-red-200" },
}

export function AdminTechniciansPage() {
  const [activeTab, setActiveTab] = useState<"jadwal" | "akun">("jadwal")
  
  // States for Schedule
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState("")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({ ticket_id: "", nama_teknisi: "", tanggal_kunjungan: "" })
  const [jobType, setJobType] = useState<"instalasi" | "gangguan">("instalasi")

  // States for Account
  const [accountSearchTerm, setAccountSearchTerm] = useState("")
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [accountModalMode, setAccountModalMode] = useState<"add" | "edit">("add")
  const [selectedTech, setSelectedTech] = useState<TechnicianAccount | null>(null)
  const [newAccount, setNewAccount] = useState({ name: "", email: "", phone: "", password: "" })

  // Data fetching
  const { data: schedules = [], isLoading: isLoadingSchedules } = useAdminSchedules()
  const { data: tickets = [] } = useAdminTickets()
  const { data: technicians = [], isLoading: isLoadingTechnicians } = useTechnicianAccounts()
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders-for-schedule'],
    queryFn: async () => {
      const res = await api.get('/orders')
      return res.data
    }
  })

  // Mutations
  const createSchedule = useCreateAdminSchedule()
  const updateStatus = useUpdateAdminScheduleStatus()
  const deleteSchedule = useDeleteAdminSchedule()
  const createAccount = useCreateTechnicianAccount()
  const updateAccount = useUpdateTechnicianAccount()
  const deleteAccount = useDeleteTechnicianAccount()

  // Ambil tiket & order yang belum dijadwalkan
  const pendingTickets = tickets.filter(t => 
    (t.status === "menunggu" || t.status === "diproses" || t.status === "dijadwalkan") && 
    !schedules.some((s: any) => s.ticket_id === t.id)
  )
  const activeOrders = orders.filter((o: any) => 
    (o.status === "pending" || o.status === "dibayar") && 
    !schedules.some((s: any) => s.order_id === o.id)
  )

  const filteredSchedules = schedules.filter((s: any) => {
    return s.nama_teknisi.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) || 
           s.ticket?.user?.name.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
           s.ticket?.judul.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
           s.order?.user?.name.toLowerCase().includes(scheduleSearchTerm.toLowerCase())
  })

  const filteredTechnicians = technicians.filter(t => {
    return t.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) || 
           t.email.toLowerCase().includes(accountSearchTerm.toLowerCase())
  })

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSchedule.ticket_id || !newSchedule.nama_teknisi || !newSchedule.tanggal_kunjungan) return

    let payload: any = {
      nama_teknisi: newSchedule.nama_teknisi,
      tanggal_kunjungan: newSchedule.tanggal_kunjungan
    }
    
    if (newSchedule.ticket_id.startsWith('tkt-')) {
      payload.ticket_id = parseInt(newSchedule.ticket_id.replace('tkt-', ''))
    } else if (newSchedule.ticket_id.startsWith('ord-')) {
      payload.order_id = parseInt(newSchedule.ticket_id.replace('ord-', ''))
    }

    try {
      await createSchedule.mutateAsync(payload)
      setIsScheduleModalOpen(false)
      setNewSchedule({ ticket_id: "", nama_teknisi: "", tanggal_kunjungan: "" })
    } catch (error: any) {
      console.error("Gagal membuat jadwal:", error)
      alert(error?.response?.data?.message || "Gagal membuat jadwal. Periksa form atau koneksi.")
    }
  }

  const openAddAccountModal = () => {
    setAccountModalMode("add")
    setNewAccount({ name: "", email: "", phone: "", password: "" })
    setIsAccountModalOpen(true)
  }

  const openEditAccountModal = (tech: TechnicianAccount) => {
    setAccountModalMode("edit")
    setSelectedTech(tech)
    setNewAccount({ name: tech.name, email: tech.email, phone: tech.phone || "", password: "" })
    setIsAccountModalOpen(true)
  }

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (accountModalMode === "add") {
      if (!newAccount.name || !newAccount.email || !newAccount.password) return
      createAccount.mutate(newAccount, {
        onSuccess: () => {
          setIsAccountModalOpen(false)
          setNewAccount({ name: "", email: "", phone: "", password: "" })
        },
        onError: () => {
          alert("Gagal membuat akun teknisi. Pastikan email unik dan password minimal 8 karakter.")
        }
      })
    } else {
      if (!newAccount.name || !newAccount.email || !selectedTech) return
      updateAccount.mutate({ id: selectedTech.id, ...newAccount }, {
        onSuccess: () => {
          setIsAccountModalOpen(false)
          setNewAccount({ name: "", email: "", phone: "", password: "" })
          setSelectedTech(null)
        },
        onError: () => {
          alert("Gagal mengupdate akun teknisi. Pastikan email tidak digunakan oleh akun lain.")
        }
      })
    }
  }

  const handleDeleteAccount = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus akun teknisi ini? Teknisi ini tidak akan bisa login lagi.")) {
      deleteAccount.mutate(id)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Teknisi</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola akun dan jadwal penugasan teknisi lapangan.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("jadwal")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "jadwal" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Jadwal Penugasan
        </button>
        <button
          onClick={() => setActiveTab("akun")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "akun" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <User className="w-4 h-4" />
          Akun Teknisi
        </button>
      </div>

      {/* TAB CONTENT: JADWAL */}
      {activeTab === "jadwal" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari jadwal penugasan..." 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                value={scheduleSearchTerm}
                onChange={(e) => setScheduleSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setJobType("instalasi")
                setIsScheduleModalOpen(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" /> Buat Jadwal Baru
            </button>
          </div>

          {isLoadingSchedules ? (
            <div className="text-center py-12 text-slate-400">Memuat jadwal...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Belum ada jadwal teknisi</h3>
              <p className="text-slate-500 text-sm mt-1">Buat jadwal baru untuk mulai menugaskan teknisi.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Teknisi</th>
                      <th className="px-6 py-4">Pelanggan & Keluhan</th>
                      <th className="px-6 py-4">Tanggal Kunjungan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                              <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{schedule.nama_teknisi}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{schedule.ticket?.user?.name || schedule.order?.user?.name || 'Pelanggan'}</div>
                          <div className="text-xs text-slate-500 mt-0.5 max-w-[250px] truncate">
                            {schedule.ticket ? `Perbaikan: ${schedule.ticket.judul}` : `Instalasi: ${schedule.order?.paket?.nama}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {new Date(schedule.tanggal_kunjungan).toLocaleString('id-ID', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusConfig[schedule.status as keyof typeof statusConfig]?.color}`}>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {schedule.status === 'menunggu' && (
                              <>
                                <button
                                  onClick={() => updateStatus.mutate({ id: schedule.id, status: 'selesai' })}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Tandai Selesai"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => updateStatus.mutate({ id: schedule.id, status: 'dibatalkan' })}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Batalkan"
                                >
                                  <AlertTriangle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
                                  deleteSchedule.mutate(schedule.id)
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AKUN TEKNISI */}
      {activeTab === "akun" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari akun teknisi..." 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                value={accountSearchTerm}
                onChange={(e) => setAccountSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={openAddAccountModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" /> Tambah Akun Teknisi
            </button>
          </div>

          {isLoadingTechnicians ? (
            <div className="text-center py-12 text-slate-400">Memuat data akun...</div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Belum ada akun teknisi</h3>
              <p className="text-slate-500 text-sm mt-1">Buat akun untuk mengizinkan teknisi login ke dasbor mereka.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Teknisi</th>
                      <th className="px-6 py-4">Kontak</th>
                      <th className="px-6 py-4">Terdaftar Sejak</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTechnicians.map((tech) => (
                      <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=${tech.name}&background=e0e7ff&color=4f46e5&bold=true`} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <div className="font-bold text-slate-800">{tech.name}</div>
                              <div className="text-xs font-medium text-slate-400">ID: {tech.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{tech.email}</div>
                          <div className="text-xs text-slate-500">{tech.phone || 'No Handphone belum diisi'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(tech.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditAccountModal(tech)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Akun"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(tech.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Add Schedule */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Atur Jadwal Teknisi</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Pekerjaan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setJobType("instalasi")
                      setNewSchedule({ ...newSchedule, ticket_id: "" })
                    }}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      jobType === "instalasi"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Pemasangan Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJobType("gangguan")
                      setNewSchedule({ ...newSchedule, ticket_id: "" })
                    }}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      jobType === "gangguan"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Perbaikan Gangguan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {jobType === "instalasi" ? "Pilih Pemasangan Baru" : "Pilih Tiket Gangguan"}
                </label>
                <select
                  required
                  value={newSchedule.ticket_id}
                  onChange={e => setNewSchedule({ ...newSchedule, ticket_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                >
                  <option value="">
                    {jobType === "instalasi" ? "-- Pilih Pelanggan (Pemasangan) --" : "-- Pilih Tiket Gangguan --"}
                  </option>
                  {jobType === "instalasi"
                    ? activeOrders.map((o: any) => (
                        <option key={`ord-${o.id}`} value={`ord-${o.id}`}>
                          {o.user?.name} - {o.paket?.nama} ({o.alamat})
                        </option>
                      ))
                    : pendingTickets.map((t: any) => (
                        <option key={`tkt-${t.id}`} value={`tkt-${t.id}`}>
                          {t.user?.name} - {t.judul}
                        </option>
                      ))}
                </select>
                {jobType === "instalasi" && activeOrders.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">Tidak ada antrean pemasangan baru saat ini.</p>
                )}
                {jobType === "gangguan" && pendingTickets.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">Tidak ada laporan gangguan yang belum ditugaskan.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Teknisi Penanggung Jawab</label>
                <select
                  required
                  value={newSchedule.nama_teknisi}
                  onChange={e => setNewSchedule({ ...newSchedule, nama_teknisi: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">-- Pilih Teknisi --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                {technicians.length === 0 && <p className="text-xs text-red-500 mt-1">Belum ada akun teknisi. Buat akun teknisi terlebih dahulu.</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal & Jam Kunjungan</label>
                <input
                  required
                  type="datetime-local"
                  value={newSchedule.tanggal_kunjungan}
                  onChange={e => setNewSchedule({ ...newSchedule, tanggal_kunjungan: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createSchedule.isPending || !newSchedule.ticket_id || !newSchedule.nama_teknisi}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createSchedule.isPending ? "Menyimpan..." : "Tugaskan Teknisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Technician Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {accountModalMode === "add" ? "Tambah Akun Teknisi Baru" : "Edit Akun Teknisi"}
              </h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap Teknisi</label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Alamat Email (Untuk Login)</label>
                <input
                  required
                  type="email"
                  placeholder="budi@cvcitramandiri.com"
                  value={newAccount.email}
                  onChange={e => setNewAccount({ ...newAccount, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">No. Handphone (Opsional)</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={newAccount.phone}
                  onChange={e => setNewAccount({ ...newAccount, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Password Login {accountModalMode === "edit" && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  required={accountModalMode === "add"}
                  type="password"
                  placeholder={accountModalMode === "add" ? "Minimal 8 karakter" : "Ketik untuk mengganti password baru"}
                  value={newAccount.password}
                  onChange={e => setNewAccount({ ...newAccount, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button
                  type="submit"
                  disabled={accountModalMode === "add" ? createAccount.isPending : updateAccount.isPending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {accountModalMode === "add" 
                    ? (createAccount.isPending ? "Menyimpan..." : "Buat Akun Teknisi")
                    : (updateAccount.isPending ? "Menyimpan..." : "Simpan Perubahan")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
