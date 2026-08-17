import { useState } from "react";
import { User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { C, inputStyle, iconRow } from "../../styles/tokens";
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
      minHeight: "100vh", background: `linear-gradient(160deg, ${C.ink} 0%, ${C.inkSoft} 70%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "8%", right: "-8%", width: 260, height: 260,
        border: "3px solid rgba(255,255,255,0.12)", borderRadius: 16,
        transform: "rotate(18deg)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", color: "rgba(255,255,255,0.14)",
          fontSize: 22, fontWeight: 700, letterSpacing: "0.15em",
        }}>EN RUTA</span>
      </div>

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30,
            color: "#fff", letterSpacing: "-0.02em",
          }}>RUTA<span style={{ color: C.coral }}>·</span>CRM</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", color: "rgba(255,255,255,0.55)",
            fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4,
          }}>Gestión comercial de campo</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
          <Field label="Correo electrónico">
            <div style={{ position: "relative" }}>
              <User size={16} color={C.ink40} style={{ position: "absolute", left: 12, top: 12 }} />
              <TextInput value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="tu@correo.com" style={{ ...inputStyle(false), paddingLeft: 36 }} />
            </div>
          </Field>
          <Field label="Contraseña">
            <div style={{ position: "relative" }}>
              <Lock size={16} color={C.ink40} style={{ position: "absolute", left: 12, top: 12 }} />
              <input
                type={showP ? "text" : "password"} value={p}
                onChange={(e) => setP(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                style={{ ...inputStyle(false), paddingLeft: 36, paddingRight: 36 }}
              />
              <button onClick={() => setShowP(!showP)} style={{
                position: "absolute", right: 8, top: 8, background: "none", border: "none", cursor: "pointer", color: C.ink40,
                ...iconRow(0), justifyContent: "center", width: 20, height: 20,
              }}>{showP ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </Field>

          {err && (
            <div style={{ color: C.coral, fontSize: 13, marginBottom: 12, ...iconRow(6) }}>
              <AlertCircle size={14} /> <span>{err}</span>
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: C.coral, color: "#fff", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>{loading ? "Ingresando…" : "Ingresar"}</button>
        </div>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 16 }}>
          Los usuarios se crean desde el panel de Supabase (Authentication → Users)
        </div>
      </div>
    </div>
  );
}
