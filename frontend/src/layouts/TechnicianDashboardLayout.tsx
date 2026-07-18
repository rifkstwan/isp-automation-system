import { type ReactNode, useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../hooks/useNotifications"
import { NotificationDropdown } from "../components/NotificationDropdown"
import { useSettings } from "../hooks/useSettings"
import { 
  LayoutDashboard, 
  Calendar, 
  Wrench, 
  Package, 
  MapPin,
  Camera,
  History, 
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Activity,
  User
} from "lucide-react"
import logoImg from "../assets/profile.jpg"

type TechnicianDashboardLayoutProps = {
  children: ReactNode
}

export function TechnicianDashboardLayout({ children }: TechnicianDashboardLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { data: notifications } = useNotifications()
  const unreadTicketsCount = notifications?.filter(n => !n.is_read && (n as any).type === 'ticket_update').length || 0
  const unreadSchedulesCount = notifications?.filter(n => !n.is_read && ((n as any).type === 'order_update' || (n as any).type === 'schedule')).length || 0

  const { data: settings } = useSettings()
  const companyName = settings?.company_name || "CV. Citra Mandiri"

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.title = "Panel Teknisi - CV Citra Mandiri"
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  // Sidebar Menu Structure based on requirements
  const menuItems = [
    { name: "Dashboard", path: "/technician", icon: LayoutDashboard },
    { name: "Jadwal Saya", path: "/technician/schedule", icon: Calendar },
    { name: "Tiket Gangguan", path: "/technician/tickets", icon: Wrench },
    { name: "Monitoring Jaringan", path: "/technician/network", icon: Activity },
    { name: "Instalasi Baru", path: "/technician/installations", icon: Package },
    { name: "Survey Lokasi", path: "/technician/surveys", icon: MapPin },
    { name: "Dokumentasi", path: "/technician/documentation", icon: Camera },
    { name: "Riwayat Pekerjaan", path: "/technician/history", icon: History },
  ]

  const settingsMenu = [
    { name: "Profil", path: "/technician/profile", icon: User },
  ]

  const isActuallyAdmin = (user as any)?.roles?.includes('admin') || (user as any)?.role === 'admin'

  const currentMenuItem = [...menuItems, ...settingsMenu].find(item => 
    location.pathname === item.path || (item.path !== '/technician' && location.pathname.startsWith(item.path))
  )
  const pageTitle = currentMenuItem ? currentMenuItem.name : "Dashboard Teknisi"

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[260px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Brand / Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-blue-700 font-extrabold text-lg tracking-tight">
            <img 
              src={logoImg} 
              alt="Logo CV Citra Mandiri" 
              onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
              className="w-9 h-9 object-cover rounded-md drop-shadow-sm" 
            />
            <div className="hidden w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl flex items-center justify-center shadow-sm">
               {companyName.charAt(0)}
            </div>
            <span className="truncate">{companyName}</span>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 min-h-0 px-4 py-6 overflow-y-auto scrollbar-hide flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Pekerjaan Lapangan</div>
          {menuItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/technician' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex items-center justify-between px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white font-semibold shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                {active && (
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-md"></div>
                )}
                <div className="flex items-center gap-3">
                  <item.icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                  {item.name}
                </div>
                {item.name === "Tiket Gangguan" && unreadTicketsCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                    {unreadTicketsCount}
                  </span>
                )}
                {(item.name === "Jadwal Saya" || item.name === "Instalasi Baru") && unreadSchedulesCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                    {unreadSchedulesCount}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="mt-8 mb-2 px-2 border-t border-slate-100 pt-6">
             <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pengaturan</div>
          </div>
          {settingsMenu.map((item) => {
             const active = location.pathname.startsWith(item.path)
             return (
               <Link
                 key={item.name}
                 to={item.path}
                 onClick={() => setMobileMenuOpen(false)}
                 className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                   active
                     ? "bg-slate-900 text-white font-semibold shadow-sm"
                     : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                 }`}
               >
                  {active && (
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-md"></div>
                  )}
                  <item.icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                  {item.name}
               </Link>
             )
          })}
          
          {isActuallyAdmin && (
             <Link
               to="/admin"
               onClick={() => setMobileMenuOpen(false)}
               className="mt-2 relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
             >
                <ShieldAlert className="w-[18px] h-[18px]" strokeWidth={2} />
                Kembali ke Admin
             </Link>
          )}
        </nav>

        {/* Bottom User Profile Profile */}
        <div className="p-4 border-t border-slate-100">
           <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <img src={(user as any)?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || "Teknisi"}&background=f1f5f9&color=0f172a&bold=true`} alt="Avatar" className="w-10 h-10 rounded-full bg-white object-cover shadow-sm" />
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{user?.name || "Teknisi"}</h3>
                  <p className="text-xs text-slate-500 truncate">Teknisi Lapangan</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                 <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc]">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-10 z-20 sticky top-0">
           <div className="flex items-center gap-4">
              <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(true)}>
                 <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight hidden sm:block">{pageTitle}</h1>
           </div>

           <div className="flex items-center gap-3 md:gap-5">
              <NotificationDropdown />

              <div className="flex items-center gap-3 pl-3 md:pl-5 border-l border-slate-200">
                 <div className="hidden md:block text-right">
                    <p className="text-[14px] font-semibold text-slate-800 leading-tight">{user?.name || "Teknisi"}</p>
                    <p className="text-[11px] font-medium text-slate-500">Teknisi Lapangan</p>
                 </div>
                 <img src={(user as any)?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || "Teknisi"}&background=f1f5f9&color=0f172a&bold=true`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 object-cover" />
              </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 overflow-y-auto h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
