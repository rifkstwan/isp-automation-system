import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import api from "../../services/api"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const isTokenMissing = !token || !email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirm) {
      setError("Password dan konfirmasi password tidak cocok.")
      return
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }

    setLoading(true)
    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
      })
      setSuccess(true)
      setTimeout(() => navigate("/login"), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Token tidak valid atau sudah kadaluarsa.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "13px 14px 13px 44px",
    fontSize: "14px", borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc", color: "#1e293b",
    outline: "none", boxSizing: "border-box" as const,
    transition: "all 0.2s", fontFamily: "inherit",
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #f8fafc 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      {/* Decorations */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "440px" }}>
        <div style={{
          background: "#ffffff", borderRadius: "24px", padding: "48px 40px",
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <img
              src="/src/assets/profile.jpg"
              alt="Logo CV Citra Mandiri"
              style={{
                width: "64px", height: "64px", borderRadius: "16px",
                objectFit: "cover", margin: "0 auto 12px",
                boxShadow: "0 8px 20px rgba(59,130,246,0.2)",
                border: "2px solid #e2e8f0",
                display: "block",
              }}
            />
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase", margin: 0 }}>
              CV Citra Mandiri
            </p>
          </div>

          {/* Invalid Token */}
          {isTokenMissing ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Link Tidak Valid</h2>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
                Link reset password tidak valid atau sudah kadaluarsa.
              </p>
              <Link to="/forgot-password" style={{
                display: "inline-block", background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                color: "white", fontWeight: 700, fontSize: "14px", textDecoration: "none",
                padding: "12px 28px", borderRadius: "12px",
              }}>
                Minta Link Baru
              </Link>
            </div>
          ) : success ? (
            /* Success state */
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", boxShadow: "0 8px 20px rgba(16,185,129,0.2)",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Password Berhasil Direset!</h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7, margin: "0 0 24px" }}>
                Password Anda telah diperbarui. Anda akan diarahkan ke halaman login dalam beberapa detik...
              </p>
              <Link to="/login" style={{
                display: "inline-block", background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                color: "white", fontWeight: 700, fontSize: "14px", textDecoration: "none",
                padding: "12px 28px", borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(59,130,246,0.35)",
              }}>
                Login Sekarang
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", textAlign: "center" }}>
                  Buat Password Baru
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
                  Password baru harus berbeda dari password lama Anda.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
                  padding: "12px 16px", marginBottom: "20px",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 600 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email (readonly) */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                    Email
                  </label>
                  <div style={{
                    padding: "13px 14px", fontSize: "14px", borderRadius: "12px",
                    border: "1.5px solid #e2e8f0", background: "#f1f5f9", color: "#94a3b8",
                    fontFamily: "inherit",
                  }}>
                    {email}
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                    Password Baru
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      style={{ ...inputStyle, paddingRight: "48px" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px" }}>
                      {showPassword
                        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      }
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{
                          height: "3px", flex: 1, borderRadius: "2px",
                          background: password.length >= (i + 1) * 2
                            ? password.length < 6 ? "#ef4444" : password.length < 10 ? "#f59e0b" : "#10b981"
                            : "#e2e8f0",
                          transition: "background 0.3s",
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                    Konfirmasi Password Baru
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Ulangi password baru"
                      required
                      style={{
                        ...inputStyle,
                        paddingRight: "48px",
                        borderColor: passwordConfirm && password !== passwordConfirm ? "#fca5a5" : "#e2e8f0",
                        background: passwordConfirm && password !== passwordConfirm ? "#fff5f5" : "#f8fafc",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)" }}
                      onBlur={(e) => {
                        const mismatch = passwordConfirm && password !== passwordConfirm
                        e.currentTarget.style.borderColor = mismatch ? "#fca5a5" : "#e2e8f0"
                        e.currentTarget.style.background = mismatch ? "#fff5f5" : "#f8fafc"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px" }}>
                      {showConfirm
                        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      }
                    </button>
                  </div>
                  {passwordConfirm && password !== passwordConfirm && (
                    <p style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, marginTop: "6px" }}>Password tidak cocok</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", padding: "14px",
                    background: loading ? "#93c5fd" : "linear-gradient(135deg, #1e40af, #3b82f6)",
                    color: "#ffffff", fontWeight: 800, fontSize: "15px",
                    border: "none", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 4px 15px rgba(59,130,246,0.35)",
                    transition: "all 0.2s", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  {loading ? (
                    <>
                      <svg style={{ animation: "spin 1s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.2} /><path d="M21 12A9 9 0 003 12" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : "Simpan Password Baru"}
                </button>
              </form>
            </>
          )}

          {/* Back to login */}
          <div style={{ textAlign: "center", marginTop: "28px" }}>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: 700, color: "#64748b", textDecoration: "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke halaman login
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
