import { useState, useRef } from "react"
import { useTickets, useCreateTicket } from "../../hooks/useTickets"
import { Ticket, Clock, CheckCircle2, AlertCircle, Send, Loader2, ImagePlus, X } from "lucide-react"

export function TicketsPage() {
  const { data: tickets, isLoading } = useTickets()
  const createTicket = useCreateTicket()

  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    prioritas: "sedang" as "rendah" | "sedang" | "tinggi"
  })
  const [foto, setFoto] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getStorageUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost';
    return `${baseUrl}/storage/${path}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData()
    data.append("judul", formData.judul)
    data.append("deskripsi", formData.deskripsi)
    data.append("prioritas", formData.prioritas)
    if (foto) {
      data.append("foto", foto)
    }

    createTicket.mutate(data, {
      onSuccess: () => {
        setFormData({ judul: "", deskripsi: "", prioritas: "sedang" })
        setFoto(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        alert("Pengaduan berhasil dikirim!")
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "menunggu": return <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5" /> Menunggu</span>
      case "diproses": return <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5 w-fit"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Diproses</span>
      case "dijadwalkan": return <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5" /> Dijadwalkan</span>
      case "selesai": return <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>
      case "ditolak": return <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 flex items-center gap-1.5 w-fit"><AlertCircle className="w-3.5 h-3.5" /> Ditolak</span>
      default: return null
    }
  }

  const getPrioritasBadge = (prioritas: string) => {
    switch (prioritas) {
      case "tinggi": return <span className="text-[10px] uppercase tracking-wider font-black text-red-600">Prioritas Tinggi</span>
      case "sedang": return <span className="text-[10px] uppercase tracking-wider font-black text-orange-500">Prioritas Sedang</span>
      case "rendah": return <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Prioritas Rendah</span>
      default: return null
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pusat Bantuan & Pengaduan</h1>
          <p className="text-sm text-slate-500 mt-1">Laporkan kendala layanan dan pantau status perbaikannya.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Ticket History */}
        <div className="xl:col-span-2 space-y-6">
           <h2 className="text-[15px] font-extrabold text-slate-800">Riwayat Laporan Saya</h2>

           {isLoading ? (
             <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
               <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
               <p className="font-bold text-sm text-slate-500">Memuat data pengaduan...</p>
             </div>
           ) : tickets && tickets.length > 0 ? (
             <div className="space-y-4">
               {tickets.map((ticket) => (
                 <div key={ticket.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                             <Ticket className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">TKT-{String(ticket.id).padStart(4, '0')}</p>
                             {getPrioritasBadge(ticket.prioritas)}
                          </div>
                       </div>
                       <div className="shrink-0">{getStatusBadge(ticket.status)}</div>
                    </div>

                    <h3 className="text-[16px] font-extrabold text-slate-800 mb-3">{ticket.judul}</h3>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[13px] font-medium text-slate-600 leading-relaxed">
                       {ticket.deskripsi}
                    </div>

                    {ticket.foto && (
                       <div className="mt-4 flex items-center gap-2">
                         <a href={getStorageUrl(ticket.foto)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                            <ImagePlus className="w-3.5 h-3.5" /> Lihat Lampiran Foto
                         </a>
                       </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                         Dilaporkan: {new Date(ticket.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB
                       </span>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 shadow-sm">
                  <Ticket className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 mb-1">Belum Ada Pengaduan</h4>
                <p className="text-[13px] font-medium text-slate-500 max-w-sm">Anda belum pernah membuat laporan pengaduan. Form di sebelah kanan dapat Anda gunakan jika internet mengalami kendala.</p>
             </div>
           )}
        </div>

        {/* Right Column: Create Ticket Form */}
        <div className="space-y-6">
           <h2 className="text-[15px] font-extrabold text-slate-800">Buat Tiket Baru</h2>
           
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full z-0 opacity-50 pointer-events-none"></div>
              
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                 <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Topik Kendala <span className="text-red-500">*</span></label>
                    <input
                       required
                       type="text"
                       value={formData.judul}
                       onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                       placeholder="Contoh: Internet Mati Total"
                       className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Tingkat Urgensi <span className="text-red-500">*</span></label>
                    <select
                       value={formData.prioritas}
                       onChange={(e) => setFormData({ ...formData, prioritas: e.target.value as any })}
                       className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white cursor-pointer"
                    >
                       <option value="rendah">Rendah (Hanya Bertanya)</option>
                       <option value="sedang">Sedang (Koneksi Lambat)</option>
                       <option value="tinggi">Tinggi (Mati Total / Mendesak)</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Detail Kejadian <span className="text-red-500">*</span></label>
                    <textarea
                       required
                       rows={4}
                       value={formData.deskripsi}
                       onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                       placeholder="Jelaskan detail lampu indikator modem, pesan error, dll..."
                       className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white resize-none"
                    ></textarea>
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Foto / Bukti (Opsional)</label>
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
                         className="w-full border-2 border-dashed border-slate-200 rounded-xl px-4 py-4 text-[13px] font-bold text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                       >
                          <ImagePlus className="w-5 h-5" />
                          Klik untuk unggah foto (JPG/PNG)
                       </button>
                    ) : (
                       <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                          <div className="flex items-center gap-2 overflow-hidden">
                             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                             <span className="text-[12px] font-bold text-emerald-700 truncate">{foto.name}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { setFoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="p-1 hover:bg-emerald-100 rounded-md text-emerald-600 shrink-0"
                          >
                             <X className="w-4 h-4" />
                          </button>
                       </div>
                    )}
                 </div>
                 
                 <div className="pt-2">
                    <button
                       type="submit"
                       disabled={createTicket.isPending}
                       className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                    >
                       {createTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                       Kirim Laporan
                    </button>
                 </div>
              </form>
           </div>
        </div>

      </div>
    </div>
  )
}
