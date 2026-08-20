import { useState } from "react";
import { User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { C, inputStyle } from "../../styles/tokens";
import { Field, TextInput } from "../ui/UIKit";
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
      setErr("Ingresa tus credenciales.");
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
      // Gradiente oscuro profundo y profesional
      background: "radial-gradient(circle at top right, #1e293b, #0f172a)",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: 20,
      position: "relative",
    }}>
      {/* Elementos decorativos de fondo para dar profundidad */}
      <div style={{ position: "absolute", width: "400px", height: "400px", background: C.coral, opacity: "0.05", filter: "blur(100px)", borderRadius: "50%", top: "-100px", left: "-100px" }}></div>

      <div style={{ width: "100%", maxWidth: 400, zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>
            RUTA<span style={{ color: C.coral }}>CRM</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 8 }}>
            Gestión Inteligente de Campo
          </div>
        </div>

        {/* Contenedor con efecto Glassmorphism */}
        <div style={{ 
          background: "rgba(255, 255, 255, 0.05)", 
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 24, 
          padding: 32, 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
        }}>
          <Field label={<span style={{color: "#fff", opacity: 0.8}}>Correo electrónico</span>}>
            <div style={{ position: "relative" }}>
              <User size={18} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
              <TextInput value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="usuario@empresa.com" 
                style={{ ...inputStyle(false), paddingLeft: 40, background: "rgba(255,255,255,0.08)", border: "none", color: "#fff" }} />
            </div>
          </Field>

          <Field label={<span style={{color: "#fff", opacity: 0.8}}>Contraseña</span>}>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
              <input
                type={showP ? "text" : "password"} value={p}
                onChange={(e) => setP(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                style={{ ...inputStyle(false), paddingLeft: 40, paddingRight: 40, background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: "100%", boxSizing: "border-box" }}
              />
              <button onClick={() => setShowP(!showP)} style={{
                position: "absolute", right: 12, top: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
              }}>{showP ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </Field>

          {err && (
            <div style={{ color: "#fb7185", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={14} /> <span>{err}</span>
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: C.coral, color: "#fff", fontWeight: 700, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            marginTop: 8, transition: "transform 0.2s, background 0.2s"
          }}>
            {loading ? "Autenticando..." : "Ingresar al Sistema"}
          </button>
        </div>
        
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 24 }}>
          Acceso exclusivo para personal autorizado
        </div>
      </div>
    </div>
  );
}