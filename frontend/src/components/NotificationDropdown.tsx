import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, ArrowRight, Sparkles } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications, useMarkNotificationRead } from "../hooks/useNotifications"

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Baru saja"
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return "Kemarin"
  if (diffDays < 7) return `${diffDays} hari lalu`
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
    unreadBg: "bg-emerald-50/40",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
    unreadBg: "bg-amber-50/40",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
    dot: "bg-red-500",
    unreadBg: "bg-red-50/30",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    dot: "bg-blue-500",
    unreadBg: "bg-blue-50/40",
  },
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { roles } = useAuth()
  const { data: notifications = [] } = useNotifications()
  const markAsRead = useMarkNotificationRead()

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const previewNotifications = notifications.slice(0, 5)

  // Tentukan path notifikasi sesuai role
  const notifPath = roles.includes("admin")
    ? "/admin/notifications"
    : roles.includes("teknisi")
    ? "/technician"
    : "/dashboard/notifications"

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleNotificationClick = (id: number, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id)
    }
    setIsOpen(false)
    navigate(notifPath)
  }

  const handleViewAll = () => {
    setIsOpen(false)
    navigate(notifPath)
  }

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    notifications.filter((n) => !n.is_read).forEach((n) => markAsRead.mutate(n.id))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 transition-all rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen
            ? "bg-blue-50 border-blue-200 text-blue-600"
            : "bg-white border-slate-200/80 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        {/* Bell icon with animation when unread */}
        <Bell
          className={`w-5 h-5 transition-transform ${unreadCount > 0 && !isOpen ? "animate-[ring_2s_ease-in-out_infinite]" : ""}`}
          strokeWidth={2}
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-extrabold rounded-full border-2 border-white px-1 shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Pulse ring when has unread */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-400 animate-ping opacity-40 pointer-events-none" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] sm:w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right">

          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-[15px]">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center bg-red-100 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 mx-0" />

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Bell className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
                </div>
                <p className="text-[14px] font-bold text-slate-700">Semua bersih!</p>
                <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
                  Belum ada notifikasi untuk Anda saat ini.
                </p>
              </div>
            ) : (
              <div>
                {previewNotifications.map((notification, index) => {
                  const config = typeConfig[notification.type] || typeConfig.info
                  const Icon = config.icon
                  const isLast = index === previewNotifications.length - 1

                  return (
                    <div key={notification.id}>
                      <button
                        onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                        className={`w-full text-left px-5 py-4 flex gap-3 items-start transition-all group hover:bg-slate-50 ${
                          !notification.is_read ? "bg-blue-50/30" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border mt-0.5 ${config.bg} ${config.border}`}>
                          <Icon className={`w-4 h-4 ${config.iconColor}`} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[13px] leading-snug font-bold truncate ${!notification.is_read ? "text-slate-900" : "text-slate-700"}`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                                {timeAgo(notification.created_at)}
                              </span>
                              {!notification.is_read && (
                                <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                              )}
                            </div>
                          </div>
                          <p className={`text-[12px] mt-1 line-clamp-2 leading-relaxed ${!notification.is_read ? "text-slate-600" : "text-slate-400"}`}>
                            {notification.message}
                          </p>
                        </div>
                      </button>
                      {!isLast && <div className="h-px bg-slate-50 mx-5" />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer — View All */}
          {notifications.length > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <button
                onClick={handleViewAll}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-[13px] font-bold text-blue-600 hover:bg-blue-50 transition-colors group"
              >
                Lihat Semua Notifikasi
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Ring animation keyframes */}
      <style>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-15deg); }
          20% { transform: rotate(15deg); }
          30% { transform: rotate(-10deg); }
          40% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
