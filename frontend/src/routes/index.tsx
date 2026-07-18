import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { HomePage } from "../pages/public/HomePage"
import { LoginPage } from "../pages/auth/LoginPage"
import { RegisterPage } from "../pages/auth/RegisterPage"
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage"
import { UserDashboardLayout } from "../layouts/UserDashboardLayout"
import { UserDashboardPage } from "../pages/dashboard/UserDashboardPage"
import { ProfilePage } from "../pages/dashboard/ProfilePage"
import { MyOrdersPage } from "../pages/customer/MyOrdersPage"
import { AdminDashboardLayout } from "../layouts/AdminDashboardLayout"
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage"
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage"
import { AdminPaketsPage } from "../pages/admin/AdminPaketsPage"
import { AdminCustomersPage } from "../pages/admin/AdminCustomersPage"
import { AdminUpgradesPage } from "../pages/admin/AdminUpgradesPage"

import { AdminBillingPage } from "../pages/admin/AdminBillingPage"
import { AdminPaymentsPage } from "../pages/admin/AdminPaymentsPage"
import { AdminTicketsPage } from "../pages/admin/AdminTicketsPage"
import { AdminTechniciansPage } from "../pages/admin/AdminTechniciansPage"
import { AdminReportsPage } from "../pages/admin/AdminReportsPage"
import { AdminNotificationsPage } from "../pages/admin/AdminNotificationsPage"
import { AdminProfilePage } from "../pages/admin/AdminProfilePage"
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage"
import { AdminNetworkPage } from "../pages/admin/AdminNetworkPage"
import { AdminTestimonialsPage } from "../pages/admin/AdminTestimonialsPage"
import { TechnicianDashboardLayout } from "../layouts/TechnicianDashboardLayout"
import { TechnicianDashboardPage } from "../pages/technician/TechnicianDashboardPage"
import { TechnicianTicketsPage } from "../pages/technician/TechnicianTicketsPage"
import { TechnicianSchedulePage } from "../pages/technician/TechnicianSchedulePage"
import { TechnicianInstallationsPage } from "../pages/technician/TechnicianInstallationsPage"
import { TechnicianSurveysPage } from "../pages/technician/TechnicianSurveysPage"
import { TechnicianDocumentationPage } from "../pages/technician/TechnicianDocumentationPage"
import { TechnicianHistoryPage } from "../pages/technician/TechnicianHistoryPage"
import { TechnicianProfilePage } from "../pages/technician/TechnicianProfilePage"
import { ServicesPage } from "../pages/dashboard/ServicesPage"
import { BillingPage } from "../pages/dashboard/BillingPage"
import { TicketsPage } from "../pages/dashboard/TicketsPage"
import { SchedulePage } from "../pages/dashboard/SchedulePage"
import { NotificationsPage } from "../pages/dashboard/NotificationsPage"
import { SettingsPage } from "../pages/dashboard/SettingsPage"



function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: {
  children: React.ReactNode
  requiredRole?: string
  allowedRoles?: string[]
}) {
  const { token, roles, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/redirect" replace />
  }

  if (allowedRoles && !allowedRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/redirect" replace />
  }

  return <>{children}</>
}

function SmartRedirect() {
  const { token, roles, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>
  }

  if (!token) return <Navigate to="/login" replace />
  if (roles.includes("admin")) return <Navigate to="/admin" replace />
  if (roles.includes("teknisi")) return <Navigate to="/technician" replace />
  return <Navigate to="/dashboard" replace />
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/redirect" element={<SmartRedirect />} />

        {/* Customer */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardLayout>
                <UserDashboardPage />
              </UserDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/services" element={<ProtectedRoute><UserDashboardLayout><ServicesPage /></UserDashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/billing" element={<ProtectedRoute><UserDashboardLayout><BillingPage /></UserDashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/tickets" element={<ProtectedRoute><UserDashboardLayout><TicketsPage /></UserDashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/schedule" element={<ProtectedRoute><UserDashboardLayout><SchedulePage /></UserDashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/notifications" element={<ProtectedRoute><UserDashboardLayout><NotificationsPage /></UserDashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><UserDashboardLayout><SettingsPage /></UserDashboardLayout></ProtectedRoute>} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserDashboardLayout>
                <ProfilePage />
              </UserDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/services" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orders"
          element={
            <ProtectedRoute>
              <UserDashboardLayout>
                <MyOrdersPage />
              </UserDashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardLayout>
                <AdminDashboardPage />
              </AdminDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardLayout>
                <AdminOrdersPage />
              </AdminDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pakets"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardLayout>
                <AdminPaketsPage />
              </AdminDashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* Placeholder Routes for new sidebar menu */}
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardLayout>
                <AdminCustomersPage />
              </AdminDashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* Tagihan / Billing */}
        <Route path="/admin/billing" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminBillingPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminPaymentsPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminTicketsPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/technicians" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminTechniciansPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/network" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminNetworkPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminNotificationsPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminReportsPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/testimonials" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminTestimonialsPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminProfilePage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminSettingsPage /></AdminDashboardLayout></ProtectedRoute>} />
        <Route path="/admin/upgrades" element={<ProtectedRoute requiredRole="admin"><AdminDashboardLayout><AdminUpgradesPage /></AdminDashboardLayout></ProtectedRoute>} />

        {/* Technician only */}
        <Route
          path="/technician"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianDashboardPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/schedule"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianSchedulePage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/tickets"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianTicketsPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/network"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <AdminNetworkPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/installations"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianInstallationsPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/surveys"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianSurveysPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/documentation"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianDocumentationPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/history"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianHistoryPage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/profile"
          element={
            <ProtectedRoute allowedRoles={["teknisi", "admin"]}>
              <TechnicianDashboardLayout>
                <TechnicianProfilePage />
              </TechnicianDashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* End of routes */}

        <Route path="*" element={<Navigate to="/redirect" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
