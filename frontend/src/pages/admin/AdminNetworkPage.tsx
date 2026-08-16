import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Activity, Wifi, Server, Cpu, Clock, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Layers, Globe, Plus, Trash2, ChevronDown, ChevronRight, Users,
  Network, Zap, MapPin, User, RouterIcon, Loader2, WifiOff, Signal,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import api from "../../services/api"

// ─── Helpers ────────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  online:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  offline:   "bg-red-50 text-red-700 border-red-200",
  terisolir: "bg-rose-50 text-rose-700 border-rose-200",
  warning:   "bg-amber-50 text-amber-700 border-amber-200",
}
const statusDot: Record<string, string> = {
  online:    "bg-emerald-500",
  offline:   "bg-red-500",
  terisolir: "bg-rose-500",
  warning:   "bg-amber-500",
}
const typeIcon: Record<string, React.ReactNode> = {
  Router:         <Globe className="w-4 h-4" />,
  Server:         <Server className="w-4 h-4" />,
  ODP:            <Network className="w-4 h-4" />,
  OLT:            <Layers className="w-4 h-4" />,
  Switch:         <Zap className="w-4 h-4" />,
  "Access Point": <Wifi className="w-4 h-4" />,
  Other:          <Layers className="w-4 h-4" />,
}
const typeColor: Record<string, string> = {
  Router:         "bg-indigo-50 text-indigo-600",
  Server:         "bg-blue-50 text-blue-600",
  ODP:            "bg-purple-50 text-purple-600",
  OLT:            "bg-cyan-50 text-cyan-600",
  Switch:         "bg-sky-50 text-sky-600",
  "Access Point": "bg-teal-50 text-teal-600",
  Other:          "bg-slate-100 text-slate-600",
}

