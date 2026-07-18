import React, { useState, useEffect } from 'react'
import { X, Navigation, Copy, Check, ExternalLink, MessageSquare } from 'lucide-react'

export interface RecipientInfo {
  name?: string
  phone?: string
  address?: string
  latitude?: string
  longitude?: string
  packageName?: string
  code?: string
  scheduleTime?: string
  notes?: string
  type?: 'survey' | 'installation' | 'ticket' | 'billing' | 'general'
}

interface WhatsAppTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  role: 'admin' | 'technician'
  recipient: RecipientInfo
}

interface MessageTemplate {
  id: string
  title: string
  category: 'survey' | 'installation' | 'ticket' | 'billing' | 'general'
  text: (info: RecipientInfo) => string
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  role,
  recipient,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  const technicianTemplates: MessageTemplate[] = [
    {
      id: 'otw',
      title: 'OTW ke Lokasi',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, saya teknisi WiFi CV. Citra Mandiri sedang dalam perjalanan menuju lokasi Anda di ${
          info.address?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim() || 'alamat terdaftar'
        } untuk pengerjaan ${
          info.type === 'survey' ? 'survey lokasi' : info.type === 'ticket' ? 'perbaikan tiket gangguan' : 'pemasangan WiFi'
        }. Mohon dipastikan ada orang di rumah/lokasi. Terima kasih!`,
    },
    {
      id: 'confirm_schedule',
      title: 'Konfirmasi Jadwal',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, saya teknisi CV. Citra Mandiri ingin mengonfirmasi jadwal pengerjaan ${
          info.type === 'survey' ? 'survey' : info.type === 'ticket' ? 'penanganan tiket' : 'pemasangan'
        } pada ${info.scheduleTime || 'hari ini'} di lokasi ${
          info.address?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim() || ''
        }. Apakah Bpk/Ibu ada di tempat pada waktu tersebut?`,
    },
    {
      id: 'arrived',
      title: 'Sudah Tiba di Lokasi',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, tim teknisi CV. Citra Mandiri sudah berada di depan rumah / lokasi Anda (${
          info.address?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim() || ''
        }). Mohon bantuan petunjuk / pembukaan pintu. Terima kasih!`,
    },
    {
      id: 'ask_landmark',
      title: 'Tanya Patokan Alamat',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, saya teknisi CV. Citra Mandiri. Untuk mempermudah menuju lokasi Anda di ${
          info.address?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim() || ''
        }, boleh minta bantu share lokasi (Share Location WA) atau diberi patokan warna rumah/pagar? Terima kasih.`,
    },
    {
      id: 'completed',
      title: 'Pengerjaan Selesai',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, pengerjaan ${
          info.type === 'survey' ? 'survey lokasi' : info.type === 'ticket' ? 'perbaikan kendala' : 'pemasangan WiFi'
        }${info.code ? ` (ID: ${info.code})` : ''} telah selesai dilakukan. Silakan dites koneksi internetnya. Jika ada kendala, dapat menghubungi kami kembali. Terima kasih telah mempercayai CV. Citra Mandiri!`,
    },
    {
      id: 'reschedule',
      title: 'Kendala & Reschedule',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, mohon maaf ada penyesuaian jadwal kunjungan teknisi karena kendala cuaca / teknis di lapangan. Kami akan mengonfirmasi kembali jam kedatangan. Terima kasih atas pengertiannya.`,
    },
  ]

