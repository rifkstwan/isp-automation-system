import { useSchedules } from "../../hooks/useSchedules"
import { CalendarDays, Clock, User, CheckCircle2, Wrench, Navigation, XCircle, Loader2, Info } from "lucide-react"

export function SchedulePage() {
  const { data: schedules, isLoading } = useSchedules()


  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit", minute: "2-digit"
    })
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "menunggu":
        return { label: "Menunggu Jadwal", color: "bg-orange-50 text-orange-600 border-orange-100", icon: Clock }
      case "berangkat":
        return { label: "Teknisi Menuju Lokasi", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Navigation }
      case "pengerjaan":
        return { label: "Sedang Dikerjakan", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Wrench }
      case "selesai":
        return { label: "Selesai", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 }
      case "dibatalkan":
        return { label: "Dibatalkan", color: "bg-red-50 text-red-600 border-red-100", icon: XCircle }
      default:
        return { label: status, color: "bg-slate-50 text-slate-600 border-slate-100", icon: Clock }
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jadwal Teknisi</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau jadwal kedatangan teknisi ke lokasi Anda secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Timeline Schedule */}
        <div className="xl:col-span-2 space-y-6">
           <h2 className="text-[15px] font-extrabold text-slate-800">Daftar Kunjungan</h2>

           {isLoading ? (
             <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
               <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
               <p className="font-bold text-sm text-slate-500">Memuat jadwal...</p>
             </div>
           ) : schedules && schedules.length > 0 ? (
             <div className="space-y-6 relative pt-4">
               {/* Timeline track */}
               <div className="absolute left-[54px] top-8 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent hidden md:block z-0"></div>

               {schedules.map((schedule) => {
                 const statusUI = getStatusDisplay(schedule.status)
                 const StatusIcon = statusUI.icon

                 return (
                   <div key={schedule.id} className="relative z-10 flex flex-col md:flex-row gap-6">
                     {/* Date bubble */}
                     <div className="md:w-[110px] shrink-0 pt-1 flex md:justify-end">
                       <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 text-center shadow-sm w-fit md:w-full border border-slate-700">
                         <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">
                           {new Date(schedule.tanggal_kunjungan).toLocaleDateString('id-ID', { month: 'short' })}
                         </p>
                         <p className="text-[22px] font-black leading-none tracking-tight">
                           {new Date(schedule.tanggal_kunjungan).getDate()}
                         </p>
                       </div>
                     </div>

                     {/* Connector dot */}
                     <div className="hidden md:flex flex-col items-center pt-5">
                       <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-[3px] border-white shadow-sm relative z-10 ring-4 ring-blue-50"></div>
                     </div>

                     {/* Card */}
                     <div className="flex-1 bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                       <div className="relative z-10">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                           <span className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg border flex items-center gap-1.5 w-fit ${statusUI.color}`}>
                             <StatusIcon className="w-3.5 h-3.5" /> {statusUI.label}
                           </span>
                           <span className="text-[12px] font-extrabold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                             <Clock className="w-3.5 h-3.5 text-slate-400" /> Pukul {formatTime(schedule.tanggal_kunjungan)} WIB
                           </span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div>
                             <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Nama Teknisi</p>
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                                 <User className="w-5 h-5" />
                               </div>
                               <div>
                                 <p className="text-[14px] font-extrabold text-slate-800">{schedule.nama_teknisi}</p>
                                 <p className="text-[11px] font-medium text-slate-500">Petugas Lapangan</p>
                               </div>
                             </div>
                           </div>

                           {schedule.ticket && (
                             <div>
                               <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Terkait Tiket</p>
                               <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                 <p className="text-[12px] font-bold text-slate-700 truncate">
                                   {schedule.ticket.judul}
                                 </p>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 )
               })}
             </div>
           ) : (
             <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center">
               <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 shadow-sm">
                 <CalendarDays className="w-8 h-8" />
               </div>
               <h4 className="text-lg font-extrabold text-slate-800 mb-1">Belum Ada Jadwal Kunjungan</h4>
               <p className="text-[13px] font-medium text-slate-500 max-w-[320px] mx-auto leading-relaxed">
                 Saat ini tidak ada jadwal kunjungan teknisi ke lokasi Anda. Jadwal akan muncul di sini jika ada tiket kendala yang memerlukan perbaikan langsung.
               </p>
             </div>
           )}
        </div>

        {/* Right Column: Information Panel */}
        <div className="space-y-6">
           <h2 className="text-[15px] font-extrabold text-slate-800">Persiapan Kunjungan</h2>
           
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-[14px] font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                 <Info className="w-4 h-4 text-blue-500" /> Hal yang perlu diperhatikan
              </h3>
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                       Pastikan ada orang dewasa di rumah pada saat jadwal kedatangan teknisi untuk mendampingi proses pengecekan.
                    </p>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                       Siapkan akses ke area router/modem agar teknisi dapat langsung melakukan perbaikan fisik jika diperlukan.
                    </p>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                       Status <span className="font-bold text-blue-600">Teknisi Menuju Lokasi</span> menandakan teknisi kami sedang dalam perjalanan ke alamat Anda.
                    </p>
                 </li>
              </ul>
           </div>
        </div>

      </div>
    </div>
  )
}
