import { useNotifications, useMarkNotificationRead } from "../../hooks/useNotifications"
import { Bell, Check, Info, CheckCircle2, AlertTriangle, XCircle, Loader2, Settings, Mail } from "lucide-react"

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications()
  const markAsRead = useMarkNotificationRead()


  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm"><CheckCircle2 className="w-5 h-5"/></div>
      case "warning": return <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100 shadow-sm"><AlertTriangle className="w-5 h-5"/></div>
      case "error": return <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100 shadow-sm"><XCircle className="w-5 h-5"/></div>
      default: return <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100 shadow-sm"><Info className="w-5 h-5"/></div>
    }
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Pusat Notifikasi</h1>
            <p className="text-sm text-slate-500 mt-1">Pantau semua pemberitahuan sistem dan pesan penting Anda.</p>
         </div>
         {unreadCount > 0 && (
            <button 
              onClick={() => {
                notifications?.filter(n => !n.is_read).forEach(n => markAsRead.mutate(n.id))
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-[13px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
               <Check className="w-4 h-4" /> Tandai Semua Dibaca
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Notifications List */}
        <div className="xl:col-span-2 space-y-6">
           <h2 className="text-[15px] font-extrabold text-slate-800">Kotak Masuk</h2>

           {isLoading ? (
             <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
               <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500"/>
               <p className="font-bold text-sm text-slate-500">Memuat notifikasi...</p>
             </div>
           ) : notifications && notifications.length > 0 ? (
             <div className="space-y-6 relative pt-4">
               <div className="absolute left-[54px] top-8 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent hidden md:block z-0"></div>

               {notifications.map((notif) => (
                 <div key={notif.id} className="relative z-10 flex flex-col md:flex-row gap-6">
                      {/* Date bubble */}
                      <div className="md:w-[110px] shrink-0 pt-1 flex md:justify-end">
                         <div className={`rounded-2xl px-4 py-2.5 text-center shadow-sm w-fit md:w-full border ${notif.is_read ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-700 text-white'}`}>
                            <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-0.5 ${notif.is_read ? 'text-slate-400' : 'text-slate-400'}`}>
                              {new Date(notif.created_at).toLocaleDateString('id-ID', { month: 'short' })}
                            </p>
                            <p className="text-[22px] font-black leading-none tracking-tight">
                              {new Date(notif.created_at).getDate()}
                            </p>
                         </div>
                      </div>

                      {/* Connector dot */}
                      <div className="hidden md:flex flex-col items-center pt-5">
                         <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-white shadow-sm relative z-10 ring-4 ${notif.is_read ? 'bg-slate-300 ring-slate-100' : 'bg-blue-600 ring-blue-50'}`}></div>
                      </div>

                      {/* Card */}
                      <div className={`flex-1 rounded-2xl p-6 shadow-sm border transition-all relative overflow-hidden group ${
                        notif.is_read ? 'bg-white border-slate-200 hover:shadow-md' : 'bg-blue-50/40 border-blue-200 shadow-md ring-2 ring-blue-500/10'
                      }`}>
                         {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>}
                         
                         <div className="relative z-10 flex gap-4">
                            {getIcon(notif.type)}
                            
                            <div className="flex-1 min-w-0 pt-1">
                               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
                                  <h4 className={`text-[15px] font-extrabold truncate pr-4 ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                    {notif.title}
                                  </h4>
                                  <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                                    {new Date(notif.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                  </span>
                               </div>
                               
                               <p className={`text-[13px] leading-relaxed mb-4 ${notif.is_read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                                  {notif.message}
                               </p>
                               
                               {!notif.is_read && (
                                 <button 
                                    onClick={() => markAsRead.mutate(notif.id)}
                                    disabled={markAsRead.isPending}
                                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-500 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95 w-fit"
                                 >
                                    <Check className="w-3.5 h-3.5" /> Tandai Dibaca
                                 </button>
                               )}
                            </div>
                         </div>
                      </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center">
               <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 shadow-sm">
                 <Bell className="w-8 h-8" />
               </div>
               <h4 className="text-lg font-extrabold text-slate-800 mb-1">Tidak Ada Notifikasi Baru</h4>
               <p className="text-[13px] font-medium text-slate-500 max-w-[320px] mx-auto leading-relaxed">Semua notifikasi penting, pemberitahuan tagihan, dan pembaruan tiket akan muncul di sini.</p>
             </div>
           )}
        </div>

        {/* Right Column: Notification Summary & Settings Panel */}
        <div className="space-y-6">
           <h2 className="text-[15px] font-extrabold text-slate-800">Ringkasan</h2>
           
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${unreadCount > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <Mail className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pesan Belum Dibaca</p>
                    <p className={`text-2xl font-black ${unreadCount > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                      {unreadCount}
                    </p>
                 </div>
              </div>

              <div className="pt-5 border-t border-slate-100">
                 <h3 className="text-[13px] font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" /> Pengaturan Pemberitahuan
                 </h3>
                 <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-4">
                    Sistem secara otomatis akan mengirimkan pemberitahuan ke kotak masuk Anda ketika:
                 </p>
                 <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                       <span className="text-[11px] font-bold text-slate-600">Tagihan baru diterbitkan</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                       <span className="text-[11px] font-bold text-slate-600">Tagihan berhasil dilunasi</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                       <span className="text-[11px] font-bold text-slate-600">Status tiket pengaduan berubah</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                       <span className="text-[11px] font-bold text-slate-600">Jadwal kunjungan teknisi dibuat</span>
                    </li>
                 </ul>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
