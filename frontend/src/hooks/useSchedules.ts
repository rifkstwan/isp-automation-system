import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../services/api"
import type { Ticket } from "./useTickets"

export type Schedule = {
  id: number
  user_id: number
  ticket_id: number | null
  order_id?: number | null
  nama_teknisi: string
  tanggal_kunjungan: string
  status: "menunggu" | "berangkat" | "pengerjaan" | "selesai" | "dibatalkan"
  created_at: string
  ticket?: Ticket
  order?: {
    id: number
    user?: {
      id: number
      name: string
      email: string
    }
    paket?: {
      id: number
      nama: string
    }
  }
  user?: {
    id: number
    name: string
    email: string
    phone?: string
    address?: string
  }
}

export function useSchedules() {
  return useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await api.get("/schedules/my")
      return res.data
    },
    refetchInterval: 5000,
  })
}

export function useAdminSchedules() {
  return useQuery<Schedule[]>({
    queryKey: ["admin-schedules"],
    queryFn: async () => {
      const res = await api.get("/admin/technician-schedules")
      return res.data
    },
    refetchInterval: 5000,
  })
}

export function useCreateAdminSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { ticket_id: number; nama_teknisi: string; tanggal_kunjungan: string }) => {
      const res = await api.post("/admin/technician-schedules", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }) // Invalidate tickets to reflect status change
    },
  })
}

export function useUpdateAdminScheduleStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch(`/admin/technician-schedules/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
    },
  })
}

export function useDeleteAdminSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/technician-schedules/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
    },
  })
}
