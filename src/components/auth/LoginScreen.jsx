import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import bgLogin from "../../assets/bg-login.webp"; // Asegúrate de ajustar la ruta si guardaste la imagen en otra carpeta

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [p, setP] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email.trim() || !p) {
      setErr("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), p);
    } catch {
      setErr("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      // Usamos tu imagen real de fondo con efecto bokeh profesional
      backgroundImage: `url(${bgLogin})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: 20,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Capa sutil de oscurecimiento opcional para que la tarjeta resalte más sobre el fondo */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(11, 17, 32, 0.35)",
        zIndex: 0
      }} />

      {/* Tarjeta Central Glassmorphism Transparente */}
      <div style={{
        width: "100%",
        maxWidth: 440,
        position: "relative",
        zIndex: 1,
        background: "rgba(255, 255, 255, 0.08)", // Mayor transparencia para ver el fondo bokeh
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        borderRadius: 24,
        padding: 32,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
      }}>
        {/* Cabecera / Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "8px 14px",
            borderRadius: 20,
            marginBottom: 16
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12
            }}>
              <Zap size={14} />
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
              GESTIÓN INTELIGENTE DE CAMPO
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 44, letterSpacing: "-1px" }}>
            <span style={{ color: "#fff" }}>RUTA</span>
            <span style={{ color: "#E14E2A" }}>CRM</span>
          </div>
        </div>

        {/* Formulario */}
        <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 4 }}>
          Iniciar sesión
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
          Accede a tu ruta comercial
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Campo Correo */}
          <div>
            <label style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)", marginBottom: 8, display: "block", fontWeight: 600 }}>
              Correo electrónico
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 2 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="tu@empresa.com"
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  borderRadius: 12,
                  background: "rgba(248, 250, 252, 0.9)", // Ligeramente translúcido también para integrarse mejor
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#0F172A",
                  outline: "none",
                  fontSize: 14,
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)", marginBottom: 8, display: "block", fontWeight: 600 }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 2 }} />
              <input
                type={showP ? "text" : "password"}
                value={p}
                onChange={(e) => setP(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "14px 44px 14px 44px",
                  borderRadius: 12,
                  background: "rgba(248, 250, 252, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#0F172A",
                  outline: "none",
                  fontSize: 14,
                  boxSizing: "border-box"
                }}
              />
              <button
                onClick={() => setShowP(!showP)}
                type="button"
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  display: "flex",
                  padding: 0,
                  zIndex: 2
                }}
              >
                {showP ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {err && (
            <div style={{ color: "#fb7185", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: "rgba(251, 113, 133, 0.15)", padding: "10px 12px", borderRadius: 8 }}>
              <AlertCircle size={14} /> <span>{err}</span>
            </div>
          )}

          {/* Botón Principal con Glow */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #E14E2A, #FF6B4A)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 0 40px rgba(225,78,42,0.6), 0 10px 25px rgba(0,0,0,0.4)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 60px rgba(225,78,42,0.8), 0 12px 30px rgba(0,0,0,0.5)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 0 40px rgba(225,78,42,0.6), 0 10px 25px rgba(0,0,0,0.4)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Ingresando..." : "Ingresar al Sistema"}
          </button>
        </div>

        {/* Pie de tarjeta */}
        <div style={{
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 11,
          marginTop: 28,
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          paddingTop: 16
        }}>
          © 2026 RUTA CRM · Gestión comercial de campo
        </div>
      </div>
    </div>
  );
}