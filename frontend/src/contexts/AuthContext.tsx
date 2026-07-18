import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import api from "../services/api"

export type User = {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  avatar?: string
  avatar_url?: string
  email_notif?: boolean
  wa_notif?: boolean
  role?: string
}

type AuthContextType = {
  user: User | null
  roles: string[]
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get("/me")
        .then((res) => {
          setUser(res.data.user)
          setRoles(res.data.roles)
        })
        .catch(() => {
          localStorage.removeItem("token")
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post("/login", { email, password })
    const { token: newToken, user: newUser, roles: newRoles } = res.data
    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(newUser)
    setRoles(newRoles)
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    const res = await api.post("/register", {
      name,
      email,
      phone,
      password,
      password_confirmation: password,
    })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(newUser)
    setRoles(["customer"])
  }

  const logout = async () => {
    await api.post("/logout")
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    setRoles([])
  }

  return (
    <AuthContext.Provider value={{ user, roles, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
