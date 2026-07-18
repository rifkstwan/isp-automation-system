import { useQuery } from "@tanstack/react-query"
import { Camera, Image as ImageIcon, Calendar, CheckCircle2, Package } from "lucide-react"
import api from "../../services/api"

export function TechnicianDocumentationPage() {
  const getStorageUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost';
    return `${baseUrl}/storage/${path}`;
  }

  // Mengambil data tiket gangguan
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ["technician-documentation-tickets"],
    queryFn: async () => {
      const res = await api.get("/technician/tickets")
      return res.data || []
    },
    staleTime: 10000,
    gcTime: 300000,
    refetchInterval: 10000,
  })

  // Mengambil data jadwal pemasangan baru
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["technician-documentation-schedules"],
    queryFn: async () => {
      const res = await api.get("/schedules/my")
      return res.data || []
    },
    staleTime: 10000,
    gcTime: 300000,
    refetchInterval: 10000,
  })

  const isLoading = isLoadingTickets || isLoadingSchedules

  // Filter tiket & jadwal yang memiliki foto
  const ticketDocs = tickets
    .filter((t: any) => t.foto)
    .map((t: any) => ({
      id: `TKT-${t.id}`,
      judul: t.judul,
      user_name: t.user?.name || "Pelanggan",
      foto: t.foto,
      type: "Perbaikan (Tiket)",
      status: t.status,
      updated_at: t.updated_at
    }))

  const scheduleDocs = schedules
    .filter((s: any) => s.foto || s.order?.foto)
    .map((s: any) => ({
      id: `INS-${s.id}`,
      judul: `Instalasi: ${s.order?.paket?.nama || 'WiFi Baru'}`,
      user_name: s.order?.user?.name || s.user?.name || "Pelanggan",
      foto: s.foto || s.order?.foto,
      type: "Pemasangan Baru",
      status: s.status,
      updated_at: s.updated_at
    }))

  const allDocs = [...ticketDocs, ...scheduleDocs].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Galeri Dokumentasi</h1>
          <p className="text-sm text-slate-500 mt-1">Arsip foto bukti pengerjaan lapangan (Pemasangan & Perbaikan).</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Menarik data dokumentasi...</div>
      ) : allDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Belum Ada Dokumentasi</h3>
          <p className="text-slate-500 text-sm mt-1">Anda belum mengunggah foto bukti pengerjaan apapun. Selesaikan tiket atau pemasangan dan unggah foto untuk melihatnya di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allDocs.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
              
              {/* Photo Area */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img 
                  src={getStorageUrl(doc.foto)} 
                  alt="Bukti Kerja" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<svg class="w-12 h-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                    e.currentTarget.parentElement?.appendChild(fallback);
                  }}
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                   {doc.type === "Pemasangan Baru" ? <Package className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                   {doc.id}
                </div>
                {doc.status === 'selesai' && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" />
                     Selesai
                  </div>
                )}
              </div>

              {/* Details Area */}
              <div className="p-4">
                <p className="font-bold text-slate-800 text-sm mb-1 truncate" title={doc.judul}>{doc.judul}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                   <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-600">
                     {doc.user_name.charAt(0)}
                   </div>
                   <span className="truncate">{doc.user_name}</span>
                </div>
                
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                   <span className="flex items-center">
                     <Calendar className="w-3 h-3 mr-1.5" />
                     {new Date(doc.updated_at).toLocaleDateString('id-ID', { 
                       day: 'numeric', month: 'short', year: 'numeric'
                     })}
                   </span>
                   <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                     {doc.type}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
