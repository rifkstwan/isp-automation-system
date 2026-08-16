import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"
import logoImg from "../../assets/profile.jpg"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/forgot-password", { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #f8fafc 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      {/* Background decorations */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{
          position: "absolute", top: "-10%", right: "-5%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-5%",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "440px",
      }}>
        {/* Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "48px 40px",
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <img
              src={logoImg}
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

          {!sent ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", textAlign: "center" }}>
                  Lupa Password?
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
                  Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
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

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "24px" }}>
                  <label style={{
                    display: "block", fontSize: "13px", fontWeight: 700,
                    color: "#374151", marginBottom: "8px",
                  }}>
                    Alamat Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                      color: "#9ca3af", pointerEvents: "none",
                    }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      required
                      style={{
                        width: "100%", padding: "13px 14px 13px 44px",
                        fontSize: "14px", borderRadius: "12px",
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc", color: "#1e293b",
                        outline: "none", boxSizing: "border-box",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#3b82f6"
                        e.currentTarget.style.background = "#ffffff"
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0"
                        e.currentTarget.style.background = "#f8fafc"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
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
                      Mengirim...
                    </>
                  ) : "Kirim Link Reset Password"}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", boxShadow: "0 8px 20px rgba(16,185,129,0.2)",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                Email Terkirim!
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7, margin: "0 0 8px" }}>
                Link reset password telah dikirim ke:
              </p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 24px", background: "#eff6ff", padding: "8px 16px", borderRadius: "8px", display: "inline-block" }}>
                {email}
              </p>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 28px" }}>
                Periksa kotak masuk (dan folder spam) Anda. Link berlaku selama <strong style={{ color: "#64748b" }}>60 menit</strong>.
              </p>
              <button
                onClick={() => { setSent(false); setEmail("") }}
                style={{
                  background: "none", border: "1.5px solid #e2e8f0", borderRadius: "10px",
                  padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#64748b",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#374151" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b" }}
              >
                Kirim ulang ke email lain
              </button>
            </div>
          )}

          {/* Back to login */}
          <div style={{ textAlign: "center", marginTop: "28px" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "13px", fontWeight: 700, color: "#64748b", textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
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