// ─── ODP Tree Node ───────────────────────────────────────────────────────────
function ODPNode({ device, depth = 0 }: { device: any; depth?: number }) {
  const [open, setOpen] = useState(true)
  const hasChildren = device.children && device.children.length > 0
  const hasCustomers = device.customers && device.customers.length > 0

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-slate-100 pl-4" : ""}`}>
      <div
        className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
        onClick={() => setOpen(!open)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColor[device.type] || typeColor.Other}`}>
          {typeIcon[device.type] || typeIcon.Other}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{device.name}</span>
            {device.wilayah && (
              <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <MapPin className="w-3 h-3" /> {device.wilayah}
              </span>
            )}
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[device.status] || statusColor.offline}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[device.status] || statusDot.offline}`} />
              {device.status || 'offline'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{device.ip_address}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
          {hasCustomers && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">
              <Users className="w-3 h-3" /> {device.customers.length}
            </span>
          )}
          {(hasChildren || hasCustomers) && (
            open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {open && (
        <>
          {/* Customer rows under this device */}
          {hasCustomers && (
            <div className="ml-6 border-l-2 border-blue-100 pl-4 mb-2">
              {device.customers.map((c: any) => (
                <div key={c.order_id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-blue-50/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {(c.customer_name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{c.customer_name}</p>
                    <p className="text-xs text-slate-400">{c.paket}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {c.mikrotik_username && (
                      <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.mikrotik_username}</p>
                    )}
                    {c.ip_address && (
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{c.ip_address}</p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${statusColor[c.status] || statusColor.online}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[c.status] || 'bg-emerald-500'}`} />
                    {c.status || 'aktif'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Nested child devices */}
          {hasChildren && device.children.map((child: any) => (
            <ODPNode key={child.id} device={child} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function AdminNetworkPage() {
  const { roles } = useAuth()
  const isAdmin = roles.includes('admin')
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'topology' | 'devices' | 'customers'>('topology')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<Record<number, { success: boolean; message: string }>>({})

  const [formData, setFormData] = useState({
    name: '', type: 'Router', ip_address: '', username: '',
    password: '', api_port: '8728', wilayah: '', keterangan: '', parent_device_id: '',
  })

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: devicesStatus = [], isFetching: isRefreshing, refetch } = useQuery({
    queryKey: ['network-devices-status'],
    queryFn: async () => { const r = await api.get('/network-devices/status'); return r.data },
    refetchInterval: 8000,
  })

  const { data: topology, isLoading: topoLoading } = useQuery({
    queryKey: ['network-topology'],
    queryFn: async () => { const r = await api.get('/network-devices/topology'); return r.data },
    refetchInterval: 10000,
  })

  const { data: allDevices = [] } = useQuery({
    queryKey: ['network-devices-all'],
    queryFn: async () => { const r = await api.get('/network-devices'); return r.data },
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addDeviceMutation = useMutation({
    mutationFn: (data: any) => api.post('/network-devices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices-status'] })
      queryClient.invalidateQueries({ queryKey: ['network-topology'] })
      queryClient.invalidateQueries({ queryKey: ['network-devices-all'] })
      setIsModalOpen(false)
      setFormData({ name: '', type: 'Router', ip_address: '', username: '', password: '', api_port: '8728', wilayah: '', keterangan: '', parent_device_id: '' })
    },
    onError: () => alert("Gagal menambahkan perangkat"),
  })

  const deleteDeviceMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/network-devices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices-status'] })
      queryClient.invalidateQueries({ queryKey: ['network-topology'] })
      queryClient.invalidateQueries({ queryKey: ['network-devices-all'] })
    },
  })

  const handleTestConnection = async (device: any) => {
    setTestingId(device.id)
    try {
      const res = await api.post(`/network-devices/${device.id}/test-connection`)
      setTestResult(prev => ({ ...prev, [device.id]: { success: true, message: res.data.message } }))
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Koneksi gagal.'
      setTestResult(prev => ({ ...prev, [device.id]: { success: false, message: msg } }))
    } finally {
      setTestingId(null)
    }
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const onlineCount = devicesStatus.filter((d: any) => d.status === 'online').length
  const offlineCount = devicesStatus.filter((d: any) => d.status === 'offline' || d.status === 'terisolir').length
  const totalCustomers = topology?.summary?.total_customers ?? 0
  const totalODP = topology?.summary?.total_odp ?? 0

  const tabs = [
    { id: 'topology', label: 'Topologi Jaringan', icon: <Network className="w-4 h-4" /> },
    { id: 'devices',  label: 'Perangkat',         icon: <Server className="w-4 h-4" /> },
    { id: 'customers',label: 'Pelanggan per ODP',  icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Monitoring Jaringan
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Pantau topologi, status perangkat, dan pelanggan secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Perangkat
            </button>
          )}
          <button
            onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['network-topology'] }) }}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Memperbarui..." : "Perbarui"}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Perangkat Online",   value: onlineCount,     icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Perangkat Masalah",  value: offlineCount,    icon: <WifiOff className="w-5 h-5" />,     color: "text-red-600 bg-red-50" },
          { label: "Total ODP/AP",       value: totalODP,        icon: <Signal className="w-5 h-5" />,      color: "text-purple-600 bg-purple-50" },
          { label: "Pelanggan Aktif",    value: totalCustomers,  icon: <Users className="w-5 h-5" />,       color: "text-blue-600 bg-blue-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Topologi ─────────────────────────────────────────────────── */}
        {activeTab === 'topology' && (
          <div className="p-4 sm:p-6">
            {topoLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat topologi jaringan...
              </div>
            ) : !topology?.core_devices?.length ? (
              <div className="text-center py-16 text-slate-400">
                <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada perangkat terdaftar.</p>
                <p className="text-sm mt-1">Tambah Router Utama dan ODP di tab Perangkat.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Infrastruktur Jaringan</p>
                {topology.core_devices.map((device: any) => (
                  <div key={device.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Server className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{device.name} <span className="text-xs font-normal text-slate-500">(Core)</span></p>
                        <p className="text-xs font-mono text-slate-500">{device.ip_address}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${statusColor[device.status] || statusColor.offline}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusDot[device.status] || statusDot.offline}`} />
                        {device.status || 'offline'}
                      </span>
                    </div>
                    <div className="p-2">
                      {device.children?.length > 0 ? (
                        device.children.map((child: any) => (
                          <ODPNode key={child.id} device={child} depth={0} />
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">
                          Belum ada ODP/AP yang terhubung ke perangkat ini.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Perangkat ────────────────────────────────────────────────── */}
        {activeTab === 'devices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Perangkat', 'IP Address', 'Wilayah', 'Status', 'Resource', 'Klien', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {devicesStatus.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Belum ada perangkat terdaftar.</td></tr>
                )}
                {devicesStatus.map((device: any) => (
                  <tr key={device.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColor[device.type] || typeColor.Other}`}>
                          {typeIcon[device.type] || typeIcon.Other}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{device.name}</p>
                          <p className="text-xs text-slate-400">{device.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{device.ip}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">{device.wilayah || <span className="text-slate-300">—</span>}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusColor[device.status] || statusColor.offline}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'animate-pulse' : ''} ${statusDot[device.status] || statusDot.offline}`} />
                        {device.status}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {device.status === 'online' ? (
                        <div className="flex flex-col gap-1.5 w-24">
                          <div className="flex items-center gap-2" title={`CPU: ${device.cpu}%`}>
                            <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full">
                              <div className={`h-full rounded-full ${device.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${device.cpu}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{device.cpu}%</span>
                          </div>
                          <div className="flex items-center gap-2" title={`RAM: ${device.memory}%`}>
                            <Activity className="w-3 h-3 text-slate-400 shrink-0" />
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full">
                              <div className={`h-full rounded-full ${device.memory > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${device.memory}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{device.memory}%</span>
                          </div>
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-700">{device.clients ?? 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestConnection(device)}
                          disabled={testingId === device.id}
                          title="Test Koneksi Mikrotik"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            testResult[device.id]?.success === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            testResult[device.id]?.success === false ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {testingId === device.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : testResult[device.id]?.success === true ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : testResult[device.id]?.success === false ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Zap className="w-3 h-3" />
                          )}
                          {testingId === device.id ? 'Testing...' :
                           testResult[device.id]?.success === true ? 'Terhubung' :
                           testResult[device.id]?.success === false ? 'Gagal' : 'Test'}
                        </button>
                        {device.type === 'Router' && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.post(`/network-devices/${device.id}/sync`)
                                alert(res.data.message)
                                queryClient.invalidateQueries({ queryKey: ['network-topology'] })
                              } catch (err: any) {
                                alert("Gagal sinkronisasi data dari Mikrotik")
                              }
                            }}
                            title="Sinkronisasi Akun PPPoE dari Mikrotik Fisik"
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" /> Sync Mikrotik
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => confirm("Hapus perangkat ini?") && deleteDeviceMutation.mutate(device.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {testResult[device.id] && (
                        <p className={`text-xs mt-1 max-w-[160px] ${testResult[device.id].success ? 'text-emerald-600' : 'text-red-500'}`}>
                          {testResult[device.id].message}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: Pelanggan per ODP ────────────────────────────────────────── */}
        {activeTab === 'customers' && (
          <div className="p-4 sm:p-6">
            {topoLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data pelanggan...
              </div>
            ) : !topology?.active_customers?.length ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada pelanggan aktif yang terhubung ke jaringan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Pelanggan', 'Paket', 'PPPoE Username', 'IP Address', 'ODP/Router', 'Wilayah', 'Status', 'Aktif s/d'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topology.active_customers.map((c: any) => (
                      <tr key={c.order_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                              {(c.customer_name || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{c.customer_name}</p>
                              <p className="text-xs text-slate-400">{c.customer_phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-medium text-slate-700">{c.paket}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {c.mikrotik_username
                            ? <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{c.mikrotik_username}</span>
                            : <span className="text-slate-300 text-xs">Belum dikonfigurasi</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          {c.ip_address
                            ? <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{c.ip_address}</span>
                            : <span className="text-slate-300 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          {c.network_device
                            ? <span className="text-sm text-slate-700">{c.network_device.name}</span>
                            : <span className="text-slate-300 text-xs">Belum dihubungkan</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-600">{c.network_device?.wilayah || <span className="text-slate-300">—</span>}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${
                            c.status === 'suspend' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'suspend' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {c.status === 'suspend' ? 'Terisolir' : 'Aktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-500">
                            {c.tanggal_selesai ? new Date(c.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Device Modal ──────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Tambah Perangkat Jaringan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftarkan Router, ODP, AP, atau perangkat lainnya.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addDeviceMutation.mutate(formData) }} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nama Perangkat</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mis: MikroTik Core CV Citra Mandiri" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tipe</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {['Router','Switch','OLT','ODP','Access Point','Server','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">IP Address</label>
                  <input required type="text" value={formData.ip_address} onChange={e => setFormData({...formData, ip_address: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" placeholder="192.168.88.1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Username Mikrotik</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Password Mikrotik</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">API Port</label>
                  <input type="text" value={formData.api_port} onChange={e => setFormData({...formData, api_port: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="8728" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Wilayah / Kecamatan</label>
                  <input
                    type="text"
                    list="kecamatan-grobogan"
                    value={formData.wilayah}
                    onChange={e => setFormData({...formData, wilayah: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Pilih atau ketik Kecamatan..."
                  />
                  <datalist id="kecamatan-grobogan">
                    {['Brati', 'Gabus', 'Geyer', 'Godong', 'Grobogan', 'Gubug', 'Karangrayung', 'Kedungjati', 'Klambu', 'Kradenan', 'Ngaringan', 'Penawangan', 'Pulokulon', 'Purwodadi', 'Tanggungharjo', 'Tawangharjo', 'Toroh', 'Wirosari', 'Wonosalam'].map((k) => (
                      <option key={k} value={`Kec. ${k}`} />
                    ))}
                  </datalist>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Hubungkan ke Perangkat Induk (Opsional)</label>
                  <select value={formData.parent_device_id} onChange={e => setFormData({...formData, parent_device_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">— Tidak ada (Perangkat Root/Core) —</option>
                    {allDevices.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Untuk ODP, pilih Router Utama sebagai induknya.</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Keterangan (Opsional)</label>
                  <textarea value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} placeholder="Mis: ODP di Jl. Ahmad Yani, dekat perempatan..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={addDeviceMutation.isPending} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70">
                  {addDeviceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Simpan Perangkat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
