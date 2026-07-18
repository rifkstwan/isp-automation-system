import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, Trash2, Edit, ShieldAlert, CheckCircle, Package, X, Printer, Phone } from "lucide-react"
import api from "../../services/api"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

type Customer = {
  id: number
  name: string
  email: string
  phone: string | null
  address: string | null
  status: string
  created_at: string
  latest_order: {
    id: number
    status: string
    paket: {
      nama: string
    }
  } | null
}

export function AdminCustomersPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("semua")
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: ""
  })

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const res = await api.get("/customers")
      return res.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/customers/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] })
      queryClient.invalidateQueries({ queryKey: ["report-summary"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] })
      queryClient.invalidateQueries({ queryKey: ["report-summary"] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (modalMode === "add") {
        await api.post("/customers", data)
      } else {
        await api.put(`/customers/${selectedCustomer?.id}`, data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] })
      closeModal()
    },
  })

  // Filter
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "semua" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleUpdateStatus = (id: number, status: string) => {
    if (confirm(`Yakin ingin mengubah status pelanggan ini menjadi ${status}?`)) {
      updateStatusMutation.mutate({ id, status })
    }
  }

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus pelanggan ini secara permanen? Data order & tiket juga mungkin terhapus.")) {
      deleteMutation.mutate(id)
    }
  }

  const openAddModal = () => {
    setModalMode("add")
    setFormData({ name: "", email: "", phone: "", address: "", password: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (c: Customer) => {
    setModalMode("edit")
    setSelectedCustomer(c)
    setFormData({ 
      name: c.name, 
      email: c.email, 
      phone: c.phone || "", 
      address: c.address || "", 
      password: "" 
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCustomer(null)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-slate-400">Memuat data pelanggan...</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pelanggan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data, aktivasi, edit, dan hapus pengguna.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Pelanggan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama atau email..." 
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
            <option value="aktif">Aktif</option>
            <option value="pending">Pending</option>
            <option value="suspend">Suspend</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Kontak</th>
                <th className="px-6 py-4 font-semibold">Paket Aktif</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{customer.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Bergabung {new Date(customer.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700 font-medium">{customer.email}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-slate-500">{customer.phone || '-'}</p>
                      {customer.phone && (
                        <button
                          onClick={() => {
                            setWaRecipient({
                              name: customer.name,
                              phone: customer.phone || "",
                              address: customer.address || "",
                              packageName: customer.latest_order?.paket.nama || "",
                              type: "general"
                            })
                            setWaModalOpen(true)
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Chat WA Pelanggan"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.latest_order ? (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{customer.latest_order.paket.nama}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada paket</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      customer.status === "aktif" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      customer.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      customer.status === "suspend" ? "bg-red-50 text-red-600 border-red-200" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {customer.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right print:hidden">
                    <div className="flex items-center justify-end gap-1">
                      {customer.latest_order && customer.status !== 'aktif' && (
                        <button onClick={() => handleUpdateStatus(customer.id, 'aktif')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Aktivasi">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {customer.latest_order && customer.status === 'aktif' && (
                        <button onClick={() => handleUpdateStatus(customer.id, 'suspend')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend">
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEditModal(customer)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data pelanggan yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === "add" ? "Tambah Pelanggan Baru" : "Edit Pelanggan"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Pemasangan</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows={2}
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {modalMode === "edit" && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                </label>
                <input 
                  type="password" 
                  required={modalMode === "add"}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
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
