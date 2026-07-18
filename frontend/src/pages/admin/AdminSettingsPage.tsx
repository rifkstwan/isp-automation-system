import { useState, useEffect } from "react"
import { useSettings, useUpdateSettings, type SettingsMap } from "../../hooks/useSettings"
import {
   Building2,
   Mail,
   Phone,
   MapPin,
   Percent,
   Save,
   Loader2,
   CheckCircle2,
   ShieldAlert,
   MessageCircle,
   Key,
   AtSign,
   Server,
   User,
   Lock,
   CreditCard
} from "lucide-react"

export function AdminSettingsPage() {
   const { data: settings, isLoading } = useSettings()
   const updateSettings = useUpdateSettings()

   const [formData, setFormData] = useState<SettingsMap>({
      company_name: '',
      company_address: '',
      company_email: '',
      company_phone: '',
      tax_percentage: '0',
      maintenance_mode: 'false',
      wa_enabled: 'true',
      wa_api_url: '',
      wa_api_key: '',
      smtp_host: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
      smtp_from_name: '',
      midtrans_server_key: '',
      midtrans_client_key: '',
      midtrans_is_production: 'false'
   })

   const [showSuccess, setShowSuccess] = useState(false)

   // Populate form when data is loaded
   useEffect(() => {
      if (settings) {
         setFormData({
            company_name: settings.company_name || '',
            company_address: settings.company_address || '',
            company_email: settings.company_email || '',
            company_phone: settings.company_phone || '',
            tax_percentage: settings.tax_percentage || '0',
            maintenance_mode: settings.maintenance_mode || 'false',
            wa_enabled: settings.wa_enabled !== undefined ? settings.wa_enabled : 'true',
            wa_api_url: settings.wa_api_url || '',
            wa_api_key: settings.wa_api_key || '',
            smtp_host: settings.smtp_host || '',
            smtp_port: settings.smtp_port || '',
            smtp_username: settings.smtp_username || '',
            smtp_password: settings.smtp_password || '',
            smtp_from_name: settings.smtp_from_name || '',
            midtrans_server_key: settings.midtrans_server_key || '',
            midtrans_client_key: settings.midtrans_client_key || '',
            midtrans_is_production: settings.midtrans_is_production || 'false'
         })
      }
   }, [settings])

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({ ...prev, [name]: value }))
   }

   const handleToggle = (name: string) => {
      setFormData(prev => ({
         ...prev,
         [name]: prev[name] === 'true' ? 'false' : 'true'
      }))
   }

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      updateSettings.mutate(formData, {
         onSuccess: () => {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
         }
      })
   }

   if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-400" />
            <p className="text-sm font-medium">Memuat pengaturan...</p>
         </div>
      )
   }

   return (
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

         {/* Header Minimalist */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sistem & Integrasi API</h1>
               <p className="text-sm text-slate-500 mt-1">Kelola konfigurasi bisnis, Payment Gateway Midtrans, dan API WhatsApp Anda.</p>
            </div>
            <button
               onClick={handleSubmit}
               disabled={updateSettings.isPending}
               className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Simpan Perubahan
            </button>
         </div>

         {showSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
               <CheckCircle2 className="w-5 h-5 text-emerald-600" />
               <p className="text-sm font-medium">Pengaturan berhasil disimpan ke database!</p>
            </div>
         )}

         <form id="settings-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Profil Perusahaan */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
               <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">Profil Perusahaan</h2>
                  <p className="text-sm text-slate-500 mt-1">Informasi ini akan ditampilkan pada invoice dan halaman pelanggan.</p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Nama Bisnis</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                           type="text"
                           name="company_name"
                           value={formData.company_name}
                           onChange={handleChange}
                           className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                           placeholder="Misal: Citra Mandiri WiFi"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Email Kontak</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                           type="email"
                           name="company_email"
                           value={formData.company_email}
                           onChange={handleChange}
                           className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                           placeholder="support@domain.com"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Nomor Telepon / WhatsApp</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                           type="text"
                           name="company_phone"
                           value={formData.company_phone}
                           onChange={handleChange}
                           className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                           placeholder="081234567890"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Alamat Lengkap</label>
                     <div className="relative">
                        <div className="absolute top-2.5 left-3 pointer-events-none">
                           <MapPin className="h-4 w-4 text-slate-400" />
                        </div>
                        <textarea
                           name="company_address"
                           value={formData.company_address}
                           onChange={handleChange}
                           rows={3}
                           className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                           placeholder="Jl. Merdeka No. 123, Kota"
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Keuangan & Sistem Operasional */}
            <div className="space-y-6">

               {/* Keuangan */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                     <h2 className="text-lg font-bold text-slate-900">Keuangan & Pajak</h2>
                     <p className="text-sm text-slate-500 mt-1">Atur persentase pajak yang dibebankan ke tagihan.</p>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Pajak PPN (%)</label>
                        <div className="relative sm:w-1/2">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Percent className="h-4 w-4 text-slate-400" />
                           </div>
                           <input
                              type="number"
                              name="tax_percentage"
                              value={formData.tax_percentage}
                              onChange={handleChange}
                              min="0"
                              max="100"
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="11"
                           />
                        </div>
                        <p className="text-xs text-slate-500">Persentase ini akan otomatis ditambahkan ke tagihan bulanan pelanggan.</p>
                     </div>
                  </div>
               </div>

               {/* Sistem Operasional */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                     <h2 className="text-lg font-bold text-slate-900">Sistem Operasional</h2>
                     <p className="text-sm text-slate-500 mt-1">Kontrol akses portal secara menyeluruh.</p>
                  </div>

                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50">
                     <div className="flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                           <h3 className="text-sm font-bold text-slate-800">Mode Pemeliharaan (Maintenance)</h3>
                           <p className="text-xs text-slate-500 mt-1">Jika aktif, pelanggan tidak akan bisa mengakses portal atau melakukan pemesanan baru karena sistem sedang dalam perbaikan.</p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => handleToggle('maintenance_mode')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${formData.maintenance_mode === 'true' ? 'bg-red-500' : 'bg-slate-300'}`}
                        role="switch"
                        aria-checked={formData.maintenance_mode === 'true'}
                     >
                        <span className="sr-only">Use setting</span>
                        <span
                           aria-hidden="true"
                           className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.maintenance_mode === 'true' ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                     </button>
                  </div>
               </div>

               {/* Payment Gateway (Midtrans) */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                     <h2 className="text-lg font-bold text-slate-900">Payment Gateway (Midtrans)</h2>
                     <p className="text-sm text-slate-500 mt-1">Konfigurasi kunci API Midtrans untuk proses pembayaran otomatis.</p>
                  </div>

                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50">
                     <div className="flex gap-3">
                        <CreditCard className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                           <h3 className="text-sm font-bold text-slate-800">Mode Production (Asli)</h3>
                           <p className="text-xs text-slate-500 mt-1">Jika aktif, transaksi akan menggunakan uang asli. Jika mati, menggunakan mode Sandbox (Uji Coba).</p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => handleToggle('midtrans_is_production')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${formData.midtrans_is_production === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        role="switch"
                        aria-checked={formData.midtrans_is_production === 'true'}
                     >
                        <span className="sr-only">Toggle Production</span>
                        <span
                           aria-hidden="true"
                           className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.midtrans_is_production === 'true' ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Client Key (Untuk Frontend)</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Key className="h-4 w-4 text-slate-400" />
                           </div>
                           <input
                              type="text"
                              name="midtrans_client_key"
                              value={formData.midtrans_client_key}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="SB-Mid-client-XXXXX"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Server Key (Untuk Backend)</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400" />
                           </div>
                           <input
                              type="text"
                              name="midtrans_server_key"
                              value={formData.midtrans_server_key}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="SB-Mid-server-XXXXX"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Integrasi WhatsApp */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                     <h2 className="text-lg font-bold text-slate-900">Integrasi WhatsApp</h2>
                     <p className="text-sm text-slate-500 mt-1">Konfigurasi API Gateway (Fonnte, Meta Official Cloud API, Wablas) untuk mengirim pesan otomatis ke pelanggan.</p>
                  </div>

                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50">
                     <div className="flex gap-3">
                        <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                           <h3 className="text-sm font-bold text-slate-800">Aktifkan Notifikasi WhatsApp</h3>
                           <p className="text-xs text-slate-500 mt-1">Jika dimatikan, sistem tidak akan mengirimkan pesan WhatsApp (berguna saat pengujian/maintenance untuk mencegah spam).</p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => handleToggle('wa_enabled')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${formData.wa_enabled !== 'false' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        role="switch"
                        aria-checked={formData.wa_enabled !== 'false'}
                     >
                        <span className="sr-only">Toggle WhatsApp</span>
                        <span
                           aria-hidden="true"
                           className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.wa_enabled !== 'false' ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">URL Endpoint Provider API WA</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MessageCircle className="h-4 w-4 text-slate-400" />
                           </div>
                           <input 
                              type="text" 
                              name="wa_api_url"
                              value={formData.wa_api_url}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="Misal: https://graph.facebook.com/v19.0/PHONE_NUMBER_ID/messages atau https://api.fonnte.com/send"
                           />
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                           <p className="font-bold text-slate-700">Contoh Format Provider:</p>
                           <p>• <strong>Meta Official API (Resmi)</strong>: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-600">https://graph.facebook.com/v19.0/[ID_TELEPON]/messages</code></p>
                           <p>• <strong>Fonnte</strong>: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-600">https://api.fonnte.com/send</code></p>
                           <p>• <strong>Wablas</strong>: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-600">https://pati.wablas.com/api/send-message</code></p>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">API Key / Permanent Access Token</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Key className="h-4 w-4 text-slate-400" />
                           </div>
                           <input 
                              type="text" 
                              name="wa_api_key"
                              value={formData.wa_api_key}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="Masukkan Access Token / API Token rahasia"
                           />
                        </div>
                        <p className="text-[11px] text-slate-500">Untuk Meta Official API, masukkan Permanent Access Token dari Meta App Dashboard.</p>
                     </div>
                  </div>
               </div>

               {/* Integrasi Email (SMTP) */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                     <h2 className="text-lg font-bold text-slate-900">Integrasi Email (SMTP)</h2>
                     <p className="text-sm text-slate-500 mt-1">Konfigurasi server email untuk mengirim faktur dan notifikasi pesanan otomatis.</p>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-semibold text-slate-700">SMTP Host</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <Server className="h-4 w-4 text-slate-400" />
                              </div>
                              <input 
                                 type="text" 
                                 name="smtp_host"
                                 value={formData.smtp_host}
                                 onChange={handleChange}
                                 className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                                 placeholder="Misal: smtp.gmail.com"
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-semibold text-slate-700">SMTP Port</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <Server className="h-4 w-4 text-slate-400" />
                              </div>
                              <input 
                                 type="text" 
                                 name="smtp_port"
                                 value={formData.smtp_port}
                                 onChange={handleChange}
                                 className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                                 placeholder="Misal: 465 atau 587"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Username Email</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <AtSign className="h-4 w-4 text-slate-400" />
                           </div>
                           <input 
                              type="email" 
                              name="smtp_username"
                              value={formData.smtp_username}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="admin@domain.com"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Password Email / Aplikasi</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400" />
                           </div>
                           <input 
                              type="password" 
                              name="smtp_password"
                              value={formData.smtp_password}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="Masukkan password atau App Password"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Nama Pengirim (Sender Name)</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-slate-400" />
                           </div>
                           <input 
                              type="text" 
                              name="smtp_from_name"
                              value={formData.smtp_from_name}
                              onChange={handleChange}
                              className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                              placeholder="Misal: CV Citra Mandiri"
                           />
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </form>

      </div>
   )
}
