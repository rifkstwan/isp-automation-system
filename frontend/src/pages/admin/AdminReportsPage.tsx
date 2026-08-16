import { useState } from "react"
import { useReportSummary } from "../../hooks/useReports"
import { 
  DollarSign, 
  Users, 
  AlertTriangle, 
  Wrench, 
  Package, 
  CalendarDays,
  Loader2,
  Download,
  TrendingUp,
  Activity
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function AdminReportsPage() {
  const [period, setPeriod] = useState<'7d' | '1m' | '6m' | '1y'>('6m')
  const { data: report, isLoading } = useReportSummary(period)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-400" />
        <p className="text-sm font-medium">Memuat data analitik...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
        <AlertTriangle className="w-8 h-8 mb-4 text-slate-400" />
        <p className="text-sm font-medium">Gagal memuat laporan.</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8']

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(15, 23, 42)
    doc.text("Laporan Analitik Bisnis", 14, 20)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 26)

    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(14, 32, 196, 32)

    autoTable(doc, {
      startY: 40,
      head: [['Indikator Kinerja Utama', 'Nilai/Total']],
      body: [
        ['Total Pendapatan (Keseluruhan)', formatCurrency(report.total_pendapatan)],
        ['Pendapatan (Bulan Ini)', formatCurrency(report.pendapatan_bulan_ini)],
        ['Pelanggan Aktif', `${report.pelanggan_aktif} Orang`],
        ['Pelanggan Suspend/Ditolak', `${report.pelanggan_suspend} Orang`],
      ],
      theme: 'plain',
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.1 }
    })

    const finalY1 = (doc as any).lastAutoTable.finalY || 100

    autoTable(doc, {
      startY: finalY1 + 10,
      head: [['Ringkasan Operasional', 'Jumlah']],
      body: [
        ['Total Order Terdaftar', `${report.total_order} Order`],
        ['Order Menunggu Pemasangan', `${report.order_pending} Order`],
        ['Tiket Keluhan Aktif', `${report.tiket_aktif} Tiket`],
        ['Teknisi Bertugas Hari Ini', `${report.teknisi_bertugas} Orang`],
      ],
      theme: 'plain',
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.1 }
    })

    const finalY2 = (doc as any).lastAutoTable.finalY || 150

    const paketBody = report.paket_terlaris.map((p, i) => [i + 1, p.nama, `${p.total} Langganan`])
    
    autoTable(doc, {
      startY: finalY2 + 10,
      head: [['Peringkat', 'Paket Internet', 'Total Pengguna']],
      body: paketBody.length > 0 ? paketBody : [['-', 'Tidak ada data', '-']],
      theme: 'plain',
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.1 }
    })

    doc.save("Laporan-Ringkasan.pdf")
  }

  const periodLabels = {
    '7d': '7 Hari Terakhir',
    '1m': '1 Bulan Terakhir',
    '6m': '6 Bulan Terakhir',
    '1y': '1 Tahun Terakhir'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header Minimalist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Analitik</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan performa bisnis dan operasional.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Unduh PDF
        </button>
      </div>

      {/* KPI Cards (Minimalist Flat UI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Pendapatan Total</p>
            <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
               <DollarSign className="w-4 h-4 text-slate-600" strokeWidth={2.5}/>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(report.total_pendapatan)}</h3>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Pendapatan (Bulan Ini)</p>
            <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
               <TrendingUp className="w-4 h-4 text-slate-600" strokeWidth={2.5}/>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(report.pendapatan_bulan_ini)}</h3>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Pelanggan Aktif</p>
            <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
               <Users className="w-4 h-4 text-slate-600" strokeWidth={2.5}/>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{report.pelanggan_aktif}</h3>
            {report.pelanggan_suspend > 0 && (
               <span className="text-[11px] font-medium text-rose-600">({report.pelanggan_suspend} Ditangguhkan)</span>
            )}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Tiket Aktif</p>
            <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
               <Activity className="w-4 h-4 text-slate-600" strokeWidth={2.5}/>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{report.tiket_aktif} <span className="text-sm font-normal text-slate-500">Laporan</span></h3>
        </div>
      </div>

      {/* Mini Stats (Simple Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-slate-200 py-6 my-6">
         <div className="flex items-center gap-4 px-4 border-r border-slate-100 last:border-0 md:last:border-r-0">
            <Package className="w-5 h-5 text-slate-400 shrink-0"/>
            <div>
               <p className="text-xs font-medium text-slate-500">Total Keseluruhan Order</p>
               <p className="text-lg font-semibold text-slate-800">{report.total_order}</p>
            </div>
         </div>
         <div className="flex items-center gap-4 px-4 border-r border-slate-100 last:border-0 md:last:border-r-0">
            <Wrench className="w-5 h-5 text-slate-400 shrink-0"/>
            <div>
               <p className="text-xs font-medium text-slate-500">Pemasangan Tertunda</p>
               <p className="text-lg font-semibold text-slate-800">{report.order_pending}</p>
            </div>
         </div>
         <div className="flex items-center gap-4 px-4 border-r border-slate-100 last:border-0 md:last:border-r-0">
            <CalendarDays className="w-5 h-5 text-slate-400 shrink-0"/>
            <div>
               <p className="text-xs font-medium text-slate-500">Teknisi di Lapangan</p>
               <p className="text-lg font-semibold text-slate-800">{report.teknisi_bertugas} Orang</p>
            </div>
         </div>
      </div>

      {/* Charts Clean UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3">
               <h3 className="text-base font-bold text-slate-800">Riwayat Pendapatan Bersih</h3>
               <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{periodLabels[period]}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium self-start xl:self-auto">
               <button onClick={() => setPeriod('7d')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '7d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>7 Hari</button>
               <button onClick={() => setPeriod('1m')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '1m' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 Bulan</button>
               <button onClick={() => setPeriod('6m')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '6m' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>6 Bulan</button>
               <button onClick={() => setPeriod('1y')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '1y' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 Tahun</button>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={report.pendapatan_per_bulan} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                   dataKey="bulan" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#64748b', fontSize: 12}} 
                   dy={10} 
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#64748b', fontSize: 12}} 
                   tickFormatter={(val) => `Rp ${val / 1000000}M`}
                   width={70}
                />
                <Tooltip 
                   formatter={(value: any) => [formatCurrency(Number(value) || 0), "Pendapatan"]}
                   labelStyle={{ fontWeight: '600', color: '#0f172a' }}
                   contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '13px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0f172a" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorArea)" 
                  activeDot={{ r: 6, fill: '#0f172a' }} 
                  dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">Paket Terpopuler</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={report.paket_terlaris} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                   dataKey="nama" 
                   type="category" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#475569', fontSize: 12}} 
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   formatter={(value: any) => [`${value} Langganan`, "Total"]}
                   contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '13px' }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                  {report.paket_terlaris.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
