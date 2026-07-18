import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../contexts/AuthContext"
import api from "../../services/api"
import { User, ShieldCheck, Mail, MapPin, Phone, LogOut, CheckCircle2, AlertCircle, Camera, Bell } from "lucide-react"

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [address, setAddress] = useState(user?.address || "")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null)
  const [emailNotif, setEmailNotif] = useState(user?.email_notif ?? true)
  const [waNotif, setWaNotif] = useState(user?.wa_notif ?? true)


  // Keep state synced with auth user
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
      setAddress(user.address || "")
      setAvatarPreview(user.avatar_url || null)
      setEmailNotif(user.email_notif ?? true)
      setWaNotif(user.wa_notif ?? true)

      // Fallback: If user.address is blank, fetch latest order address
      if (!user.address) {
        api.get('/orders/my').then((res) => {
          if (res.data && res.data.length > 0) {
            const latestOrder = res.data[0]
            const cleanAlamat = (latestOrder.alamat || '').replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()
            if (cleanAlamat) {
              setAddress(cleanAlamat)
            }
          }
        }).catch(() => {})
      }
    }
  }, [user])


  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const updateProfile = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append("_method", "PUT")
      formData.append("name", name)
      formData.append("email", email)
      formData.append("phone", phone)
      formData.append("address", address)
      formData.append("email_notif", emailNotif ? "1" : "0")
      formData.append("wa_notif", waNotif ? "1" : "0")
      if (avatar) {
        formData.append("avatar", avatar)
      }
      const res = await api.post("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return res.data
    },
    onSuccess: () => {
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui!" })
      queryClient.invalidateQueries({ queryKey: ["me"] })
      setTimeout(() => setProfileMsg(null), 3000)
    },
    onError: (err: any) => {
      setProfileMsg({ type: "error", text: err.response?.data?.message || "Gagal memperbarui profil" })
    },
  })

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await api.put("/profile/password", {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      return res.data
    },
    onSuccess: () => {
      setPassMsg({ type: "success", text: "Password berhasil diubah!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPassMsg(null), 3000)
    },
    onError: (err: any) => {
      setPassMsg({ type: "error", text: err.response?.data?.message || "Gagal mengubah password" })
    },
  })

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="max-w-6xl space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profil & Pengaturan Akun</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data pribadi, kata sandi, dan preferensi notifikasi Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Form Edit */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Edit Profil */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full z-0 opacity-50 pointer-events-none"></div>
             
             <div className="p-6 md:p-8 relative z-10">
                <h2 className="text-[16px] font-extrabold text-slate-800 flex items-center gap-2 mb-6">
                   <User className="w-5 h-5 text-blue-500" /> Informasi Pribadi
                </h2>

                {profileMsg && (
                  <div className={`mb-6 p-4 rounded-xl text-[13px] font-bold flex items-center gap-2 ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                      : "bg-red-50 border border-red-100 text-red-600"
                  }`}>
                    {profileMsg.type === "success" ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                    {profileMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                   <div>
                     <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                           <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                        />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Alamat Email</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                           <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                        />
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                   <div>
                     <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">No. WhatsApp</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                           <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                        />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Alamat Pemasangan</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                           <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Jl. Merdeka No. 1..."
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                        />
                     </div>
                   </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                   <button
                     onClick={() => updateProfile.mutate()}
                     disabled={updateProfile.isPending}
                     className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95"
                   >
                     {updateProfile.isPending ? "Menyimpan..." : "Simpan Perubahan Profil"}
                   </button>
                </div>
             </div>
          </div>

          {/* Ganti Password */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-[16px] font-extrabold text-slate-800 flex items-center gap-2 mb-6">
               <ShieldCheck className="w-5 h-5 text-emerald-500" /> Keamanan & Kata Sandi
            </h2>

            {passMsg && (
              <div className={`mb-6 p-4 rounded-xl text-[13px] font-bold flex items-center gap-2 ${
                passMsg.type === "success"
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                  : "bg-red-50 border border-red-100 text-red-600"
              }`}>
                {passMsg.type === "success" ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                {passMsg.text}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi Baru</label>
                   <input
                     type="password"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                     placeholder="Min. 8 karakter"
                   />
                 </div>
                 <div>
                   <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Ulangi Kata Sandi Baru</label>
                   <input
                     type="password"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                     placeholder="••••••••"
                   />
                 </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                 <button
                   onClick={() => changePassword.mutate()}
                   disabled={changePassword.isPending}
                   className="px-6 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95"
                 >
                   {changePassword.isPending ? "Memproses..." : "Perbarui Kata Sandi"}
                 </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Avatar & Extras */}
        <div className="space-y-6">
           
           {/* Avatar Card */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
              <label className="relative w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-4xl font-black shrink-0 border border-slate-200 group transition-transform cursor-pointer overflow-hidden mb-4 hover:border-blue-500 hover:ring-4 hover:ring-blue-50">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" />
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ubah Foto</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAvatar(e.target.files[0])
                      setAvatarPreview(URL.createObjectURL(e.target.files[0]))
                    }
                  }} 
                />
              </label>
              
              <h3 className="text-[18px] font-extrabold text-slate-800 mb-1">{user?.name}</h3>
              <p className="text-[13px] font-medium text-slate-500 mb-4">{user?.email}</p>
              <span className="inline-flex items-center text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-md uppercase tracking-wider border border-blue-100">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'technician' ? 'Teknisi' : 'Pelanggan'}
              </span>
           </div>

           {/* Preferensi Notifikasi */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-[14px] font-extrabold text-slate-800 flex items-center gap-2 mb-5">
                 <Bell className="w-4 h-4 text-orange-500" /> Preferensi Notifikasi
              </h3>
              
              <div className="space-y-4">
                 <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                       <p className="text-[13px] font-bold text-slate-700">Notifikasi Email</p>
                       <p className="text-[11px] font-medium text-slate-500">Kirim struk tagihan ke email</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${emailNotif ? 'bg-blue-600' : 'bg-slate-300'}`} onClick={() => setEmailNotif(!emailNotif)}>
                       <div className={`w-4 h-4 rounded-full bg-white transition-transform ${emailNotif ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                 </label>
                 
                 <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                       <p className="text-[13px] font-bold text-slate-700">Notifikasi WhatsApp</p>
                       <p className="text-[11px] font-medium text-slate-500">Peringatan teknisi via WA</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${waNotif ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setWaNotif(!waNotif)}>
                       <div className={`w-4 h-4 rounded-full bg-white transition-transform ${waNotif ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                 </label>
              </div>
           </div>

           {/* Danger Zone */}
           <div className="bg-red-50/50 rounded-2xl p-6 border-2 border-dashed border-red-200 flex flex-col items-center text-center">
             <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <LogOut className="w-5 h-5" />
             </div>
             <h3 className="text-[14px] font-extrabold text-red-800 mb-1">Keluar Aplikasi</h3>
             <p className="text-[12px] font-medium text-red-600/80 mb-5 leading-relaxed">Sesi login akan diakhiri dan Anda akan dikembalikan ke halaman depan.</p>
             <button
               onClick={handleLogout}
               className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 shadow-sm font-bold py-2.5 rounded-xl text-[13px] transition-colors"
             >
               Log Out Sekarang
             </button>
           </div>

        </div>

      </div>
    </div>
  )
}
