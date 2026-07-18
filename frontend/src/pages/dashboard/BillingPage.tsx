import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../contexts/AuthContext"
import api from "../../services/api"
import { CheckCircle2, Clock, Download, AlertCircle, ArrowRight, Wallet, Info, FileText } from "lucide-react"
import { useMidtrans } from "../../hooks/useMidtrans"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function BillingPage() {
  const { user } = useAuth()

  // Fetch Billings
  const { data: billings = [], refetch } = useQuery({
    queryKey: ["my-billings"],
    queryFn: async () => {
      const res = await api.get("/my-billings")
      return res.data
    },
    refetchInterval: 5000,
  })

  // Fetch All Orders
  const { data: allOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const res = await api.get("/orders/my")
      return res.data || []
    },
    refetchInterval: 5000,
  })

  const pendingOrders = allOrders.filter((o: any) => o.status === 'pending');
  const paidOrders = allOrders.filter((o: any) => ['dibayar', 'aktif', 'selesai', 'suspend'].includes(o.status));

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
  }

  const { isReady: isMidtransReady } = useMidtrans()
  const [isPaying, setIsPaying] = useState<number | null>(null)

  const handlePayment = async (id: number, isOrder = false) => {
    try {
      setIsPaying(isOrder ? -id : id) // use negative for order to differentiate state if needed, but let's just use it
      // Call endpoint for Billing token
      const res = await api.post(isOrder ? `/orders/${id}/pay` : `/billings/${id}/pay`)
      const snapToken = res.data.snap_token

      // @ts-ignore
      window.snap.pay(snapToken, {
        onSuccess: async function () {
          try {
            await api.post(isOrder ? `/orders/${id}/demo-pay-success` : `/billings/${id}/demo-pay-success`)
          } catch (e) {
            console.error(e)
          }
          alert("Pembayaran berhasil!");
          refetch();
          refetchOrders();
        },
        onPending: function () {
          alert("Menunggu pembayaran Anda!");
          refetch();
          refetchOrders();
        },
        onError: function () {
          alert("Pembayaran gagal!");
          setIsPaying(null)
        },
        onClose: function () {
          setIsPaying(null)
        }
      })
    } catch (error) {
      console.error(error)
      alert("Gagal memproses pembayaran tagihan. Pastikan Midtrans Key sudah diset.")
      setIsPaying(null)
    }
  }

  const handleDownloadInvoice = (item: any) => {
    const doc = new jsPDF()
    const isOrder = item.isOrder

    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(37, 99, 235)
    doc.text("CITRA MANDIRI WIFI", 14, 25)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Layanan Internet Super Cepat", 14, 32)
    doc.text("Jl. Tlogosari Raya No. 12", 14, 37)
    doc.text("Semarang, Jawa Tengah, Indonesia", 14, 42)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(30)
    doc.setTextColor(230, 230, 230)
    doc.text("INVOICE", 196, 25, { align: "right" })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.text("Nomor Invoice", 150, 32)
    doc.text("Tanggal Terbit", 150, 37)
    doc.text("Jatuh Tempo", 150, 42)
    doc.text("Status", 150, 47)

    const invNumber = isOrder ? `ORD-${String(item.id).padStart(5, '0')}` : `INV-${String(item.id).padStart(5, '0')}`
    
    doc.setFont("helvetica", "normal")
    doc.text(`: ${invNumber}`, 175, 32)
    doc.text(`: ${formatDate(item.created_at)}`, 175, 37)
    doc.text(`: ${formatDate(isOrder ? item.created_at : item.jatuh_tempo)}`, 175, 42)

    doc.setTextColor(34, 197, 94)
    doc.setFont("helvetica", "bold")
    doc.text(": LUNAS", 175, 47)

    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(14, 53, 196, 53)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text("DITAGIHKAN KEPADA:", 14, 63)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    doc.text(`Bpk/Ibu ${user?.name || "Pelanggan"}`, 14, 70)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(user?.email || "-", 14, 76)

    const startY = 85

    autoTable(doc, {
      startY: startY,
      head: [['Deskripsi Tagihan', 'ID Langganan', 'Nominal']],
      body: [
        [
          isOrder ? `Biaya Pemasangan: ${item.paket?.nama || "Instalasi Baru"}` : `Tagihan Bulanan: ${item.order?.paket?.nama || "Paket Internet"}`,
          isOrder ? `-` : `#${item.order_id}`,
          formatRupiah(isOrder ? item.total_harga : item.jumlah_tagihan)
        ],
      ],
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        halign: 'left',
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        halign: 'left',
      },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' }
      },
      theme: 'plain',
      styles: {
        cellPadding: 6,
        fontSize: 10,
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      }
    })

    const finalY = (doc as any).lastAutoTable.finalY || startY + 20

    doc.setFillColor(248, 250, 252)
    doc.rect(120, finalY + 5, 76, 30, 'F')

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Subtotal", 125, finalY + 13)
    doc.text("PPN (11%)", 125, finalY + 20)

    doc.text(formatRupiah(isOrder ? item.total_harga : item.jumlah_tagihan), 191, finalY + 13, { align: "right" })
    doc.text("Termasuk", 191, finalY + 20, { align: "right" })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text("Total Tagihan", 125, finalY + 29)
    doc.text(formatRupiah(isOrder ? item.total_harga : item.jumlah_tagihan), 191, finalY + 29, { align: "right" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text("Catatan Tambahan:", 14, finalY + 13)
    doc.setTextColor(100, 100, 100)
    doc.text("1. Harap bayar tagihan ini sebelum melewati batas jatuh tempo.", 14, finalY + 18)
    doc.text("2. Keterlambatan pembayaran dapat menyebabkan suspensi layanan.", 14, finalY + 23)

    doc.setFont("helvetica", "italic")
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text("Terima kasih telah mempercayakan konektivitas Anda kepada kami.", 105, 280, { align: "center" })

    doc.save(`Invoice_Tagihan_${invNumber}.pdf`)
  }

  const unpaidBillings = billings.filter((b: any) => b.status === "unpaid" || b.status === "overdue")
  
  // Combine paid billings and paid orders
  const paidBillingsRaw = billings.filter((b: any) => b.status === "paid").map((b:any) => ({
    ...b,
    isOrder: false,
    dateValue: new Date(b.tanggal_bayar || b.updated_at).getTime()
  }));

  const paidOrdersFormatted = paidOrders.map((o: any) => ({
    ...o,
    isOrder: true,
    dateValue: new Date(o.tanggal_mulai || o.updated_at).getTime()
  }));

  const allPaidHistory = [...paidBillingsRaw, ...paidOrdersFormatted].sort((a, b) => b.dateValue - a.dateValue);

  return (
    <div className="max-w-6xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tagihan & Pembayaran</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola dan pantau semua tagihan internet bulanan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Active Billings */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-[15px] font-extrabold text-slate-800">Menunggu Pembayaran</h2>
          
          {unpaidBillings.length > 0 || pendingOrders.length > 0 ? (
            <div className="space-y-4">
              {/* Pending Orders (Instalasi) */}
              {pendingOrders.map((order: any) => (
                <div key={`order-${order.id}`} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200 border-l-4 border-l-blue-500 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 text-blue-600 border-blue-100">
                         <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-extrabold text-slate-800 text-lg">ORD-{String(order.id).padStart(5, '0')}</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-blue-100 text-blue-700">
                               Biaya Instalasi
                            </span>
                         </div>
                         <p className="text-[13px] font-medium text-slate-500 mb-3">{order.paket?.nama || "Pemasangan Baru"}</p>
                         
                         <div className="flex items-center gap-2 text-[12px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Batas Bayar: <span className="text-slate-600">Segera</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col justify-between items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="text-right">
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Biaya</p>
                         <p className="text-2xl font-black text-slate-800 tracking-tight">{formatRupiah(order.total_harga)}</p>
                      </div>
                      <button
                        onClick={() => handlePayment(order.id, true)}
                        disabled={isPaying === -order.id || !isMidtransReady}
                        className="w-full md:w-auto px-6 py-2.5 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800">
                        {!isMidtransReady ? "Memuat Gateway..." : isPaying === -order.id ? "Memproses..." : "Bayar Sekarang"} <ArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}

              {/* Tagihan Bulanan */}
              {unpaidBillings.map((billing: any) => (
                <div key={`billing-${billing.id}`} className={`bg-white rounded-2xl p-6 shadow-sm border ${billing.status === 'overdue' ? 'border-red-200 border-l-4 border-l-red-500' : 'border-slate-200 border-l-4 border-l-orange-500'} flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow`}>
                   
                   {/* Info Tagihan */}
                   <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${billing.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                         {billing.status === 'overdue' ? <AlertCircle className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-extrabold text-slate-800 text-lg">INV-{String(billing.id).padStart(5, '0')}</h3>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${billing.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                               {billing.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Lunas'}
                            </span>
                         </div>
                         <p className="text-[13px] font-medium text-slate-500 mb-3">{billing.order?.paket?.nama}</p>
                         
                         <div className="flex items-center gap-2 text-[12px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Batas Bayar: <span className={billing.status === 'overdue' ? 'text-red-600' : ''}>{formatDate(billing.jatuh_tempo)}</span>
                         </div>
                      </div>
                   </div>

                   {/* Aksi & Harga */}
                   <div className="flex flex-col justify-between items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="text-right">
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Tagihan</p>
                         <p className="text-2xl font-black text-slate-800 tracking-tight">{formatRupiah(billing.jumlah_tagihan)}</p>
                      </div>
                      <button
                        onClick={() => handlePayment(billing.id)}
                        disabled={isPaying === billing.id || !isMidtransReady}
                        className={`w-full md:w-auto px-6 py-2.5 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 ${billing.status === 'overdue' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                        {!isMidtransReady ? "Memuat Gateway..." : isPaying === billing.id ? "Memproses..." : "Bayar Sekarang"} <ArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 mb-1">Semua Tagihan Lunas!</h4>
              <p className="text-[13px] font-medium text-slate-500 max-w-sm">Terima kasih telah melakukan pembayaran internet Anda tepat waktu. Nikmati terus layanan kami.</p>
            </div>
          )}
        </div>

        {/* Right Column: Info & Summary */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-[14px] font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                 <Info className="w-4 h-4 text-blue-500" /> Informasi Pembayaran
              </h3>
              <ul className="space-y-3">
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">Sistem pembayaran kami dikelola otomatis oleh <span className="font-bold text-slate-800">Midtrans</span>. Verifikasi berjalan secara instan.</p>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">Keterlambatan pembayaran melewati batas jatuh tempo dapat menyebabkan layanan internet diisolir sementara.</p>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">Jika tagihan sudah dibayar namun status belum berubah, harap tunggu 5-10 menit lalu muat ulang halaman ini.</p>
                 </li>
              </ul>
           </div>
        </div>

      </div>

      {/* Riwayat Pembayaran (Lunas) */}
      <div className="pt-4">
        <h2 className="text-[15px] font-extrabold text-slate-800 mb-5">Riwayat Pelunasan</h2>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Invoice</th>
                <th className="p-4">Deskripsi Layanan</th>
                <th className="p-4">Tgl Pembayaran</th>
                <th className="p-4">Total Bayar</th>
                <th className="p-4 pr-6 text-right">Unduh</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {allPaidHistory.length > 0 ? (
                allPaidHistory.map((item: any) => (
                  <tr key={`${item.isOrder ? 'order' : 'billing'}-${item.id}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-emerald-50 text-emerald-600 border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800">
                          {item.isOrder ? `ORD-${String(item.id).padStart(5, '0')}` : `INV-${String(item.id).padStart(5, '0')}`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700">
                        {item.isOrder ? item.paket?.nama || "Instalasi Baru" : item.order?.paket?.nama || "Tagihan Bulanan"}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {item.isOrder ? "Biaya Pemasangan" : `Langganan #${item.order_id}`}
                      </p>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">
                      {item.isOrder 
                        ? formatDate(item.tanggal_mulai || item.updated_at) 
                        : (item.tanggal_bayar ? formatDate(item.tanggal_bayar) : '-')}
                    </td>
                    <td className="p-4 font-black text-slate-800">
                      {formatRupiah(item.isOrder ? item.total_harga : item.jumlah_tagihan)}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => handleDownloadInvoice(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 inline-flex" title="Download Invoice PDF">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                       <FileText className="w-8 h-8 mb-3 opacity-20" />
                       <span className="font-bold text-[13px]">Belum ada riwayat pelunasan.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
