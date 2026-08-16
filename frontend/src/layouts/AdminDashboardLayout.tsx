import { type ReactNode, useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../hooks/useNotifications"
import { NotificationDropdown } from "../components/NotificationDropdown"
import { useSettings } from "../hooks/useSettings"
import api from "../services/api"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  Ticket,
  UserCog,
  ArrowUpCircle,
  Bell,
  PieChart,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  User,
  Activity,
  Star
} from "lucide-react"
import logoImg from "../assets/profile.jpg"

type AdminDashboardLayoutProps = {
  children: ReactNode
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: notifications } = useNotifications()
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  const { data: settings } = useSettings()
  const companyName = settings?.company_name || "CV. Citra Mandiri"

  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = "Admin Panel - CV Citra Mandiri"
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const delayDebounceFn = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => {
          setSearchResults(res.data)
        })
        .catch(err => console.error("Search error:", err))
        .finally(() => setIsSearching(false))
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  // Sidebar Menu Structure based on requirements
  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Manajemen Pelanggan", path: "/admin/customers", icon: Users },
    { name: "Manajemen Paket", path: "/admin/pakets", icon: Package },
    { name: "Manajemen Pemesanan", path: "/admin/orders", icon: ShoppingCart },
    { name: "Permintaan Upgrade", path: "/admin/upgrades", icon: ArrowUpCircle },
    { name: "Manajemen Tagihan", path: "/admin/billing", icon: Receipt },
    { name: "Pembayaran", path: "/admin/payments", icon: CreditCard },
    { name: "Tiket Gangguan", path: "/admin/tickets", icon: Ticket },
    { name: "Teknisi", path: "/admin/technicians", icon: UserCog },
    { name: "Monitoring Jaringan", path: "/admin/network", icon: Activity },
    { name: "Notifikasi", path: "/admin/notifications", icon: Bell },
    { name: "Laporan", path: "/admin/reports", icon: PieChart },
    { name: "Testimoni", path: "/admin/testimonials", icon: Star },
  ]

  const settingsMenu = [
    { name: "Sistem", path: "/admin/settings", icon: Settings },
    { name: "Profil Akun", path: "/admin/profile", icon: User },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 print:h-auto print:overflow-visible" style={{ fontFamily: "'Inter', sans-serif" }}>

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
        transform transition-transform duration-300 ease-in-out print:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Brand / Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-blue-700 font-extrabold text-lg tracking-tight">
            <img
              src={logoImg}
              alt="Logo CV Citra Mandiri"
              onError={(e) => {
                // Fallback if image is not found
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
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Menu Utama</div>
          {menuItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex items-center justify-between px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${active
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
                {item.name === "Notifikasi" && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                    {unreadCount}
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
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${active
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
        </nav>

        {/* Bottom User Profile Profile */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || "Admin"}&background=f1f5f9&color=0f172a&bold=true`} alt="Avatar" className="w-10 h-10 rounded-full bg-white object-cover shadow-sm" />
              <div className="overflow-hidden">
                <h3 className="font-semibold text-slate-900 text-sm truncate">{user?.name || "Admin"}</h3>
                <p className="text-xs text-slate-500 truncate">Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] print:overflow-visible print:bg-white">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 z-20 sticky top-0 print:hidden">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 hidden sm:block tracking-tight">Dashboard</h1>
          </div>

          <div className="flex items-center gap-5 lg:gap-8">
            <div className="relative hidden md:block" ref={searchRef}>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSearchDropdown(true)
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) setShowSearchDropdown(true)
                  }}
                  placeholder="Search anything..."
                  className="pl-10 pr-12 py-2.5 bg-slate-100/50 hover:bg-slate-100 border border-transparent rounded-xl text-[14px] w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400"
                />
                <div className="absolute right-3 flex items-center gap-1">
                  <kbd className="hidden lg:inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">⌘K</kbd>
                </div>
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hasil Pencarian</p>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto p-2">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Mencari...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <Link
                          key={result.id}
                          to={result.url}
                          onClick={() => {
                            setShowSearchDropdown(false)
                            setSearchQuery("")
                          }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors mb-1 last:mb-0"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50/50 text-blue-600 border border-blue-100/50">
                            <Search className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-slate-800">{result.title}</p>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{result.subtitle}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-[14px] text-slate-500 font-medium">Tidak ada hasil ditemukan</p>
                        <p className="text-[12px] text-slate-400 mt-1">Coba kata kunci lain.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 lg:gap-5">
              <NotificationDropdown />

              <div className="flex items-center gap-3 pl-3 lg:pl-5 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <p className="text-[14px] font-semibold text-slate-800 leading-tight">{user?.name || "Admin"}</p>
                  <p className="text-[11px] font-medium text-slate-500">Administrator</p>
                </div>
                <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || "Admin"}&background=f1f5f9&color=0f172a&bold=true`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 overflow-y-auto h-full print:overflow-visible print:p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
