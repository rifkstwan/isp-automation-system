import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../../services/api"
import { Calendar, Clock, MapPin, Loader2, Navigation, CheckCircle2, X } from "lucide-react"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

export function TechnicianSchedulePage() {
  const queryClient = useQueryClient()
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["technician-schedules"],
    queryFn: async () => {
      const res = await api.get(`/technician/dashboard?t=${new Date().getTime()}`)
      return res.data
    },
    refetchInterval: 5000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await api.patch(`/technician/installations/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-schedules"] })
      queryClient.invalidateQueries({ queryKey: ["technician-dashboard-stats"] })
    },
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Router',
    ip_address: '',
    username: '',
    password: '',
    api_port: '8728'
  })
  
  const [existingDevices, setExistingDevices] = useState<any[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("new")

  const loadDevices = async () => {
    try {
      const res = await api.get('/network-devices')
      setExistingDevices(res.data.filter((d: any) => d.type === 'Router' || d.type === 'Server'))
    } catch (err) {
      console.error("Gagal memuat daftar router", err)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      loadDevices()
      setSelectedDeviceId("new")
    }
  }, [isModalOpen])

  const addDeviceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/network-devices', data)
    },
    onSuccess: () => {
      // Mark as selesai after adding router
      if (selectedSchedule) {
         updateStatus.mutate({ id: selectedSchedule.schedule_id, status: 'selesai' })
      }
      setIsModalOpen(false)
      setSelectedSchedule(null)
      setFormData({ name: '', type: 'Router', ip_address: '', username: '', password: '', api_port: '8728' })
    },
    onError: (err) => {
      console.error("Failed to add device", err)
      alert("Gagal menyimpan konfigurasi router. Pastikan IP valid.")
    }
  })

  const handleSubmitRouter = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDeviceId === "new") {
      addDeviceMutation.mutate(formData)
    } else {
      if (selectedSchedule) {
        updateStatus.mutate({ id: selectedSchedule.schedule_id, status: 'selesai' })
      }
      setIsModalOpen(false)
      setSelectedSchedule(null)
    }
  }

  const schedules = dashboardData?.schedules || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Jadwal Harian Saya</h1>
            <p className="text-sm text-slate-500 mt-1">Daftar lengkap tugas lapangan yang harus diselesaikan hari ini.</p>
         </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
           <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
           <p className="font-medium">Memuat jadwal...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Calendar className="w-8 h-8" />
           </div>
           <h3 className="text-lg font-bold text-slate-700">Hari Ini Bebas Tugas!</h3>
           <p className="text-slate-500 text-sm mt-1">Belum ada instalasi baru atau perbaikan gangguan yang dijadwalkan untuk Anda hari ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {schedules.map((schedule: any) => {
            const isInstalasi = schedule.type === 'instalasi'
            
            return (
              <div key={schedule.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                 
                 {/* Header */}
                 <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-3">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                          isInstalasi ? 'text-blue-600 bg-blue-100' : 'text-amber-600 bg-amber-100'
                       }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {schedule.time.split(' - ')[0]} WIB
                       </span>
                       <span className="text-xs font-bold text-slate-400">#{schedule.id.toUpperCase()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{schedule.title}</h3>
                 </div>

                 {/* Body */}
                 <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                       <div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-sm
                          ${isInstalasi ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}
                       `}>
                          <MapPin className="w-5 h-5" />
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-slate-800 text-sm">Lokasi Pelanggan</p>
                          <p className="text-xs text-slate-500 truncate">{schedule.subtitle?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()}</p>
                       </div>
                    </div>

                    <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-4 flex-1 border border-slate-100 flex flex-col justify-center">
                       <p className="font-medium text-center">Status: <span className="font-bold">{schedule.time.split(' - ')[1]}</span></p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                       <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const alamat = schedule.alamat || schedule.subtitle || ""
                              const catatan = schedule.catatan || ""
                              const combined = `${alamat} ${catatan}`
                              const urlMatch = combined.match(/(https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.app\.goo\.gl[^\s]*|goo\.gl\/maps[^\s]*))/i) || combined.match(/(https?:\/\/[^\s]+)/i)
                              const coordMatch = combined.match(/([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/)
                              
                              let mapUrl = ""
                              if (urlMatch) {
                                mapUrl = urlMatch[0]
                              } else if (coordMatch) {
                                mapUrl = `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`
                              } else {
                                const cleanAddress = alamat.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()
                                mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress || alamat)}`
                              }
                              window.open(mapUrl, '_blank')
                            }}
                            className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                          >
                             <Navigation className="w-3.5 h-3.5 text-blue-500" /> Navigasi Maps
                          </button>
                           <button 
                             onClick={() => {
                               const phone = schedule.phone || schedule.user_phone || schedule.order?.user?.phone || schedule.ticket?.user?.phone || ""
                               setWaRecipient({
                                 name: schedule.title?.replace(/^(Pemasangan|Survey|Tiket)\s*-\s*/i, '') || schedule.order?.user?.name || schedule.ticket?.user?.name || "Pelanggan",
                                 phone: phone,
                                 address: schedule.subtitle || schedule.order?.alamat || schedule.ticket?.alamat || "",
                                 scheduleTime: schedule.time || schedule.date || "",
                                 code: schedule.id ? String(schedule.id) : "",
                                 type: isInstalasi ? "installation" : schedule.type === "survey" ? "survey" : "ticket"
                               })
                               setWaModalOpen(true)
                             }}
                             className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                           >
                              <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                              Hubungi
                           </button>
                       </div>
                       <Link 
                         to={isInstalasi ? "/technician/installations" : "/technician/tickets"}
                         className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                       >
                          Buka Pengerjaan &rarr;
                       </Link>
                    </div>
                 </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Router Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                 <h2 className="text-lg font-bold text-slate-800">Konfigurasi Router Baru</h2>
                 <p className="text-xs text-slate-500 mt-1">Selesaikan instalasi dengan menghubungkan router ke sistem monitoring.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitRouter} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Aktivasi Melalui Gateway Router</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                >
                  <option value="new">Registrasi & Hubungkan Router Baru</option>
                  {existingDevices.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      Hubungkan ke: {d.name} ({d.ip_address})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDeviceId === "new" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nama Perangkat</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">IP Address Router</label>
                    <input 
                      type="text" 
                      value={formData.ip_address}
                      onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                      placeholder="Contoh: 192.168.1.1"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Username Mikrotik</label>
                       <input 
                         type="text" 
                         value={formData.username}
                         onChange={(e) => setFormData({...formData, username: e.target.value})}
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Password Mikrotik</label>
                       <input 
                         type="password" 
                         value={formData.password}
                         onChange={(e) => setFormData({...formData, password: e.target.value})}
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                       />
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">API Port</label>
                    <input 
                      type="text" 
                      value={formData.api_port}
                      onChange={(e) => setFormData({...formData, api_port: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                 <button 
                   type="submit" 
                   disabled={updateStatus.isPending || addDeviceMutation.isPending}
                   className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                 >
                   {updateStatus.isPending || addDeviceMutation.isPending 
                     ? <Loader2 className="w-4 h-4 animate-spin" /> 
                     : <CheckCircle2 className="w-4 h-4" />}
                   {selectedDeviceId === "new" 
                     ? "Simpan & Hubungkan Router Baru" 
                     : "Hubungkan & Selesaikan Tugas"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WhatsAppTemplateModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        role="technician"
        recipient={waRecipient}
      />
    </div>
  )
}
