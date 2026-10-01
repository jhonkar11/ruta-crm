import { useState, useEffect } from "react";
import { Key, CheckCircle, AlertCircle, RefreshCw, X, Shield, ExternalLink, Sparkles } from "lucide-react";
import { C } from "../../styles/tokens";
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey, MODELOS_GEMINI } from "../../services/geminiService";

export default function ConfigApiKeyModal({ isOpen, onClose, onKeySaved, theme = "light" }) {
  const isDark = theme === "dark";
  const [keyInput, setKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getGeminiApiKey();
      setKeyInput(current);
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!keyInput.trim()) {
      setTestResult({ ok: false, message: "Por favor ingresa una API Key para probar." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(keyInput.trim(), selectedModel);
      setTestResult(res);
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setGeminiApiKey(keyInput.trim());
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved(keyInput.trim());
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    if (confirm("¿Deseas desvincular la API Key guardada?")) {
      setGeminiApiKey("");
      setKeyInput("");
      setTestResult(null);
      if (onKeySaved) onKeySaved("");
    }
  };

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
          boxShadow: isDark ? "0 25px 60px rgba(0, 0, 0, 0.7)" : "0 20px 50px rgba(0, 0, 0, 0.15)"
        }}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "rgba(56, 189, 248, 0.15)", padding: 8, borderRadius: 10, color: "#0284c7" }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: isDark ? "#fff" : "#0f172a" }}>
                Configuración de Google Gemini API
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                Diagnóstico, verificación en vivo y respaldo de llaves de IA
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

        {/* Info Box */}
        <div
          style={{
            background: isDark ? "rgba(30, 41, 59, 0.7)" : "#f0f9ff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #bae6fd",
            borderRadius: 12,
            padding: 12,
            fontSize: 12,
            color: isDark ? "#cbd5e1" : "#0369a1",
            lineHeight: 1.5,
            marginBottom: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#0284c7", marginBottom: 4 }}>
            <Shield size={14} /> Modo Seguro y Gratuito
          </div>
          Puedes obtener tu API Key gratuita directamente en Google AI Studio. El motor usa <strong>Gemini 2.0 Flash</strong> (vía la API estable <strong>v1</strong>), que es de alta velocidad y cuenta con cuota libre. Los modelos <strong>Gemini 1.5</strong> fueron retirados por Google y devuelven error 404.
          <div style={{ marginTop: 6 }}>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#0284c7", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}
            >
              Obtener llave en Google AI Studio <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Input API Key */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: isDark ? "#e2e8f0" : "#334155" }}>
            API Key de Google Gemini:
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: isDark ? "rgba(15, 23, 42, 0.8)" : "#f8fafc",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "10px 14px",
              color: isDark ? "#fff" : "#0f172a",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              outline: "none"
            }}
          />
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
              border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
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

        {/* Botones de Acción */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Desvincular llave
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={testing || !keyInput.trim()}
              onClick={handleTest}
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                color: isDark ? "#fff" : "#334155",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: testing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <RefreshCw size={14} className={testing ? "spin" : ""} />
              {testing ? "Probando..." : "Probar Conexión"}
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                background: savedSuccess ? "#10b981" : C.coral,
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 15px rgba(225, 78, 42, 0.4)"
              }}
            >
              {savedSuccess ? <CheckCircle size={16} /> : <Sparkles size={16} />}
              {savedSuccess ? "¡Guardado!" : "Guardar API Key"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
