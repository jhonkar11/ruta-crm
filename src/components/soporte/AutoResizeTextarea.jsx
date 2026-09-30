import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, Trash2 } from "lucide-react";
import { C } from "../../styles/tokens";

export default function AutoResizeTextarea({
  value,
  onChange,
  placeholder = "Escribe notas técnicas o requerimientos...",
  minRows = 3,
  maxRows = 12,
  label = "Notas Técnicas / Requerimiento",
  hint = "Puedes dictar por voz usando el micrófono o pegar texto extenso",
  onSpeechTranscribe = null,
  theme = "light"
}) {
  const isDark = theme === "dark";
  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Auto-resize dinámico según contenido
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = `${Math.max(scrollHeight, minRows * 24)}px`;
  }, [value, minRows, isExpanded]);

  // Inicializar Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-CO";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (event.results[event.results.length - 1].isFinal) {
          const updatedValue = value ? `${value} ${transcript.trim()}` : transcript.trim();
          onChange(updatedValue);
          if (onSpeechTranscribe) onSpeechTranscribe(updatedValue);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Error en reconocimiento de voz:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [value, onChange, onSpeechTranscribe]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("El reconocimiento de voz Web Speech API no está soportado en este navegador. Puedes usar Google Chrome o Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Error iniciando micrófono:", err);
      }
    }
  };

  const toggleTTS = () => {
    if (!synthRef.current) {
      alert("La síntesis de voz no está soportada en este navegador.");
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      if (!value || !value.trim()) return;
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.lang = "es-CO";
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (value && confirm("¿Limpiar todo el contenido de este campo?")) {
      onChange("");
    }
  };

  const containerStyle = isExpanded ? {
    position: "fixed",
    inset: 16,
    zIndex: 9999,
    background: isDark ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 20,
    border: isDark ? "1.5px solid rgba(56, 189, 248, 0.4)" : "1.5px solid #0284c7",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
    padding: 24,
    display: "flex",
    flexDirection: "column"
  } : {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    position: "relative"
  };

  return (
    <div style={containerStyle}>
      {/* Barra de cabecera del editor */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
            {label}
            {isListening && (
              <span style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#dc2626",
                border: "1px solid #ef4444",
                fontSize: 10.5,
                padding: "2px 8px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                animation: "pulse 1.5s infinite"
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626" }} />
                Escuchando audio...
              </span>
            )}
          </label>
          {hint && <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", display: "block", marginTop: 2 }}>{hint}</span>}
        </div>

        {/* Barra de Herramientas de Voz y Acciones */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Botón Micrófono */}
          <button
            type="button"
            onClick={toggleMic}
            title={isListening ? "Detener grabación de voz" : "Dictar por voz (Micrófono)"}
            style={{
              background: isListening ? "#ef4444" : (isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"),
              border: isListening ? "1px solid #f87171" : (isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1"),
              color: isListening ? "#fff" : (isDark ? "#fff" : "#0284c7"),
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} color="#0284c7" />}
            <span>{isListening ? "Grabando" : "Dictar"}</span>
          </button>

          {/* Botón Altavoz (Text-to-Speech) */}
          <button
            type="button"
            onClick={toggleTTS}
            title={isSpeaking ? "Silenciar lectura" : "Escuchar texto leído por IA (Altavoz)"}
            style={{
              background: isSpeaking ? "#10b981" : (isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"),
              border: isSpeaking ? "1px solid #34d399" : (isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1"),
              color: isSpeaking ? "#fff" : (isDark ? "#fff" : "#059669"),
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} color="#059669" />}
            <span>{isSpeaking ? "Parar" : "Escuchar"}</span>
          </button>

          {/* Copiar */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copiar texto al portapapeles"
            style={{
              background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
              color: copied ? "#10b981" : (isDark ? "#cbd5e1" : "#475569"),
              borderRadius: 8,
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

          {/* Limpiar */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Borrar texto"
              style={{
                background: isDark ? "rgba(255,255,255,0.08)" : "#fef2f2",
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: 8,
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Expandir a pantalla completa */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Reducir" : "Expandir a pantalla completa"}
            style={{
              background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
              color: isDark ? "#cbd5e1" : "#475569",
              borderRadius: 8,
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Caja de Texto */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          flex: isExpanded ? 1 : "none",
          minHeight: isExpanded ? "calc(100% - 70px)" : `${minRows * 26}px`,
          maxHeight: isExpanded ? "none" : `${maxRows * 26}px`,
          background: isDark ? "rgba(10, 15, 30, 0.75)" : "#FFFFFF",
          color: isDark ? "#f1f5f9" : "#0F172A",
          border: isListening 
            ? "1.5px solid #ef4444" 
            : (isDark ? "1.5px solid rgba(255, 255, 255, 0.15)" : "1.5px solid #CBD5E1"),
          borderRadius: 12,
          padding: "12px 14px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          lineHeight: 1.5,
          resize: isExpanded ? "none" : "vertical",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
          boxShadow: isListening ? "0 0 15px rgba(239, 68, 68, 0.25)" : (isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)")
        }}
        onFocus={(e) => {
          if (!isListening) e.currentTarget.style.borderColor = C.coral;
        }}
        onBlur={(e) => {
          if (!isListening) e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1";
        }}
      />

      {/* Barra de estado inferior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, padding: "0 4px" }}>
        <span style={{ fontSize: 10.5, color: isDark ? "rgba(255,255,255,0.4)" : "#64748b" }}>
          {value ? `${value.length} caracteres · ${value.trim().split(/\s+/).filter(Boolean).length} palabras` : "Sin texto"}
        </span>
        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            style={{
              background: C.coral,
              border: "none",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Listo / Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
