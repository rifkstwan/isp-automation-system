import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { usePakets } from "../../hooks/usePakets"
import { useCreateOrder } from "../../hooks/useOrders"

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka)
}

export function OrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paketIdParam = searchParams.get("paket")

  const { data: pakets } = usePakets()
  const createOrder = useCreateOrder()

  const [paketId, setPaketId] = useState<number>(Number(paketIdParam) || 0)
  const [alamat, setAlamat] = useState("")
  const [catatan, setCatatan] = useState("")
  const [error, setError] = useState("")

  const selectedPaket = pakets?.find((p) => p.id === paketId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!paketId) return setError("Pilih paket terlebih dahulu")
    if (!alamat) return setError("Alamat instalasi wajib diisi")
    try {
      await createOrder.mutateAsync({ paket_id: paketId, alamat, catatan })
      navigate("/dashboard/orders")
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal membuat order")
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
         <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
           Anda belum memiliki paket layanan aktif. Silakan selesaikan pendaftaran dalam dua langkah mudah di bawah ini untuk mulai berlangganan internet.
         </p>
      </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold shadow-sm">
             <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">!</div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Pilih Paket */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 relative overflow-hidden">
            <h2 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
               <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-extrabold">1</span>
               Pilihan Paket
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pakets?.map((paket) => (
                <button
                  key={paket.id}
                  type="button"
                  onClick={() => setPaketId(paket.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group ${
                    paketId === paket.id
                      ? "border-blue-600 bg-blue-50/30 shadow-[0_2px_10px_-2px_rgba(37,99,235,0.15)]"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                     <div className="font-bold text-slate-800 text-[14px]">{paket.nama}</div>
                     {paketId === paket.id && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                           <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                     )}
                  </div>
                  <div className="text-[12px] text-blue-600 font-bold mb-3">{paket.kecepatan} Mbps <span className="text-slate-400 font-medium ml-1">Unlimited</span></div>
                  <div className="text-[14px] font-extrabold text-slate-800">{formatRupiah(paket.harga)}<span className="text-[11px] text-slate-400 font-medium">/bulan</span></div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Detail Instalasi */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
            <h2 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
               <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-extrabold">2</span>
               Detail Pemasangan
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none transition-all bg-slate-50 focus:bg-white"
                  placeholder="Contoh: Jl. Merdeka No. 10, RT 01/02..."
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan Khusus
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none transition-all bg-slate-50 focus:bg-white"
                  placeholder="Opsional: Tolong hubungi nomor saya..."
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createOrder.isPending || !paketId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-[13px] shadow-[0_2px_8px_-2px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {createOrder.isPending ? "Memproses Pesanan..." : "Konfirmasi & Pesan Sekarang"}
            </button>
          </div>
        </form>
    </div>
  )
}