  const adminTemplates: MessageTemplate[] = [
    {
      id: 'admin_order_confirm',
      title: 'Konfirmasi Permohonan',
      category: 'survey',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, kami dari Admin CV. Citra Mandiri mengenai permohonan ${
          info.type === 'survey' ? 'survey lokasi' : 'pemasangan baru'
        } untuk paket ${info.packageName || ''} di ${
          info.address?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim() || ''
        }. Tim teknisi kami akan segera memproses dan menjadwalkan kunjungan ke lokasi Anda. Terima kasih!`,
    },
    {
      id: 'admin_ticket_update',
      title: 'Response Tiket Kendala',
      category: 'ticket',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, laporan kendala Anda${
          info.code ? ` dengan nomor Tiket #${info.code}` : ''
        } telah diterima dan sedang diproses oleh tim teknisi CV. Citra Mandiri. Kami akan mengabari perkembangan perbaikannya. Terima kasih!`,
    },
    {
      id: 'admin_billing_reminder',
      title: 'Pengingat Tagihan',
      category: 'billing',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, kami dari Admin CV. Citra Mandiri mengingatkan bahwa tagihan layanan internet WiFi Anda${
          info.notes ? ` (${info.notes})` : ''
        } sudah terbit. Pembayaran dapat dilakukan via portal pelanggan atau transfer bank resmi kami. Terima kasih.`,
    },
    {
      id: 'admin_general',
      title: 'Layanan Pelanggan',
      category: 'general',
      text: (info) =>
        `Halo Bpk/Ibu ${info.name || 'Pelanggan'}, terima kasih telah menghubungi CS / Admin CV. Citra Mandiri. Boleh dibantu ada yang bisa kami jelaskan lebih lanjut mengenai layanan internet WiFi Anda?`,
    },
  ]

  const templates = role === 'technician' ? technicianTemplates : adminTemplates

  useEffect(() => {
    if (isOpen) {
      const defaultTpl = templates[0]
      setSelectedTemplateId(defaultTpl ? defaultTpl.id : 'custom')
      setCustomMessage(defaultTpl ? defaultTpl.text(recipient) : '')
      setCopied(false)
    }
  }, [isOpen, recipient, role])

  if (!isOpen) return null

  const handleSelectTemplate = (tpl: MessageTemplate) => {
    setSelectedTemplateId(tpl.id)
    setCustomMessage(tpl.text(recipient))
  }

  const getCleanPhone = (phoneStr?: string) => {
    if (!phoneStr) return ''
    let clean = phoneStr.replace(/[^0-9]/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    return clean
  }

  const cleanPhone = getCleanPhone(recipient.phone)

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) {
      alert('Nomor HP pelanggan tidak valid atau kosong.')
      return
    }
    const encoded = encodeURIComponent(customMessage)
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenMaps = () => {
    const lat = recipient.latitude
    const lng = recipient.longitude
    const alamat = recipient.address || ''

    let mapUrl = ''
    if (lat && lng) {
      mapUrl = `https://www.google.com/maps?q=${lat},${lng}`
    } else {
      const combined = alamat
      const urlMatch =
        combined.match(/(https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.app\.goo\.gl[^\s]*|goo\.gl\/maps[^\s]*))/i) ||
        combined.match(/(https?:\/\/[^\s]+)/i)

      if (urlMatch) {
        mapUrl = urlMatch[0]
      } else {
        const coordMatch = combined.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
        if (coordMatch) {
          mapUrl = `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`
        } else {
          const cleanAddress = alamat.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim()
          mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress || alamat)}`
        }
      }
    }
    window.open(mapUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Hubungi Pelanggan via WA
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {recipient.name || 'Pelanggan'} • {recipient.phone || 'Nomor HP tidak ada'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action bar: Maps & Details */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Alamat Pelanggan
              </span>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {recipient.address?.replace(/(?:Link|Titik)\s*Maps:[\s\S]*/i, '').trim() || 'Tidak ada alamat'}
              </p>
            </div>
            <button
              onClick={handleOpenMaps}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              Navigasi Maps
            </button>
          </div>

          {/* Template Selection Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Pilih Template Pesan Instan
            </label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tpl.title}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pratinjau Pesan (Bisa Diedit)
              </label>
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin Pesan
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value)
                setSelectedTemplateId('custom')
              }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-sans"
              placeholder="Ketik atau pilih template di atas..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleOpenWhatsApp}
            disabled={!cleanPhone}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            Buka WhatsApp (wa.me)
          </button>
        </div>
      </div>
    </div>
  )
}
