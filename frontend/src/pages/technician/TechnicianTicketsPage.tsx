import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera, CheckCircle2, Navigation, AlertTriangle, Clock, Wrench, UploadCloud } from "lucide-react"
import api from "../../services/api"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

type Ticket = {
  id: number
  judul: string
  deskripsi: string
  prioritas: "rendah" | "sedang" | "tinggi"
  status: "menunggu" | "diproses" | "selesai"
  foto: string | null
  created_at: string
  user: {
    name: string
    email: string
    phone?: string
    address?: string
  }
}

export function TechnicianTicketsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null)
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

    const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
      queryKey: ["technician-tickets"],
      queryFn: async () => {
      const res = await api.get("/technician/tickets")
        return res.data
      },
      refetchInterval: 5000,
    })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await api.patch(`/technician/tickets/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-tickets"] })
    },
  })

  const uploadFoto = useMutation({
    mutationFn: async ({ id, file }: { id: number, file: File }) => {
      const formData = new FormData()
      formData.append("foto", file)
      formData.append("status", "selesai") // Mark as done when uploading proof
      
      const res = await api.post(`/technician/tickets/${id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-tickets"] })
      setPreviewImage(null)
      setSelectedTicket(null)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, ticketId: number) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedTicket(ticketId)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedTicket || !fileInputRef.current?.files?.[0]) return
    
    setIsUploading(true)
    try {
      await uploadFoto.mutateAsync({ 
        id: selectedTicket, 
        file: fileInputRef.current.files[0] 
      })
      alert("Bukti perbaikan berhasil diunggah! Tiket ditandai Selesai.")
    } catch (error) {
      console.error(error)
      alert("Gagal mengunggah foto.")
    } finally {
      setIsUploading(false)
    }
  }

  // Filter only active tickets for the main view
  const activeTickets = tickets.filter(t => t.status !== "selesai")

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiket Gangguan Aktif</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar laporan pelanggan yang butuh penanganan di lapangan.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Menarik data dari satelit...</div>
      ) : activeTickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Semua Jaringan Aman</h3>
          <p className="text-slate-500 text-sm mt-1">Tidak ada gangguan aktif. Anda bisa istirahat sejenak!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                    ticket.prioritas === 'tinggi' ? 'text-red-600 bg-red-100' : 
                    ticket.prioritas === 'sedang' ? 'text-amber-600 bg-amber-100' : 'text-blue-600 bg-blue-100'
                  }`}>
                    {ticket.prioritas === 'tinggi' && <AlertTriangle className="w-3.5 h-3.5" />}
                    Prioritas {ticket.prioritas}
                  </span>
                  <span className="text-xs font-bold text-slate-400">#TKT-{ticket.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">{ticket.judul}</h3>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 text-sm">
                      {ticket.user.name.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-slate-800 text-sm">{ticket.user.name}</p>
                      <p className="text-xs text-slate-500">{ticket.user.email}</p>
                   </div>
                </div>

                <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-4 flex-1 border border-slate-100">
                  {ticket.deskripsi}
                </div>

                <div className="flex gap-2 mb-4">
                   <button 
                     onClick={() => {
                        const alamat = ticket.user.address || ""
                        const catatan = ticket.deskripsi || ""
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
                       setWaRecipient({
                         name: ticket.user?.name || "Pelanggan",
                         phone: ticket.user?.phone || "",
                         address: ticket.user?.address || "",
                         code: String(ticket.id),
                         notes: ticket.judul,
                         type: "ticket"
                       })
                       setWaModalOpen(true)
                     }}
                     className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                   >
                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Hubungi
                   </button>
                </div>

                {/* Status Action */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  {ticket.status === 'menunggu' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: ticket.id, status: 'diproses' })}
                      disabled={updateStatus.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <Wrench className="w-4 h-4" /> Mulai Pengerjaan
                    </button>
                  )}
                  
                  {ticket.status === 'diproses' && (
                    <div className="space-y-3">
                       <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                          <Clock className="w-4 h-4" /> Sedang Dikerjakan...
                       </div>
                       
                       <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment"
                         className="hidden" 
                         ref={fileInputRef} 
                         onChange={(e) => handleFileChange(e, ticket.id)} 
                       />
                       
                       <button
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-lg shadow-slate-900/20"
                       >
                         <Camera className="w-4 h-4" /> Ambil Foto Hasil Pekerjaan
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Preview Modal */}
      {previewImage && selectedTicket && (
         <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800">Preview Bukti</h3>
                  <button onClick={() => { setPreviewImage(null); setSelectedTicket(null); }} className="text-slate-400 hover:text-slate-600">Batal</button>
               </div>
               <img src={previewImage} alt="Preview" className="w-full h-64 object-cover" />
               <div className="p-4 bg-slate-50">
                  <p className="text-xs text-slate-500 mb-4 text-center">Foto ini akan diunggah dan tiket akan otomatis ditandai sebagai "Selesai".</p>
                  <button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                     {isUploading ? "Mengunggah..." : <><UploadCloud className="w-4 h-4" /> Konfirmasi & Selesai</>}
                  </button>
               </div>
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
