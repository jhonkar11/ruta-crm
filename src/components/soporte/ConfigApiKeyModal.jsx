import { useState, useEffect } from "react";
import { Key, CheckCircle, AlertCircle, RefreshCw, X, Shield, Sparkles, Server } from "lucide-react";
import { C } from "../../styles/tokens";
import { testGeminiApiKey, estadoMotorIA, MODELOS_GEMINI } from "../../services/geminiService";

/**
 * Modal de diagnóstico del motor de IA.
 *
 * Ya NO se introduce ni se guarda ninguna API Key aquí: la GEMINI_API_KEY vive
 * únicamente como variable de entorno en Vercel y el navegador nunca la ve.
 */
export default function ConfigApiKeyModal({ isOpen, onClose, onEstadoVerificado, theme = "light" }) {
  const isDark = theme === "dark";
  const [selectedModel, setSelectedModel] = useState(MODELOS_GEMINI[0].id);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setTestResult(null);

    let cancelado = false;
    (async () => {
      const r = await estadoMotorIA();
      if (cancelado) return;
      setEstado(r);
      onEstadoVerificado?.(r);
    })();
    return () => {
      cancelado = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(null, selectedModel);
      setTestResult(res);
      onEstadoVerificado?.({ ok: res.ok, configurado: res.ok });
    } finally {
      setTesting(false);
    }
  };

  const hayLlave = estado?.configurado;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: isDark ? "rgba(3, 7, 18, 0.85)" : "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? "#0f172a" : "#ffffff",
          border: isDark ? "1.5px solid rgba(56, 189, 248, 0.3)" : "1px solid #cbd5e1",
          borderRadius: 20,
          width: "100%",
          maxWidth: 540,
          padding: 24,
          color: isDark ? "#fff" : "#0f172a",
          boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.7)" : "0 20px 50px rgba(0,0,0,0.15)"
        }}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "rgba(56, 189, 248, 0.15)", padding: 8, borderRadius: 10, color: "#0284c7" }}>
              <Server size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: isDark ? "#fff" : "#0f172a" }}>
                Motor de Inteligencia Artificial
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                Diagnóstico de la conexión segura con Google Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Estado de la llave en el servidor */}
        <div
          style={{
            background: hayLlave
              ? isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5"
              : isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2",
            border: hayLlave ? "1px solid #10b981" : "1px solid #ef4444",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: hayLlave ? (isDark ? "#a7f3d0" : "#047857") : (isDark ? "#fca5a5" : "#b91c1c"),
            display: "flex",
            alignItems: "flex-start",
            gap: 8
          }}
        >
          {hayLlave
            ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
          <div>
            <strong>{hayLlave ? "Llave configurada en el servidor" : "Falta configurar la llave en el servidor"}</strong>
            <div style={{ marginTop: 2 }}>
              {estado?.mensaje || "Consultando el servidor..."}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div
          style={{
            background: isDark ? "rgba(30, 41, 59, 0.7)" : "#f0f9ff",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #bae6fd",
            borderRadius: 12,
            padding: 12,
            fontSize: 12,
            color: isDark ? "#cbd5e1" : "#0369a1",
            lineHeight: 1.5,
            marginBottom: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#0284c7", marginBottom: 4 }}>
            <Shield size={14} /> Conexión Segura (Llave Privada)
          </div>
          La <strong>GEMINI_API_KEY</strong> vive únicamente en las variables de entorno de Vercel. El navegador
          nunca la ve, nunca la guarda y no la incluye en el bundle público: todas las consultas pasan por la
          función segura <strong>/api/gemini</strong>, que además valida tu sesión de Supabase y restringe el uso
          al administrador del módulo.
          <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <strong>Para activarla en Vercel:</strong> Settings → Environment Variables → <code>GEMINI_API_KEY</code>
            {" "}(y <code>SUPABASE_JWT_SECRET</code> para validar la sesión). Después redeploya.
          </div>
          <div style={{ marginTop: 6 }}>
            El motor usa <strong>{MODELOS_GEMINI[0].nombre}</strong> vía la API estable <strong>v1</strong>. Los modelos{" "}
            <strong>Gemini 1.5</strong> fueron retirados por Google y devuelven error 404.
          </div>
        </div>

        {/* Selector de Modelo para Prueba */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: isDark ? "#94a3b8" : "#64748b" }}>
            Modelo para prueba de conexión:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: "100%",
              background: isDark ? "rgba(15, 23, 42, 0.8)" : "#f8fafc",
              border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "8px 12px",
              color: isDark ? "#fff" : "#0f172a",
              fontSize: 13,
              outline: "none"
            }}
          >
            {MODELOS_GEMINI.map((m) => (
              <option key={m.id} value={m.id} style={{ background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" }}>
                {m.nombre} - {m.descripcion}
              </option>
            ))}
          </select>
        </div>

        {/* Resultado del Test */}
        {testResult && (
          <div
            style={{
              background: testResult.ok ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5") : (isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2"),
              border: testResult.ok ? "1px solid #10b981" : "1px solid #ef4444",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 12.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              color: testResult.ok ? (isDark ? "#a7f3d0" : "#047857") : (isDark ? "#fca5a5" : "#b91c1c")
            }}
          >
            {testResult.ok ? <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />}
            <div>
              <strong>{testResult.ok ? "¡Diagnóstico Exitoso!" : "Error en Diagnóstico:"}</strong>
              <div style={{ marginTop: 2 }}>{testResult.message}</div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button
            type="button"
            disabled={testing}
            onClick={handleTest}
            style={{
              background: C.coral,
              border: "none",
              color: "#fff",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: testing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: testing ? 0.7 : 1,
              boxShadow: "0 4px 15px rgba(225, 78, 42, 0.4)"
            }}
          >
            {testing ? <RefreshCw size={15} /> : testing ? <Sparkles size={15} /> : <Key size={15} />}
            {testing ? "Probando..." : "Probar Conexión"}
          </button>
        </div>
      </div>
    </div>
  );
}