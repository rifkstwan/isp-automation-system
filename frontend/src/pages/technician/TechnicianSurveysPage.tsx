import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Navigation, MapPin, CheckCircle2, Ruler, Globe, Phone, Calendar, User } from "lucide-react"
import { useState } from "react"
import api from "../../services/api"
import { WhatsAppTemplateModal, type RecipientInfo } from "../../components/WhatsAppTemplateModal"

export function TechnicianSurveysPage() {
  const queryClient = useQueryClient()
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waRecipient, setWaRecipient] = useState<RecipientInfo>({})

  // Fetch Orders pending survey
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["technician-installations"],
    queryFn: async () => {
      const res = await api.get("/technician/installations")
      return res.data
    },
    refetchInterval: 5000,
  })

  // Fetch Public Survey Requests from Landing Page
  const { data: surveyRequests = [], isLoading: isLoadingSurveys } = useQuery({
    queryKey: ["technician-survey-requests"],
    queryFn: async () => {
      const res = await api.get("/technician/survey-requests")
      return res.data
    },
    refetchInterval: 5000,
  })

  const activeOrders = orders.filter((order: any) => order.status === "pending" || order.status === "dibayar")
  const activePublicSurveys = surveyRequests.filter((req: any) => req.status === "pending" || req.status === "dijadwalkan")

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await api.patch(`/technician/installations/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-installations"] })
    },
  })

  const updateSurveyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await api.patch(`/technician/survey-requests/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-survey-requests"] })
      queryClient.invalidateQueries({ queryKey: ["public-verified-locations"] })
    },
  })

  const isLoading = isLoadingOrders || isLoadingSurveys
  const totalActive = activeOrders.length + activePublicSurveys.length

  const handleMapsOpen = (alamat: string, lat?: string, lng?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
      return
    }
    const urlMatch = alamat.match(/(https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.app\.goo\.gl[^\s]*|goo\.gl\/maps[^\s]*))/i)
    if (urlMatch) {
      window.open(urlMatch[0], '_blank')
    } else {
      const cleanAddress = alamat.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress || alamat)}`, '_blank')
    }
  }

  const handleWhatsAppOpen = (phoneStr: string, name?: string, address?: string, latitude?: string, longitude?: string, packageName?: string) => {
    if (!phoneStr) {
      alert("Nomor telepon tidak tersedia.")
      return
    }
    setWaRecipient({
      name: name || "Pelanggan",
      phone: phoneStr,
      address: address || "",
      latitude: latitude,
      longitude: longitude,
      packageName: packageName,
      type: "survey"
    })
    setWaModalOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Survey Lokasi Pemasangan</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar calon pelanggan &amp; pengajuan landing page yang menunggu pengecekan jalur kabel fiber optik.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Menarik data permohonan survey...</div>
      ) : totalActive === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Semua Lokasi Telah Disurvey</h3>
          <p className="text-slate-500 text-sm mt-1">Belum ada calon pelanggan baru yang memerlukan survey lokasi saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Public Survey Requests from Landing Page */}
          {activePublicSurveys.map((survey: any) => (
            <div key={`srv-${survey.id}`} className="bg-white rounded-2xl border border-blue-200/80 shadow-sm overflow-hidden flex flex-col h-full relative">
              <div className="p-5 border-b border-slate-100 bg-blue-50/40">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100">
                    <Globe className="w-3.5 h-3.5" />
                    Request Landing Page
                  </span>
                  <span className="text-xs font-bold text-slate-400">#SRV-{survey.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">Pengajuan Survey Baru</h3>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm">
                    {survey.nama.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{survey.nama}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {survey.phone}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-4 flex-1 border border-slate-100 space-y-2">
                  <div className="flex gap-2 items-start">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700 text-xs mb-0.5">Alamat / Pin Maps</p>
                      <p className="leading-relaxed text-xs">{survey.alamat}</p>
                    </div>
                  </div>
                  {survey.nama_teknisi && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" /> Teknisi: {survey.nama_teknisi}
                      </span>
                      {survey.tanggal_survey && (
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(survey.tanggal_survey).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                  {survey.catatan && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <p className="font-bold text-slate-700 text-[11px] mb-0.5">Catatan Khusus</p>
                      <p className="italic text-slate-500 text-xs">{survey.catatan}</p>
                    </div>
                  )}
                </div>


                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleMapsOpen(survey.alamat, survey.latitude, survey.longitude)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-500" /> Buka Maps
                  </button>
                  <button
                    onClick={() => handleWhatsAppOpen(survey.phone, survey.nama, survey.alamat, survey.latitude, survey.longitude, survey.paket_interest)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Hubungi
                  </button>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (window.confirm("Tolak permohonan survey ini? (Di luar batas jangkauan)")) {
                        updateSurveyStatus.mutate({ id: survey.id, status: 'ditolak' })
                      }
                    }}
                    disabled={updateSurveyStatus.isPending}
                    className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 py-3 rounded-xl font-bold text-[13px] transition-colors"
                  >
                    Tolak Survey
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Konfirmasi Lokasi Layak? Sistem akan memperbarui status area ini menjadi terjangkau.")) {
                        updateSurveyStatus.mutate({ id: survey.id, status: 'layak' })
                      }
                    }}
                    disabled={updateSurveyStatus.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-[13px] transition-colors"
                  >
                    Lokasi Layak
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Orders pending survey */}
          {activeOrders.map((order: any) => (
            <div key={`ord-${order.id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-100">
                    <Ruler className="w-3.5 h-3.5" />
                    Survey Pesanan Baru
                  </span>
                  <span className="text-xs font-bold text-slate-400">#ORD-{order.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">Calon Pelanggan</h3>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 text-sm">
                    {order.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{order.user.name}</p>
                    <p className="text-xs text-slate-500">{order.user.phone || order.user.email}</p>
                  </div>
                </div>

                <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-4 flex-1 border border-slate-100">
                  <div className="flex gap-2 items-start mb-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700 text-xs mb-1">Alamat Pemasangan</p>
                      <p className="leading-relaxed">{order.alamat_pemasangan || order.alamat}</p>
                    </div>
                  </div>
                  {order.catatan && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="font-bold text-slate-700 text-xs mb-1">Catatan Pelanggan</p>
                      <p className="italic text-slate-500 text-xs">{order.catatan}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => handleMapsOpen(order.alamat_pemasangan || order.alamat || "")}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-500" /> Navigasi Maps
                  </button>
                  <button 
                    onClick={() => handleWhatsAppOpen(order.user?.phone || "", order.user?.name, order.alamat_pemasangan || order.alamat, order.latitude, order.longitude, order.paket?.nama)}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Hubungi
                  </button>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (window.confirm("Tolak pemasangan? (Lokasi tidak terjangkau kabel/ODP penuh)")) {
                        updateOrderStatus.mutate({ id: order.id, status: 'ditolak' })
                      }
                    }}
                    disabled={updateOrderStatus.isPending}
                    className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 py-3 rounded-xl font-bold text-[13px] transition-colors"
                  >
                    Tolak Pemasangan
                  </button>
                  <button
                    onClick={() => {
                      alert("Laporan kelayakan lokasi telah dikirim ke Admin.")
                    }}
                    disabled={updateOrderStatus.isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-[13px] transition-colors"
                  >
                    Lokasi Layak
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
      {/* Modal WhatsApp Template */}
      <WhatsAppTemplateModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        role="technician"
        recipient={waRecipient}
      />
    </div>
  )
}
