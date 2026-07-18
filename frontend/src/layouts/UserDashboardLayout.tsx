import { type ReactNode, useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useMyOrders } from "../hooks/useOrders"
import { useNotifications } from "../hooks/useNotifications"
import { NotificationDropdown } from "../components/NotificationDropdown"
import api from "../services/api"
import {
  LayoutDashboard,
  Globe,
  CreditCard,
  Wrench,
  CalendarDays,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  MoreHorizontal
} from "lucide-react"

type UserDashboardLayoutProps = {
  children: ReactNode
}

export function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const { user, logout, roles } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: orders, isLoading: isLoadingOrders } = useMyOrders()
  const { data: notifications } = useNotifications()

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = "Portal Pelanggan - CV Citra Mandiri"
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

  // Hitung status layanan aktif
  let statusText = "Nonaktif"
  let statusColor = "text-slate-700"
  let textMutedColor = "text-slate-500"
  let bgColor = "bg-slate-50"
  let borderColor = "border-slate-200"

  if (isLoadingOrders) {
    statusText = "..."
  } else if (orders) {
    if (orders.some(o => o.status === "aktif")) {
      statusText = "Aktif"
      statusColor = "text-emerald-800"
      textMutedColor = "text-emerald-700"
      bgColor = "bg-emerald-50/50"
      borderColor = "border-emerald-100"
    } else if (orders.some(o => o.status === "dibayar")) {
      statusText = "Menunggu Pemasangan"
      statusColor = "text-blue-800"
      textMutedColor = "text-blue-700"
      bgColor = "bg-blue-50/50"
      borderColor = "border-blue-100"
    } else if (orders.some(o => o.status === "pending")) {
      statusText = "Menunggu Pembayaran"
      statusColor = "text-amber-800"
      textMutedColor = "text-amber-700"
      bgColor = "bg-amber-50/50"
      borderColor = "border-amber-100"
    } else if (orders.some(o => o.status === "suspend")) {
      statusText = "Terisolir"
      statusColor = "text-red-800"
      textMutedColor = "text-red-700"
      bgColor = "bg-red-50/50"
      borderColor = "border-red-100"
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Layanan Saya", path: "/dashboard/services", match: ["/dashboard/services", "/order"], icon: Globe },
    { name: "Tagihan", path: "/dashboard/billing", match: ["/dashboard/billing", "/dashboard/orders"], icon: CreditCard },
    { name: "Pengaduan", path: "/dashboard/tickets", icon: Wrench },
    { name: "Jadwal Teknisi", path: "/dashboard/schedule", icon: CalendarDays },
    { name: "Notifikasi", path: "/dashboard/notifications", icon: Bell },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#f8fafc] border-r border-slate-200 flex-col hidden md:flex h-full shrink-0">

        {/* User Profile Row */}
        <div className="px-5 py-6 flex items-center justify-between cursor-pointer group hover:bg-slate-100/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=2563eb&color=fff&bold=true`} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 text-[14px] truncate">{user?.name || "Iquash"}</h3>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5 truncate">{roles?.[0] === 'admin' ? 'Administrator' : 'Pelanggan WiFi'}</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

        {/* Balance / Status Card */}
        <div className="px-5 pb-5">
          <div className={`rounded-xl p-4 border shadow-sm relative overflow-hidden transition-colors ${bgColor} ${borderColor}`}>
            <div className="flex justify-between items-center mb-1">
              <p className={`text-[11px] font-medium tracking-wide ${textMutedColor}`}>Status Layanan</p>
              <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <h4 className={`text-[15px] font-bold tracking-tight ${statusColor}`}>{statusText}</h4>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 min-h-0 px-3 flex flex-col justify-start space-y-1.5 pt-2 overflow-y-auto scrollbar-hide pb-4">
          {menuItems.map((item) => {
            const active = item.match ? item.match.includes(location.pathname) : location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${active
                    ? "bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                    <item.icon className={`w-4 h-4`} strokeWidth={active ? 2.5 : 2} />
                  </div>
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
        </nav>

        {/* Bottom Section: Profile, Settings, Logout */}
        <div className="mt-auto border-t border-slate-200/60 px-3 py-4 bg-[#f8fafc]">
          <div className="space-y-1.5">
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${location.pathname === "/profile" ? "bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/60" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent"
                }`}
            >
              <div className={`p-1.5 rounded-lg ${location.pathname === "/profile" ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                <User className="w-4 h-4" strokeWidth={location.pathname === "/profile" ? 2.5 : 2} />
              </div>
              Profil Saya
            </Link>

            <Link
              to="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${location.pathname === "/dashboard/settings" ? "bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/60" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent"
                }`}
            >
              <div className={`p-1.5 rounded-lg ${location.pathname === "/dashboard/settings" ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                <Settings className="w-4 h-4" strokeWidth={location.pathname === "/dashboard/settings" ? 2.5 : 2} />
              </div>
              Pengaturan
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all border border-transparent w-full"
            >
              <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-red-600">
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </div>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="h-[76px] bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all">
          
          {/* Left: Greeting / Date */}
          <div className="hidden md:flex flex-col">
            <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight leading-none mb-1">
              Halo, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-[12px] font-medium text-slate-500 leading-none">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 flex-1 justify-end">
            {/* Center/Right: Search Bar */}
            <div className="relative group" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
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
                placeholder="Cari layanan, tiket..."
                className="pl-11 pr-14 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-[13px] font-bold text-slate-800 placeholder-slate-400 w-56 md:w-72 focus:w-80 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-[10px] font-black text-slate-400 bg-white border border-slate-200 rounded-lg shadow-sm">
                   ⌘K
                 </kbd>
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && searchQuery.length >= 2 && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[400px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-50 bg-slate-50/80">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-2">Hasil Pencarian</p>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 text-center">
                         <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                         <p className="text-[13px] font-bold text-slate-500">Mencari data...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-2 space-y-1">
                        {searchResults.map((result) => (
                          <Link
                            key={result.id}
                            to={result.url}
                            onClick={() => {
                              setShowSearchDropdown(false)
                              setSearchQuery("")
                            }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              result.type === 'ticket' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              result.type === 'order' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              result.type === 'user' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {result.type === 'ticket' && <Wrench className="w-5 h-5" />}
                              {result.type === 'order' && <Globe className="w-5 h-5" />}
                              {result.type === 'user' && <User className="w-5 h-5" />}
                              {result.type === 'notification' && <Bell className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors">{result.title}</p>
                              <p className="text-[12px] font-medium text-slate-500 mt-0.5">{result.subtitle}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                         </div>
                         <p className="text-[14px] font-bold text-slate-800 mb-1">Tidak ditemukan</p>
                         <p className="text-[12px] text-slate-500">Coba gunakan kata kunci yang berbeda.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200/80 hidden sm:block"></div>

            {/* Right: Notifications */}
            <NotificationDropdown />
          </div>
        </header>

        <div className="p-8 pt-4 overflow-y-auto h-full pb-20">
          {children}
        </div>
      </main>
    </div>
  )
}
