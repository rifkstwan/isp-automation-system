import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import "./LoginPage.css"
import bgImage from "../../assets/bg-login.jpeg"
import logoImg from "../../assets/profile.jpg"

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(name, email, phone, password)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Registrasi gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Kolom Kiri: Gambar Kota Malam dengan Jaringan */}
      <div className="login-image-section">
        <div className="login-image-wrapper">
          <div className="login-image-container" style={{ WebkitMask: 'url(#wavy-mask)', mask: 'url(#wavy-mask)' }}>
            {/* SVG Mask Definition (Mirrored: Top-Right and Bottom-Left) */}
            <svg width="100%" height="100%" style={{ position: 'absolute', pointerEvents: 'none' }}>
              <defs>
                <mask id="wavy-mask">
                  {/* Base white rounded rectangle (visible part) */}
                  <rect width="100%" height="100%" fill="white" rx="32" />

                  {/* Top-Left Cutout (black/hidden) placed at the top-left corner */}
                  <svg x="0" y="0" style={{ overflow: 'visible' }}>
                    <path d="M 0 0 L 104 0 A 24 24 0 0 0 80 24 L 80 56 A 24 24 0 0 1 56 80 L 24 80 A 24 24 0 0 0 0 104 Z" fill="black" />
                  </svg>

                  {/* Bottom-Right Cutout (black/hidden) placed at the bottom-right corner */}
                  <svg x="100%" y="100%" style={{ overflow: 'visible' }}>
                    <path transform="scale(-1, -1)" d="M 0 0 L 104 0 A 24 24 0 0 0 80 24 L 80 56 A 24 24 0 0 1 56 80 L 24 80 A 24 24 0 0 0 0 104 Z" fill="black" />
                  </svg>
                </mask>
              </defs>
            </svg>
            <img
              src={bgImage}
              className="login-image"
              onError={(e) => {
                // Fallback jika terjadi error
                e.currentTarget.src = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop";
              }}
              alt="Jaringan Kota"
            />
            <div className="login-image-overlay">
              <div className="login-image-text">
                Jelajahi koneksi tanpa batas untuk mendukung kehidupan digital Anda bersama CV. Citra Mandiri.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Form Register */}
      <div className="login-form-section">
        <div className="login-left-inner">
          <div className="login-logo-container">
            <img src={logoImg} alt="Logo" className="login-logo-img" />
            <span className="login-logo-text">CV.Citra Mandiri</span>
          </div>

          <div className="login-header">
            <h1>Buat Akun Baru</h1>
            <p>Silakan daftar untuk mulai menggunakan layanan kami</p>
          </div>

          {error && <div className="login-error">{error}</div>}



          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-filled-wrapper">
              <label htmlFor="name">Nama Lengkap</label>
              <input
                id="name"
                type="text"
                placeholder="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-filled-wrapper">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-filled-wrapper">
              <label htmlFor="phone">Nomor WhatsApp</label>
              <input
                id="phone"
                type="text"
                placeholder="Misal: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="input-filled-wrapper">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>



            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>

          <div className="login-footer-text">
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
