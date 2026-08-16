import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Package, Users, Wrench, Wallet, ArrowUpRight } from "lucide-react"
import api from "../../services/api"
import type { Order } from "../../hooks/useOrders"
import { useReportSummary } from "../../hooks/useReports"

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka)
}

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6']

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '1m' | '6m' | '1y'>('6m')

  const { data: orders } = useQuery<(Order & { user: { name: string } })[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await api.get("/orders")
      return res.data
    },
    refetchInterval: 30000,
  })

  const { data: report, isLoading: reportLoading } = useReportSummary(period)

  if (reportLoading) {
     return <div className="flex h-full items-center justify-center text-slate-400">Loading dashboard data...</div>
  }

  const statusPieData = report?.status_breakdown 
    ? Object.entries(report.status_breakdown).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Pelanggan */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                 <Users className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-200">Total</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pelanggan</p>
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{report?.total_order || 0}</h3>
            </div>
          </div>
        </div>

        {/* Pelanggan Aktif */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <ArrowUpRight className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100">Live</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pelanggan Aktif</p>
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{report?.pelanggan_aktif || 0}</h3>
            </div>
          </div>
        </div>

        {/* Pendapatan */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                 <Wallet className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-100">Bulan Ini</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pendapatan</p>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{formatRupiah(report?.pendapatan_bulan_ini || 0)}</h3>
            </div>
          </div>
        </div>

        {/* Tiket Aktif */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-50 to-transparent rounded-bl-full z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                 <Wrench className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-orange-100">Gangguan</span>
            </div>
            <div className="flex items-end justify-between">
               <div>
                 <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiket Aktif</p>
                 <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{report?.tiket_aktif || 0}</h3>
               </div>
               <div className="text-right pb-1">
                 <p className="text-[11px] font-bold text-slate-500">{report?.teknisi_bertugas || 0} Teknisi</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Grafik Pendapatan</h2>
                 <p className="text-sm text-slate-500">Tren pemasukan pelanggan</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
                 <button onClick={() => setPeriod('7d')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '7d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>7 Hari</button>
                 <button onClick={() => setPeriod('1m')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '1m' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 Bulan</button>
                 <button onClick={() => setPeriod('6m')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '6m' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>6 Bulan</button>
                 <button onClick={() => setPeriod('1y')} className={`px-3 py-1.5 rounded-md transition-colors ${period === '1y' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 Tahun</button>
              </div>
           </div>

           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={report?.pendapatan_per_bulan || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="bulan" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#64748b', fontSize: 12 }} 
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#64748b', fontSize: 12 }}
                   tickFormatter={(val) => `Rp ${val / 1000000}M`}
                   width={70}
                 />
                 <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   formatter={(value: any) => [formatRupiah(Number(value) || 0), "Pendapatan"]}
                 />
                 <Bar 
                   dataKey="total" 
                   fill="#6366f1" 
                   radius={[6, 6, 6, 6]} 
                   barSize={32}
                 />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Right: Donut Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">Status Pelanggan</h2>
              <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">Lihat Semua</button>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={false}
                  >
                    {statusPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-xs text-slate-500 font-medium">Total</p>
                 <p className="text-xl font-bold text-slate-900">{report?.total_order || 0}</p>
              </div>
           </div>

           <div className="mt-4 space-y-3">
              {statusPieData.map((entry, index) => (
                 <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                       <span className="text-slate-600 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{entry.value}</span>
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* Bottom Area: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <h2 className="text-lg font-bold text-slate-900">Aktivitas Terbaru</h2>
              </div>
              <Link to="/admin/orders" className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors">Lihat Semua</Link>
           </div>

           <div className="space-y-4">
              {orders?.slice(0, 5).map((order) => (
                 <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                          order.status === 'aktif' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-slate-100 text-slate-600'
                       }`}>
                          {order.status === 'pending' ? <Package className="w-5 h-5" /> : 
                           order.status === 'aktif' ? <ArrowUpRight className="w-5 h-5" /> : 
                           <Package className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-800">{order.user.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Order {order.paket.nama}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          order.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          order.status === "aktif" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                          order.status === "ditolak" ? "bg-red-50 text-red-600 border border-red-200" :
                          "bg-slate-50 text-slate-600 border border-slate-200"
                       }`}>
                          {order.status.toUpperCase()}
                       </span>
                    </div>
                 </div>
              ))}
              {(!orders || orders.length === 0) && (
                 <p className="text-center text-sm text-slate-400 py-4">Belum ada aktivitas.</p>
              )}
           </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Paket Terlaris</h2>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                 <tr>
                   <th className="px-4 py-3 font-semibold rounded-l-lg">Paket</th>
                   <th className="px-4 py-3 font-semibold">Total Order</th>
                   <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {report?.paket_terlaris.map((paket, idx) => (
                   <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                     <td className="px-4 py-4 font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                           <Package className="w-4 h-4" />
                        </div>
                        {paket.nama}
                     </td>
                     <td className="px-4 py-4 text-slate-600 font-medium">
                        {paket.total}
                     </td>
                     <td className="px-4 py-4 text-right">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                           idx === 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                           idx === 1 ? 'text-blue-600 bg-blue-50 border-blue-100' :
                           'text-slate-600 bg-slate-50 border-slate-200'
                        }`}>
                           {idx === 0 ? 'Terlaris' : idx === 1 ? 'Diminati' : 'Biasa'}
                        </span>
                     </td>
                   </tr>
                 ))}
                 {(!report?.paket_terlaris || report.paket_terlaris.length === 0) && (
                   <tr>
                     <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Belum ada data paket terlaris</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  )
}
