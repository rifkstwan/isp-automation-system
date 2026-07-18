import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Receipt, Plus, X, CheckCircle2, AlertCircle, Clock, CheckCircle, Phone } from "lucide-react"
import api from "../../services/api"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka)
}

const statusConfig = {
  unpaid:  { label: "Belum Lunas", color: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock },
  paid:    { label: "Lunas",       color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  overdue: { label: "Jatuh Tempo", color: "bg-red-50 text-red-600 border-red-200", icon: AlertCircle },
}

type Billing = {
  id: number
  user_id: number
  order_id: number
  jumlah_tagihan: number
  status: "unpaid" | "paid" | "overdue"
  jatuh_tempo: string
  tanggal_bayar: string | null
  created_at: string
  user: {
    name: string
    email: string
    phone?: string
  }
  order: {
    paket: {
      nama: string
    }
  }
}

export function AdminBillingPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("semua")
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form for manual billing creation
  const [form, setForm] = useState({ order_id: "", jumlah_tagihan: "", jatuh_tempo: "", status: "unpaid" })

  const { data: billings = [], isLoading } = useQuery<Billing[]>({
    queryKey: ["admin-billings"],
    queryFn: async () => {
      const res = await api.get("/admin/billings")
      return res.data
    },
  })

  // To fetch orders for the dropdown when creating a billing
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-for-billing"],
    queryFn: async () => {
      const res = await api.get("/orders")
      return res.data
    },
    enabled: isModalOpen,
  })

  const markAsPaid = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/admin/billings/${id}/pay`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-billings"] })
      queryClient.invalidateQueries({ queryKey: ["report-summary"] })
    },
  })

  const createBilling = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/admin/billings", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-billings"] })
      setIsModalOpen(false)
      setForm({ order_id: "", jumlah_tagihan: "", jatuh_tempo: "", status: "unpaid" })
    },
  })

  const handleMarkAsPaid = (id: number) => {
    if (confirm("Tandai tagihan ini sebagai Lunas? (Pelanggan telah membayar secara offline/transfer manual)")) {
      markAsPaid.mutate(id)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createBilling.mutate(form)
  }

  const filteredBillings = billings.filter((b) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      b.user?.name.toLowerCase().includes(term) ||
      b.user?.email.toLowerCase().includes(term) ||
      `INV-${b.id}`.toLowerCase().includes(term) ||
      b.order?.paket?.nama.toLowerCase().includes(term)
      
    const matchesStatus = statusFilter === "semua" || b.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tagihan</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau dan kelola invoice pelanggan bulanan Anda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Tagihan Manual
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama, email, atau nomor invoice..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="semua">Semua Status</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="paid">Lunas</option>
            <option value="overdue">Jatuh Tempo</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">No. Invoice & Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Detail Berlangganan</th>
                <th className="px-6 py-4 font-semibold">Total Tagihan</th>
                <th className="px-6 py-4 font-semibold">Jatuh Tempo</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Memuat data tagihan...
                  </td>
                </tr>
              )}
              {!isLoading && filteredBillings.map((billing) => {
                const status = statusConfig[billing.status]
                const StatusIcon = status.icon
                
                return (
                  <tr key={billing.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">INV-{(billing.id).toString().padStart(5, '0')}</p>
                          <p className="font-bold text-slate-900">{billing.user?.name || "Unknown User"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{billing.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{billing.order?.paket?.nama || "Paket Tidak Diketahui"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID Langganan: #{billing.order_id}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 text-base">{formatRupiah(billing.jumlah_tagihan)}</span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{new Date(billing.jatuh_tempo).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      {billing.status === 'overdue' && (
                        <p className="text-[10px] font-bold text-red-500 mt-0.5 uppercase tracking-wide">Melewati Tenggat!</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label.toUpperCase()}
                        </span>
                        {billing.status === 'paid' && billing.tanggal_bayar && (
                          <span className="text-[10px] font-medium text-slate-500 ml-1">
                            {new Date(billing.tanggal_bayar).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {billing.status !== "paid" && (
                          <>
                            <button
                              onClick={() => {
                                setWaRecipient({
                                  name: billing.user.name,
                                  phone: billing.user.phone || "",
                                  packageName: billing.order?.paket?.nama || "",
                                  notes: `Jumlah: ${formatRupiah(billing.jumlah_tagihan)}, Tenggat: ${new Date(billing.jatuh_tempo).toLocaleDateString('id-ID')}`,
                                  type: "billing"
                                })
                                setWaModalOpen(true)
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
                              title="Ingatkan Tagihan via WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" /> Remind WA
                            </button>
                            <button 
                              onClick={() => handleMarkAsPaid(billing.id)}
                              disabled={markAsPaid.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold border border-emerald-200 transition-colors disabled:opacity-50"
                              title="Tandai Sudah Dibayar"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Tandai Lunas
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && filteredBillings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada tagihan yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Buat Tagihan Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pesanan (Langganan)</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.order_id} onChange={e => {
                    // find order to auto set amount
                    const selectedOrder = orders.find((o: any) => o.id === parseInt(e.target.value))
                    setForm({
                      ...form, 
                      order_id: e.target.value,
                      jumlah_tagihan: selectedOrder ? String(selectedOrder.total_harga) : form.jumlah_tagihan
                    })
                  }}
                >
                  <option value="" disabled>-- Pilih ID Pesanan Pelanggan --</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} - {o.user.name} ({o.paket.nama})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Tagihan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <input 
                    type="number" required min="0"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.jumlah_tagihan} onChange={e => setForm({...form, jumlah_tagihan: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                <input 
                  type="date" required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.jatuh_tempo} onChange={e => setForm({...form, jatuh_tempo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Awal</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="unpaid">Belum Lunas (Unpaid)</option>
                  <option value="paid">Lunas (Paid)</option>
                  <option value="overdue">Jatuh Tempo (Overdue)</option>
                </select>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={createBilling.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {createBilling.isPending ? "Menyimpan..." : "Buat Tagihan"}
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
