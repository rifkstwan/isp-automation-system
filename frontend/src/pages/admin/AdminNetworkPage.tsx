import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Activity, Wifi, Server, Cpu, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, Layers, Settings, Globe, Plus, Trash2 } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import api from "../../services/api"

export function AdminNetworkPage() {
  const { roles } = useAuth()
  const isAdmin = roles.includes('admin')
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Router',
    ip_address: '',
    username: '',
    password: '',
    api_port: '8728'
  })

  // Fetch devices using React Query with automatic refresh every 5 seconds
  const { data: devices = [], isFetching: isRefreshing, refetch } = useQuery({
    queryKey: ['network-devices'],
    queryFn: async () => {
      const res = await api.get('/network-devices/status')
      return res.data
    },
    refetchInterval: 5000, // Update otomatis tiap 5 detik
  })

  const addDeviceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/network-devices', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] })
      setIsModalOpen(false)
      setFormData({ name: '', type: 'Router', ip_address: '', username: '', password: '', api_port: '8728' })
    },
    onError: (err) => {
      console.error("Failed to add device", err)
      alert("Gagal menambahkan perangkat")
    }
  })

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/network-devices/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] })
    },
    onError: (err) => {
      console.error("Failed to delete device", err)
    }
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    addDeviceMutation.mutate(formData)
  }

  const handleDeleteDevice = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus perangkat ini?")) {
      deleteDeviceMutation.mutate(id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-emerald-50 text-emerald-600 border-emerald-200"
      case "offline": return "bg-red-50 text-red-600 border-red-200"
      case "terisolir": return "bg-rose-50 text-rose-600 border-rose-200"
      case "warning": return "bg-amber-50 text-amber-600 border-amber-200"
      default: return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "offline": return <XCircle className="w-4 h-4 text-red-500" />
      case "terisolir": return <AlertTriangle className="w-4 h-4 text-rose-500" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default: return null
    }
  }

  const onlineCount = devices.filter(d => d.status === 'online').length
  const offlineCount = devices.filter(d => d.status === 'offline').length

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Monitoring Jaringan
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Pantau status, performa, dan lalu lintas jaringan secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Perangkat
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Memperbarui..." : "Perbarui Data"}
          </button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Trafik Masuk</p>
              <h3 className="text-3xl font-bold text-slate-900">4.2 <span className="text-lg font-medium text-slate-500">Gbps</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
            <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" /> 12%
            </span>
            <span className="text-slate-400 text-xs md:text-sm">dari 1 jam terakhir</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Trafik Keluar</p>
              <h3 className="text-3xl font-bold text-slate-900">1.8 <span className="text-lg font-medium text-slate-500">Gbps</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
            <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" /> 5%
            </span>
            <span className="text-slate-400 text-xs md:text-sm">dari 1 jam terakhir</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Perangkat Aktif</p>
              <h3 className="text-3xl font-bold text-slate-900">{onlineCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
            <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-md ${offlineCount > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
              <AlertTriangle className="w-3 h-3" /> {offlineCount > 0 ? `${offlineCount} Offline` : 'Semua Normal'}
            </span>
            <span className="text-slate-400 text-xs md:text-sm">Total {devices.length} Perangkat</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Klien Online</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {devices.reduce((acc, curr) => acc + (curr.clients || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Device List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Status Perangkat Utama
            </h2>
          </div>
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Perangkat</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">IP Address</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Resource</th>
                  {isAdmin && (
                    <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.length === 0 && !isRefreshing && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Belum ada perangkat yang terdaftar.
                    </td>
                  </tr>
                )}
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center shrink-0 ${device.type === 'Router' ? 'bg-indigo-50 text-indigo-600' :
                            device.type === 'OLT' ? 'bg-purple-50 text-purple-600' :
                              device.type === 'Switch' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {device.type === 'Router' ? <Globe className="w-5 h-5" /> :
                            device.type === 'OLT' ? <Server className="w-5 h-5" /> :
                              <Layers className="w-5 h-5" />}
                        </div>
                        <div className="min-w-[120px]">
                          <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{device.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{device.type} • Uptime: {device.uptime}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{device.ip}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize whitespace-nowrap ${getStatusColor(device.status)}`}>
                        {getStatusIcon(device.status)}
                        {device.status}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {device.status === 'online' ? (
                        <div className="flex flex-col gap-2 w-24 mx-auto">
                          <div className="flex items-center gap-2" title={`CPU: ${device.cpu}%`}>
                            <Cpu className="w-3 h-3 text-slate-400" />
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${device.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${device.cpu}%` }}></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" title={`RAM: ${device.memory}%`}>
                            <BarChart3 className="w-3 h-3 text-slate-400" />
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${device.memory > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${device.memory}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-slate-400">-</div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                            title="Hapus Perangkat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Mini Charts / Info */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Wifi className="w-5 h-5 text-indigo-500" />
              Kualitas Sinyal Wireless
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-600">Sangat Baik</span>
                  <span className="font-bold text-slate-800">65%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-600">Cukup Baik</span>
                  <span className="font-bold text-slate-800">25%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-600">Lemah/Buruk</span>
                  <span className="font-bold text-slate-800">10%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden p-6 text-white relative">
            <div className="absolute right-0 top-0 opacity-10">
              <Globe className="w-32 h-32 -mr-8 -mt-8" />
            </div>
            <h3 className="text-base font-bold flex items-center gap-2 mb-2 relative z-10">
              <Clock className="w-5 h-5 text-blue-400" />
              Log Aktivitas Terakhir
            </h3>
            <div className="space-y-3 mt-4 relative z-10">
              <div className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                <div>
                  <p className="font-medium">Monitoring Real-time Diaktifkan</p>
                  <p className="text-slate-400 text-xs mt-0.5">Baru saja</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Tambah Perangkat</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Perangkat</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Mis: Core Router Mikrotik" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Router">Router</option>
                    <option value="Switch">Switch</option>
                    <option value="OLT">OLT</option>
                    <option value="Access Point">Access Point</option>
                    <option value="Server">Server</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
                  <input required type="text" value={formData.ip_address} onChange={e => setFormData({ ...formData, ip_address: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="192.168.1.1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username (Opsional)</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password (Opsional)</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Port (Opsional, Default 8728)</label>
                <input type="text" value={formData.api_port} onChange={e => setFormData({ ...formData, api_port: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="8728" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm">Simpan Perangkat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

