import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../services/api"

export type Ticket = {
  id: number
  user_id: number
  judul: string
  deskripsi: string
  status: "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "ditolak"
  prioritas: "rendah" | "sedang" | "tinggi"
  foto?: string | null
  created_at: string
  user?: {
    id: number
    name: string
  }
}

export function useTickets() {
  return useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await api.get("/tickets")
      return res.data
    },
    staleTime: 10000,
    gcTime: 300000,
    refetchInterval: 10000,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post("/tickets", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })
}

export function useAdminTickets() {
  return useQuery<Ticket[]>({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const res = await api.get("/admin/tickets")
      return res.data
    },
    refetchInterval: 5000,
  })
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch(`/admin/tickets/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })
}
