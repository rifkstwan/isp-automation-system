import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Wrench, Package, MapPin, CheckCircle2, Navigation } from "lucide-react"
import api from "../../services/api"

export function TechnicianDashboardPage() {
  const { data: dashboardData } = useQuery({
    queryKey: ["technician-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get(`/technician/dashboard?t=${new Date().getTime()}`)
      return res.data
    },
    refetchInterval: 5000, // Auto refresh every 5 seconds
  })

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ["technician-active-tickets"],
    queryFn: async () => {
      const res = await api.get("/admin/tickets")
      return res.data.filter((t: any) => t.status === "diproses" || t.status === "menunggu")
    },
  })

  const stats = dashboardData || {
    tugasHariIni: 0,
    gangguanAktif: 0,
    instalasiBaru: 0,
    surveyLokasi: 0,
    schedules: []
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return { ring: 'ring-blue-50', bg: 'bg-blue-500', text: 'text-blue-500' };
      case 'amber': return { ring: 'ring-amber-50', bg: 'bg-amber-500', text: 'text-amber-500' };
      case 'emerald': return { ring: 'ring-emerald-50', bg: 'bg-emerald-500', text: 'text-emerald-500' };
      default: return { ring: 'ring-slate-50', bg: 'bg-slate-400', text: 'text-slate-500' };
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Welcome Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2 !text-white">Halo, Selamat Bekerja!</h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
               Hari ini Anda memiliki jadwal yang padat. Selalu utamakan keselamatan kerja (K3) dan pastikan untuk mendokumentasikan setiap hasil pekerjaan Anda di lokasi pelanggan.
            </p>
         </div>
         <div className="absolute right-0 top-0 bottom-0 w-64 bg-blue-500/20 rounded-l-full blur-3xl transform translate-x-1/2"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tugas Hari Ini</p>
          <div className="flex items-end justify-between">
             <h3 className="text-3xl font-extrabold text-slate-800">{stats.tugasHariIni}</h3>
             <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold mb-1">TOTAL</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gangguan</p>
          <div className="flex items-end justify-between">
             <h3 className="text-3xl font-extrabold text-slate-800">{stats.gangguanAktif}</h3>
             <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
             </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Instalasi</p>
          <div className="flex items-end justify-between">
             <h3 className="text-3xl font-extrabold text-slate-800">{stats.instalasiBaru}</h3>
             <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Package className="w-4 h-4" />
             </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Survey</p>
          <div className="flex items-end justify-between">
             <h3 className="text-3xl font-extrabold text-slate-800">{stats.surveyLokasi}</h3>
             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Urgent Tasks (Left) */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <div className="flex items-center justify-between mb-5">
               <h2 className="text-lg font-bold text-slate-800">Tiket Prioritas (Perlu Penanganan)</h2>
               <Link to="/technician/tickets" className="text-xs font-bold text-blue-600 hover:text-blue-700">Lihat Semua</Link>
             </div>

             {isLoadingTickets ? (
               <div className="py-8 text-center text-slate-400 text-sm font-medium">Memuat tugas prioritas...</div>
             ) : tickets.length === 0 ? (
               <div className="py-8 text-center">
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 </div>
                 <p className="font-bold text-slate-700">Tidak ada tiket mendesak</p>
                 <p className="text-xs text-slate-500 mt-1">Anda sudah menangani semua tiket dengan baik.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {tickets.slice(0, 3).map((ticket: any) => (
                   <div key={ticket.id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-100 bg-slate-50/50 hover:bg-blue-50/30 transition-colors group">
                     <div className="flex justify-between items-start mb-2">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                         ticket.prioritas === 'tinggi' ? 'bg-red-100 text-red-600' : 
                         ticket.prioritas === 'sedang' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                       }`}>
                         Prioritas {ticket.prioritas}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400">#TKT-{ticket.id}</span>
                     </div>
                     <h3 className="font-bold text-slate-800 text-sm mb-1">{ticket.judul}</h3>
                     <p className="text-xs text-slate-500 line-clamp-1 mb-3">{ticket.deskripsi}</p>
                     
                     <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {ticket.user?.name?.charAt(0) || "U"}
                           </div>
                           <span className="text-xs font-semibold text-slate-700">{ticket.user?.name}</span>
                        </div>
                        <button className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 transition-colors">
                           <Navigation className="w-3 h-3" />
                           Berangkat
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Schedule Sidebar (Right) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
           <h2 className="text-lg font-bold text-slate-800 mb-5">Jadwal Hari Ini</h2>
           
           <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-4">
              {stats.schedules && stats.schedules.length > 0 ? (
                stats.schedules.map((schedule: any) => {
                  const colors = getColorClasses(schedule.color);
                  return (
                    <div key={schedule.id} className="relative">
                       <div className="absolute -left-[21px] top-1 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full ring-4 ${colors.ring} ${colors.bg}`}></div>
                       </div>
                       <div className="pl-6">
                          <p className={`text-xs font-bold mb-0.5 ${colors.text}`}>{schedule.time}</p>
                          <p className="font-bold text-slate-800 text-sm">{schedule.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{schedule.subtitle}</p>
                       </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-bold text-slate-500">Tidak ada jadwal aktif</p>
                </div>
              )}
           </div>

           <Link to="/technician/schedule" className="block w-full py-2.5 mt-2 bg-slate-50 hover:bg-slate-100 text-center rounded-xl text-xs font-bold text-slate-600 transition-colors border border-slate-200">
             Lihat Kalender Lengkap
           </Link>
        </div>
      </div>

    </div>
  )
}
