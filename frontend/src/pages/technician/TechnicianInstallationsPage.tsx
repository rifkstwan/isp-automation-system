import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MapPin, Package, CheckCircle2, Wrench, X, Loader2, ImagePlus } from "lucide-react"
import api from "../../services/api"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

export function TechnicianInstallationsPage() {
  const queryClient = useQueryClient()
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})
  const [foto, setFoto] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: installations = [], isLoading } = useQuery({
    queryKey: ["technician-installations"],
    queryFn: async () => {
      const res = await api.get(`/technician/installations?t=${new Date().getTime()}`)
      return res.data
    },
    refetchInterval: 5000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, network_device_id, foto }: { id: number, status: string, network_device_id?: number, foto?: File | null }) => {
      const data = new FormData()
      data.append("status", status)
      if (network_device_id) {
        data.append("network_device_id", String(network_device_id))
      }
      if (foto) {
        data.append("foto", foto)
      }
      const res = await api.post(`/technician/installations/${id}/status`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-installations"] })
      queryClient.invalidateQueries({ queryKey: ["technician-documentation"] })
      setFoto(null)
    },
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInst, setSelectedInst] = useState<any>(null)
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
      const devices = res.data.filter((d: any) => d.type === 'Router' || d.type === 'Server' || d.type === 'ODP')
      setExistingDevices(devices)

      // Auto-detect ODP matching customer address kecamatan
      if (selectedInst) {
        if (selectedInst.network_device_id) {
          setSelectedDeviceId(String(selectedInst.network_device_id))
        } else {
          const alamatLower = (selectedInst.alamat || '').toLowerCase()
          const matched = devices.find((d: any) => {
            const wilClean = (d.wilayah || '').toLowerCase().replace('kec.', '').trim()
            return wilClean.length > 2 && alamatLower.includes(wilClean)
          })
          if (matched) {
            setSelectedDeviceId(String(matched.id))
          } else {
            setSelectedDeviceId("new")
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat daftar router", err)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      loadDevices()
    }
  }, [isModalOpen, selectedInst])


  const addDeviceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/network-devices', data)
    },
    onSuccess: (res) => {
      if (selectedInst) {
        const newDeviceId = res.data?.data?.id
        updateStatus.mutate({ 
          id: selectedInst.schedule_id || selectedInst.id, 
          status: 'selesai', 
          network_device_id: newDeviceId,
          foto: foto
        })
      }
      setIsModalOpen(false)
      setSelectedInst(null)
      setFormData({ name: '', type: 'Router', ip_address: '', username: '', password: '', api_port: '8728' })
    },
    onError: (err) => {
      console.error("Failed to add device", err)
      alert("Gagal menyimpan konfigurasi router. Pastikan IP valid.")
    }
  })

  const handleFinish = (inst: any) => {
    setSelectedInst(inst)
    setFormData({
      ...formData,
      name: `Router ${inst.user.name}`,
    })
    setFoto(null)
    setIsModalOpen(true)
  }

  const handleSubmitRouter = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDeviceId === "new") {
      addDeviceMutation.mutate(formData)
    } else {
      if (selectedInst) {
        updateStatus.mutate({
          id: selectedInst.schedule_id || selectedInst.id,
          status: 'selesai',
          network_device_id: parseInt(selectedDeviceId),
          foto: foto
        })
      }
      setIsModalOpen(false)
      setSelectedInst(null)
    }
  }


  // Teknisi melihat pesanan yang sudah dibayar ('aktif') untuk dilakukan instalasi
  // Setelah instalasi selesai, teknisi akan merubah statusnya menjadi 'selesai'
  const activeInstallations = installations.filter((inst: any) => inst.status === "aktif")
  console.log("ALL INSTALLATIONS FETCHED:", installations);
  console.log("ACTIVE INSTALLATIONS AFTER FILTER:", activeInstallations);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Instalasi Baru</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar pelanggan baru yang menunggu proses penarikan kabel dan aktivasi.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Menarik data instalasi...</div>
      ) : activeInstallations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Semua Terpasang!</h3>
          <p className="text-slate-500 text-sm mt-1">Tidak ada jadwal instalasi pelanggan baru hari ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeInstallations.map((inst: any) => (
            <div key={inst.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100">
                    <Package className="w-3.5 h-3.5" />
                    Pemasangan Baru
                  </span>
                  <span className="text-xs font-bold text-slate-400">#ORD-{inst.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">Paket {inst.paket?.nama_paket || 'Internet'}</h3>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 text-sm">
                      {inst.user.name.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-slate-800 text-sm">{inst.user.name}</p>
                      <p className="text-xs text-slate-500">{inst.user.phone || inst.user.email}</p>
                   </div>
                </div>

                <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-4 flex-1 border border-slate-100">
                   <div className="flex gap-2 items-start">
                     <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                     <div>
                       <p className="font-bold text-slate-700 text-xs mb-1">Alamat Pemasangan</p>
                       <p className="leading-relaxed">{inst.alamat?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()}</p>
                     </div>
                   </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                  {/* Status Indicator & Action Buttons */}
                  {inst.schedule_status === 'berangkat' ? (
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold text-center border border-amber-200">
                      Sedang Dalam Perjalanan ke Lokasi
                    </div>
                  ) : inst.schedule_status === 'pengerjaan' ? (
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold text-center border border-blue-200">
                      Sedang Proses Penarikan Kabel / Setting
                    </div>
                  ) : null}

                  {inst.schedule_status !== 'berangkat' && inst.schedule_status !== 'pengerjaan' && (
                    <button
                      onClick={() => {
                        updateStatus.mutate({ id: inst.schedule_id || inst.id, status: 'berangkat' })
                        setWaRecipient({
                          name: inst.user?.name || "Pelanggan",
                          phone: inst.user?.phone || "",
                          address: inst.alamat || "",
                          packageName: inst.paket?.nama || "",
                          code: String(inst.id),
                          type: "installation"
                        })
                        setWaModalOpen(true)
                      }}
                      disabled={updateStatus.isPending}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-md shadow-amber-500/20"
                    >
                      Berangkat ke Lokasi Pelanggan (Kirim WA)
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setWaRecipient({
                          name: inst.user?.name || "Pelanggan",
                          phone: inst.user?.phone || "",
                          address: inst.alamat || "",
                          packageName: inst.paket?.nama || "",
                          code: String(inst.id),
                          type: "installation"
                        })
                        setWaModalOpen(true)
                      }}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Hubungi
                    </button>
                    <button
                      onClick={() => handleFinish(inst)}
                      disabled={updateStatus.isPending || addDeviceMutation.isPending}
                      className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <Wrench className="w-4 h-4" /> Tandai Selesai Terpasang
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Foto Bukti Pemasangan (Opsional)</label>
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setFoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {!foto ? (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl py-3 px-4 text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" /> Unggah Foto Pemasangan (JPG/PNG)
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700 truncate">{foto.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => { setFoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

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
      {/* WhatsApp Template Modal */}
      <WhatsAppTemplateModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        role="technician"
        recipient={waRecipient}
      />
    </div>
  )
}
