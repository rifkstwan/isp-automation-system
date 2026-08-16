import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, CheckCircle, XCircle, ShieldAlert, Package, Printer, Zap, Check, Settings, X, Globe, Navigation, Phone, Ruler, User, Calendar } from "lucide-react"
import api from "../../services/api"
import type { Order } from "../../hooks/useOrders"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka)
}

const statusConfig = {
  pending:  { label: "Menunggu",  color: "bg-amber-50 text-amber-600 border-amber-200" },
  dibayar:  { label: "Menunggu Pemasangan", color: "bg-blue-50 text-blue-600 border-blue-200" },
  aktif:    { label: "Aktif",     color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  suspend:  { label: "Suspend",   color: "bg-red-50 text-red-600 border-red-200" },
  ditolak:  { label: "Ditolak",   color: "bg-slate-100 text-slate-500 border-slate-300" },
  selesai:  { label: "Selesai",   color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
}

type AdminOrder = Order & {
  user: { id: number; name: string; email: string }
  ip_address?: string
  tipe_perangkat?: string
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})
  const [activeTab, setActiveTab] = useState<"orders" | "surveys">("orders")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("semua")
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false)
  const [specsOrder, setSpecsOrder] = useState<AdminOrder | null>(null)
  const [specsForm, setSpecsForm] = useState({ ip_address: "", tipe_perangkat: "" })
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null)
  const [assignForm, setAssignForm] = useState({ nama_teknisi: "", tanggal_survey: "" })

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ["technicians-list-for-survey"],
    queryFn: async () => {
      const res = await api.get("/technician/accounts")
      return res.data
    },
  })

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<AdminOrder[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await api.get("/orders")
      return res.data
    },
  })

  const { data: surveyRequests = [], isLoading: isLoadingSurveys } = useQuery<any[]>({
    queryKey: ["admin-survey-requests"],
    queryFn: async () => {
      const res = await api.get("/technician/survey-requests")
      return res.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, tanggal_mulai, tanggal_selesai }: {
      id: number
      status: string
      tanggal_mulai?: string
      tanggal_selesai?: string
    }) => {
      const res = await api.patch(`/orders/${id}/status`, {
        status,
        tanggal_mulai,
        tanggal_selesai,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
      queryClient.invalidateQueries({ queryKey: ["report-summary"] })
    },
  })

  const updateSurveyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await api.patch(`/technician/survey-requests/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-requests"] })
      queryClient.invalidateQueries({ queryKey: ["public-verified-locations"] })
    },
  })

  const assignSurveyTechnician = useMutation({
    mutationFn: async ({ id, nama_teknisi, tanggal_survey }: { id: number; nama_teknisi: string; tanggal_survey: string }) => {
      const res = await api.post(`/technician/survey-requests/${id}/assign`, { nama_teknisi, tanggal_survey })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-requests"] })
      setIsAssignModalOpen(false)
    },
  })


  const updateSpecsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.patch(`/orders/${id}/specs`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
      setIsSpecsModalOpen(false)
    },
  })

  const handleAktif = (order: AdminOrder) => {
    if (confirm(`Yakin ingin mengaktifkan pesanan untuk pelanggan ${order.user.name}? Masa aktif paket adalah ${order.paket.durasi} hari.`)) {
      const today = new Date().toISOString().split("T")[0]
      const selesaiDate = new Date()
      selesaiDate.setDate(selesaiDate.getDate() + order.paket.durasi)
      
      updateStatus.mutate({
        id: order.id,
        status: "aktif",
        tanggal_mulai: today,
        tanggal_selesai: selesaiDate.toISOString().split("T")[0],
      })
    }
  }

  const handleTolak = (id: number) => {
    if (confirm("Yakin ingin menolak pesanan ini?")) {
      updateStatus.mutate({ id, status: "ditolak" })
    }
  }

  const handleSelesai = (id: number) => {
    if (confirm("Tandai pesanan ini sebagai selesai?")) {
      updateStatus.mutate({ id, status: "selesai" })
    }
  }

  const handleSuspend = (id: number) => {
    if (confirm("Suspend (tangguhkan sementara) koneksi untuk pelanggan ini?")) {
      updateStatus.mutate({ id, status: "suspend" })
    }
  }

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      o.user.name.toLowerCase().includes(term) || 
      o.user.email.toLowerCase().includes(term) ||
      o.id.toString().includes(term) ||
      o.paket.nama.toLowerCase().includes(term)
      
    const matchesStatus = statusFilter === "semua" || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter Survey Requests
  const filteredSurveys = surveyRequests.filter(s => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      s.nama.toLowerCase().includes(term) || 
      s.phone.toLowerCase().includes(term) ||
      s.alamat.toLowerCase().includes(term)
    const matchesStatus = statusFilter === "semua" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isLoading = isLoadingOrders || isLoadingSurveys

  const handleMapsOpen = (alamat: string, lat?: string, lng?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
      return
    }
    const urlMatch = alamat.match(/(https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.app\.goo\.gl[^\s]*|goo\.gl\/maps[^\s]*))/i)
    if (urlMatch) {
      window.open(urlMatch[0], '_blank')
    } else {
      const cleanAddress = alamat.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress || alamat)}`, '_blank')
    }
  }

  const handleWhatsAppOpen = (phoneStr: string, name?: string, address?: string, packageName?: string) => {
    if (!phoneStr) {
      alert("Nomor telepon tidak tersedia.")
      return
    }
    setWaRecipient({
      name: name || "Pelanggan",
      phone: phoneStr,
      address: address || "",
      packageName: packageName || "",
      type: "survey"
    })
    setWaModalOpen(true)
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-slate-400">Memuat data...</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pemesanan &amp; Permohonan Survey</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola pesanan pelanggan dan pantau permohonan survey lokasi baru dari landing page.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 print:hidden">
        <button
          onClick={() => { setActiveTab("orders"); setStatusFilter("semua"); }}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Package className="w-4 h-4" />
          Daftar Pemesanan Paket ({orders.length})
        </button>
        <button
          onClick={() => { setActiveTab("surveys"); setStatusFilter("semua"); }}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "surveys"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Globe className="w-4 h-4 text-blue-600" />
          Permohonan Survey Landing Page ({surveyRequests.length})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === "orders" ? "Cari nama, email, nama paket, atau ID..." : "Cari nama, nomor WA, atau alamat survey..."} 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "orders" ? (
            <select 
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="dibayar">Menunggu Pemasangan</option>
              <option value="aktif">Aktif</option>
              <option value="suspend">Suspend</option>
              <option value="selesai">Selesai</option>
              <option value="ditolak">Ditolak</option>
            </select>
          ) : (
            <select 
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Status Survey</option>
              <option value="pending">Belum Disurvey (Pending)</option>
              <option value="dijadwalkan">Dijadwalkan Survey</option>
              <option value="layak">Dikonfirmasi LAYAK</option>
              <option value="ditolak">Ditolak / Luar Jangkauan</option>
            </select>
          )}
        </div>
      </div>

      {/* Content View */}
      {activeTab === "orders" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Pesanan &amp; Pelanggan</th>
                  <th className="px-6 py-4 font-semibold">Detail Paket</th>
                  <th className="px-6 py-4 font-semibold">Alamat &amp; Catatan</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold">ID</span>
                            <span className="text-xs font-bold -mt-1">{order.id}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{order.user.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{order.user.email}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Dipesan: {new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-slate-800">{order.paket.nama}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Zap className="w-3 h-3 text-amber-500" /> {order.paket.kecepatan} Mbps
                        </div>
                        <div className="font-semibold text-indigo-600 mt-1">
                          {formatRupiah(order.total_harga)}
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-slate-700 text-xs line-clamp-2" title={order.alamat}>
                          {order.alamat}
                        </p>
                        {order.catatan ? (
                          <p className="text-xs text-amber-600 mt-1 line-clamp-1 italic" title={order.catatan}>
                            Catatan: {order.catatan}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1 italic">- Tanpa catatan -</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${status.color}`}>
                            {status.label.toUpperCase()}
                          </span>
                          {(order.status === 'aktif' || order.status === 'suspend' || order.status === 'selesai') && order.tanggal_mulai && (
                            <div className="text-[10px] text-slate-500">
                              <span className="block font-medium">Mulai: {new Date(order.tanggal_mulai).toLocaleDateString('id-ID')}</span>
                              <span className="block font-medium">Exp: {order.tanggal_selesai ? new Date(order.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "pending" && (
                            <>
                              <button 
                                onClick={() => handleAktif(order)}
                                disabled={updateStatus.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold border border-emerald-200 transition-colors disabled:opacity-50"
                                title="Terima &amp; Aktifkan Pesanan"
                              >
                                <Check className="w-3.5 h-3.5" /> Aktifkan
                              </button>
                              <button 
                                onClick={() => handleTolak(order.id)}
                                disabled={updateStatus.isPending}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                                title="Tolak Pesanan"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {(order.status === "aktif" || order.status === "suspend") && (
                            <>
                              {order.status === "aktif" ? (
                                <button 
                                  onClick={() => handleSuspend(order.id)}
                                  disabled={updateStatus.isPending}
                                  className="p-1.5 text-amber-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                                  title="Suspend Pesanan"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleAktif(order)}
                                    disabled={updateStatus.isPending}
                                    className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-emerald-100"
                                    title="Aktifkan Kembali"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleTolak(order.id)}
                                    disabled={updateStatus.isPending}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                                    title="Tolak / Pemutusan Permanen"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => {
                                  setSpecsOrder(order)
                                  setSpecsForm({
                                    ip_address: order.ip_address || "",
                                    tipe_perangkat: order.tipe_perangkat || ""
                                  })
                                  setIsSpecsModalOpen(true)
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                title="Update Spesifikasi Teknis"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleSelesai(order.id)}
                                disabled={updateStatus.isPending}
                                className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-indigo-100"
                                title="Tandai Selesai"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada pesanan yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Table Surveys */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Calon Pelanggan</th>
                  <th className="px-6 py-4 font-semibold">Kontak WA</th>
                  <th className="px-6 py-4 font-semibold">Alamat &amp; Pin Maps</th>
                  <th className="px-6 py-4 font-semibold">Status Survey</th>
                  <th className="px-6 py-4 font-semibold text-right print:hidden">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{survey.nama}</div>
                      <div className="text-[11px] text-slate-400">#SRV-{survey.id} · {new Date(survey.created_at).toLocaleDateString('id-ID')}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{survey.phone}</span>
                        <button
                          onClick={() => handleWhatsAppOpen(survey.phone, survey.nama, survey.alamat, survey.paket_interest)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Chat via WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" /> Chat WA
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-[260px]">
                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-2" title={survey.alamat}>
                        {survey.alamat}
                      </p>
                      {survey.catatan && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                          Catatan: {survey.catatan}
                        </p>
                      )}
                      <button
                        onClick={() => handleMapsOpen(survey.alamat, survey.latitude, survey.longitude)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <Navigation className="w-3 h-3" /> Lihat Peta Google
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      {survey.status === 'layak' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Layak (Terjangkau)
                        </span>
                      ) : survey.status === 'ditolak' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3" /> Ditolak / Tidak Terjangkau
                        </span>
                      ) : survey.status === 'dijadwalkan' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                            <Calendar className="w-3 h-3" /> Dijadwalkan
                          </span>
                          <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-600" /> {survey.nama_teknisi || 'Teknisi'}
                          </p>
                          {survey.tanggal_survey && (
                            <p className="text-[10px] text-slate-500">
                              {new Date(survey.tanggal_survey).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-amber-100 text-amber-700 border border-amber-200">
                          <Ruler className="w-3 h-3" /> Menunggu Penugasan
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex items-center justify-end gap-2">
                        {survey.status === 'layak' ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Terdata Layak
                          </span>
                        ) : survey.status === 'ditolak' ? (
                          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Terdata Ditolak
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedSurvey(survey)
                                setAssignForm({
                                  nama_teknisi: survey.nama_teknisi || (technicians[0]?.name || ""),
                                  tanggal_survey: survey.tanggal_survey ? new Date(survey.tanggal_survey).toISOString().slice(0, 16) : ""
                                })
                                setIsAssignModalOpen(true)
                              }}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold border border-indigo-200 transition-colors flex items-center gap-1"
                              title="Tugaskan Teknisi Survey"
                            >
                              <User className="w-3.5 h-3.5" /> {survey.nama_teknisi ? "Ubah Teknisi" : "Tugaskan Teknisi"}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Setujui lokasi survey ini sebagai LAYAK & Terjangkau?")) {
                                  updateSurveyStatus.mutate({ id: survey.id, status: 'layak' })
                                }
                              }}
                              disabled={updateSurveyStatus.isPending}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                            >
                              Setujui Layak
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Tolak permohonan survey ini?")) {
                                  updateSurveyStatus.mutate({ id: survey.id, status: 'ditolak' })
                                }
                              }}
                              disabled={updateSurveyStatus.isPending}
                              className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>


                  </tr>
                ))}
                {filteredSurveys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Belum ada permohonan survey lokasi dari landing page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Specs Modal */}
      {isSpecsModalOpen && specsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">
                Spesifikasi Teknis
              </h2>
              <button onClick={() => setIsSpecsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              updateSpecsMutation.mutate({ id: specsOrder.id, data: specsForm })
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: 192.168.1.50 atau DHCP Dinamis"
                  value={specsForm.ip_address} onChange={e => setSpecsForm({...specsForm, ip_address: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Perangkat (Modem/Router)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: ZTE F609 atau Modem ONT Dual-Band"
                  value={specsForm.tipe_perangkat} onChange={e => setSpecsForm({...specsForm, tipe_perangkat: e.target.value})}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsSpecsModalOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={updateSpecsMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {updateSpecsMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Survey Modal */}
      {isAssignModalOpen && selectedSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Tugaskan Teknisi Survey
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Permohonan: {selectedSurvey.nama} (#SRV-{selectedSurvey.id})</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              if (!assignForm.nama_teknisi || !assignForm.tanggal_survey) {
                alert("Pilih teknisi dan tanggal survey terlebih dahulu!")
                return
              }
              assignSurveyTechnician.mutate({
                id: selectedSurvey.id,
                nama_teknisi: assignForm.nama_teknisi,
                tanggal_survey: assignForm.tanggal_survey
              })
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Teknisi Penanggung Jawab</label>
                <select
                  required
                  value={assignForm.nama_teknisi}
                  onChange={(e) => setAssignForm({ ...assignForm, nama_teknisi: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Teknisi --</option>
                  {technicians.map((t: any) => (
                    <option key={t.id} value={t.name}>{t.name} ({t.email})</option>
                  ))}
                </select>
                {technicians.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Belum ada akun teknisi. Tambahkan akun teknisi di menu Manajemen Teknisi.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal & Jam Kunjungan Survey</label>
                <input 
                  required
                  type="datetime-local" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={assignForm.tanggal_survey}
                  onChange={(e) => setAssignForm({ ...assignForm, tanggal_survey: e.target.value })}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={assignSurveyTechnician.isPending || !assignForm.nama_teknisi}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {assignSurveyTechnician.isPending ? "Menyimpan..." : "Simpan Penugasan"}
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

