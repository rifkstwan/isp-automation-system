import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../services/api"

export type Testimonial = {
  id: number
  user_id: number
  rating: number
  content: string
  role?: string
  is_published: boolean
  created_at: string
  user?: {
    name: string
    email?: string
  }
}

export type PublicTestimonial = {
  id: number
  quote: string
  name: string
  rating: number
  role: string
  avatar: string
}

// PUBLIC: Get testimonials for landing page
export function usePublicTestimonials() {
  return useQuery<PublicTestimonial[]>({
    queryKey: ["public-testimonials"],
    queryFn: async () => {
      const res = await api.get("/testimonials/public")
      return res.data
    },
  })
}

// CUSTOMER: Get their own testimonial
export function useMyTestimonial() {
  return useQuery<Testimonial | null>({
    queryKey: ["my-testimonial"],
    queryFn: async () => {
      const res = await api.get("/testimonials/my")
      if (!res.data || Object.keys(res.data).length === 0) return null
      return res.data
    },
  })
}

// CUSTOMER: Submit/update their testimonial
export function useSubmitTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { rating: number; content: string; role?: string }) => {
      const res = await api.post("/testimonials", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-testimonial"] })
    },
  })
}

// ADMIN: Get all testimonials
export function useAdminTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const res = await api.get("/admin/testimonials")
      return res.data
    },
  })
}

// ADMIN: Update publish status
export function useUpdateTestimonialStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: number; is_published: boolean }) => {
      const res = await api.patch(`/admin/testimonials/${id}/status`, { is_published })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] })
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] })
    },
  })
}

// ADMIN: Delete testimonial
export function useDeleteTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/testimonials/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] })
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] })
    },
  })
}
