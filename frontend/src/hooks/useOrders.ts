import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../services/api"

export type Order = {
  id: number
  paket_id: number
  status: "pending" | "dibayar" | "aktif" | "ditolak" | "selesai" | "suspend"
  alamat: string
  catatan: string
  total_harga: number
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  created_at: string
  ip_address?: string | null
  tipe_perangkat?: string | null
  upgrade_requests?: any[]
  paket: {
    id: number
    nama: string
    kecepatan: number
    harga: number
    durasi: number
    fup?: string | null
  }
}

export function useMyOrders() {
  return useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await api.get("/orders/my")
      return res.data
    },
    refetchInterval: 5000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      paket_id: number
      alamat: string
      catatan?: string
    }) => {
      const res = await api.post("/orders", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] })
    },
  })
}
