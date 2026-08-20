import { useState } from "react";
import { User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

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
    } catch (e) {
      setErr("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B1120",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: 20,
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Blobs de luz CSS puros (Rápido, elegante y sin imágenes pesadas) */}
      <div style={{
        position: "absolute",
        top: "-15%",
        left: "-10%",
        width: 800,
        height: 800,
        background: "radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)",
        filter: "blur(80px)",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        bottom: "-20%",
        right: "-10%",
        width: 700,
        height: 700,
        background: "radial-gradient(circle, rgba(225,78,42,0.22), transparent 70%)",
        filter: "blur(80px)",
        zIndex: 0
      }} />

      {/* Tarjeta Central Glassmorphism */}
      <div style={{ 
        width: "100%", 
        maxWidth: 440, 
        zIndex: 1,
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 24,
        padding: "36px 32px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Cabecera / Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ 
            fontSize: 36, 
            fontWeight: 800, 
            color: "#fff", 
            letterSpacing: "-0.5px",
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            RUTA<span style={{ color: "#E14E2A" }}>·</span>CRM
          </div>
          <div style={{ 
            color: "rgba(255, 255, 255, 0.5)", 
            fontSize: 11, 
            letterSpacing: "0.15em", 
            textTransform: "uppercase", 
            marginTop: 6,
            fontWeight: 600
          }}>
            Gestión Inteligente de Campo
          </div>
          <div style={{ 
            color: "#fff", 
            fontSize: 18, 
            fontWeight: 700, 
            marginTop: 22, 
            marginBottom: 4 
          }}>
            Iniciar sesión
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Accede a tu ruta comercial
          </div>
        </div>

        {/* Formulario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Campo Correo */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Correo electrónico o Usuario
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} color="rgba(255,255,255,0.4)" style={{ position: "absolute", left: 14, top: 14 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="tu@empresa.com"
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: "absolute", left: 14, top: 14 }} />
              <input
                type={showP ? "text" : "password"}
                value={p}
                onChange={(e) => setP(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "14px 44px 14px 44px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <button 
                onClick={() => setShowP(!showP)} 
                style={{
                  position: "absolute", right: 14, top: 14, background: "none", border: "none", 
                  cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", padding: 0
                }}
              >
                {showP ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {err && (
            <div style={{ color: "#fb7185", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: "rgba(251, 113, 133, 0.1)", padding: "10px 12px", borderRadius: 8 }}>
              <AlertCircle size={14} /> <span>{err}</span>
            </div>
          )}

          {/* Botón Principal */}
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
              marginTop: 6,
              boxShadow: "0 0 30px rgba(225,78,42,0.4)",
              transition: "transform 0.1s ease, box-shadow 0.2s ease"
            }}
          >
            {loading ? "Ingresando..." : "Ingresar al Sistema"}
          </button>
        </div>

        {/* Pie de página */}
        <div style={{ 
          textAlign: "center", 
          color: "rgba(255, 255, 255, 0.35)", 
          fontSize: 11, 
          marginTop: 28,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: 16
        }}>
          © 2026 RUTA CRM · Gestión comercial de campo
        </div>
      </div>
    </div>
  );
}