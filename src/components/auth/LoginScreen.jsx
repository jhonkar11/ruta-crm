import { useState } from "react";
import { User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { C } from "../../styles/tokens";
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
      // Fondo claro, elegante y moderno con un sutil gradiente gris/azulado luminoso
      background: "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #e2e8f0 100%)",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: 20,
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Destellos de luz difuminados en el fondo claro para dar volumen y realismo */}
      <div style={{
        position: "absolute",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(234, 88, 12, 0.12) 0%, rgba(255, 255, 255, 0) 70%)",
        top: "-100px",
        left: "-100px",
        borderRadius: "50%",
        filter: "blur(70px)",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(255, 255, 255, 0) 70%)",
        bottom: "-150px",
        right: "-150px",
        borderRadius: "50%",
        filter: "blur(90px)",
        zIndex: 0
      }} />

      {/* Tarjeta Central Oscura y Elegante (Contraste alto para máxima presencia) */}
      <div style={{ 
        width: "100%", 
        maxWidth: 440, 
        zIndex: 1,
        background: "#0f172a",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 32,
        padding: "40px 36px",
        boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
      }}>
        {/* Cabecera / Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            color: "#fff", 
            letterSpacing: "-0.5px",
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            RUTA<span style={{ color: C.coral }}>·</span>CRM
          </div>
          <div style={{ 
            color: "rgba(255, 255, 255, 0.5)", 
            fontSize: 11, 
            letterSpacing: "0.2em", 
            textTransform: "uppercase", 
            marginTop: 6,
            fontWeight: 600
          }}>
            Gestión Inteligente de Campo
          </div>
          <h2 style={{ 
            color: "#fff", 
            fontSize: 18, 
            fontWeight: 600, 
            marginTop: 24, 
            marginBottom: 0 
          }}>
            Iniciar sesión
          </h2>
        </div>

        {/* Formulario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          
          {/* Campo Correo */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                  padding: "13px 14px 13px 44px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 14,
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
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                  padding: "13px 44px 13px 44px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 14,
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
            <div style={{ color: "#fb7185", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: "rgba(251, 113, 133, 0.1)", padding: "8px 12px", borderRadius: 8 }}>
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
              borderRadius: 14, 
              border: "none",
              background: `linear-gradient(135deg, ${C.coral} 0%, #ea580c 100%)`, 
              color: "#fff", 
              fontWeight: 700, 
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer", 
              opacity: loading ? 0.7 : 1,
              marginTop: 10,
              boxShadow: "0 10px 25px rgba(234, 88, 12, 0.4)",
              transition: "transform 0.1s ease, box-shadow 0.2s ease"
            }}
          >
            {loading ? "Ingresando al Sistema…" : "Ingresar al Sistema"}
          </button>
        </div>

        {/* Pie de página dentro de la tarjeta */}
        <div style={{ 
          textAlign: "center", 
          color: "rgba(255, 255, 255, 0.35)", 
          fontSize: 11, 
          marginTop: 32,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: 20
        }}>
          © 2026 RUTA CRM · Gestión comercial de campo
        </div>
      </div>
    </div>
  );
}