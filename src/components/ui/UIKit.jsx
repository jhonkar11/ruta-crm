import { AlertCircle } from "lucide-react";
import { C, inputStyle, iconRow } from "../../styles/tokens";

export function Stamp({ estado, size = "md", rotate = true, kind = "cliente" }) {
  const est = (estado || "Nuevo").toLowerCase();

  let bg = "#F1F5F9";
  let fg = "#475569";

  if (est.includes("no localizado") || est.includes("cancelado")) {
    bg = "#FEE2E2"; fg = "#DC2626";
  } else if (est.includes("rechazado")) {
    bg = "#FEE2E2"; fg = "#B91C1C";
  } else if (est.includes("trámite") || est.includes("pendiente")) {
    bg = "#FEF3C7"; fg = "#D97706";
  } else if (est.includes("estudio")) {
    bg = "#DBEAFE"; fg = "#1D4ED8";
  } else if (est.includes("preoferta") || est.includes("interesado")) {
    bg = "#DBEAFE"; fg = "#2563EB";
  } else if (est.includes("programada")) {
    bg = "#2563EB"; fg = "#FFFFFF";
  } else if (est.includes("aprobado")) {
    bg = "#DCFCE7"; fg = "#16A34A";
  } else if (
    est.includes("contactado") || est.includes("cumplida") ||
    est.includes("visitado") || est.includes("desembolsado")
  ) {
    bg = "#0D9488"; fg = "#FFFFFF";
  }

  const pad = size === "sm" ? "2px 8px" : "4px 12px";
  const font = size === "sm" ? "10px" : "11px";

  return (
    <span
      style={{
        background: bg, 
        color: fg, 
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700, 
        fontSize: font, 
        letterSpacing: "0.08em", 
        padding: pad,
        borderRadius: 6, 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        textTransform: "uppercase",
        transform: rotate ? "rotate(2deg)" : "none", 
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {estado}
    </span>
  );
}

export function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.05em",
        color: error ? C.coral : "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", marginBottom: 5,
        ...iconRow(4),
      }}>
        {label}{required && <span style={{ color: C.coral }}>*</span>}
      </div>
      {children}
      {error && (
        <div style={{ color: C.coral, fontSize: 12, marginTop: 4, ...iconRow(4) }}>
          <AlertCircle size={12} /> <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function IconBtn({ icon: Icon, onClick, label, tone = "ink", href, disabled }) {
  // Ajuste para garantizar contraste perfecto tanto en fondos oscuros como en tarjetas blancas
  let bg = tone === "coral" ? C.coral : tone === "line" ? "transparent" : "rgba(15, 23, 42, 0.06)";
  let fg = tone === "coral" ? "#fff" : tone === "line" ? "#0F172A" : "#0F172A";
  
  if (disabled) {
    fg = "rgba(15, 23, 42, 0.3)";
  }

  const Comp = href ? "a" : "button";
  return (
    <Comp
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        background: bg, 
        color: fg, 
        border: tone === "line" ? "1px solid rgba(15, 23, 42, 0.2)" : "none",
        width: 36, height: 36, minWidth: 36, borderRadius: 10, ...iconRow(0),
        justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
        transition: "background 0.2s"
      }}
    >
      <Icon size={16} />
    </Comp>
  );
}

export function TextInput(props) {
  const { error, ...rest } = props;
  return <input {...rest} style={{ ...inputStyle(error), ...(rest.style || {}) }} />;
}

export function Select({ value, onChange, options, error }) {
  return (
    <select value={value} onChange={onChange} style={inputStyle(error)}>
      <option value="">— Seleccionar —</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel, children, isOpen, message }) {
  if (isOpen === false) return null;
  const finalTitle = title || "";
  const finalBody = body || message || "";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 60,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px 20px 0 0", padding: 24, width: "100%",
        maxWidth: 420, boxShadow: "0 -8px 30px rgba(0,0,0,0.5)", maxHeight: "85vh", overflowY: "auto", color: "#fff"
      }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#ffffff", marginBottom: 8 }}>
          {finalTitle}
        </div>
        {finalBody && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 20, lineHeight: 1.5 }}>{finalBody}</div>}
        {children}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {onCancel && (
            <button onClick={onCancel} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)",
              background: "transparent", color: "#ffffff", fontWeight: 600, cursor: "pointer",
            }}>Cancelar</button>
          )}
          {onConfirm && (
            <button onClick={onConfirm} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "none",
              background: danger ? "#dc2626" : "#2563eb", color: "#fff", fontWeight: 600, cursor: "pointer",
            }}>{confirmLabel || "Aceptar"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div style={{
      textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.5)", fontSize: 13.5,
      background: "rgba(15,23,42,0.6)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.2)",
    }}>{text}</div>
  );
}

export function ViewHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "#ffffff" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.8)", marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "#60a5fa",
      textTransform: "uppercase", letterSpacing: "0.04em", margin: "22px 0 10px",
      borderBottom: "2px solid rgba(255,255,255,0.15)", paddingBottom: 6,
    }}>{children}</div>
  );
}

export function NavTab({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex",
      flexDirection: "column", alignItems: "center", gap: 3, 
      color: active ? C.coral : "#ffffff", 
      padding: "2px 0",
      position: "relative",
    }}>
      <span style={{ position: "relative" }}>
        <Icon size={18} />
        {badge > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -8, background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 700, borderRadius: 8, minWidth: 14, height: 14,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}>{badge > 9 ? "9+" : badge}</span>
        )}
      </span>
      <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 600, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
    </button>
  );
}

export function FiltroChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: "20px",
        fontSize: "12.5px",
        fontWeight: "600",
        background: active ? "#2563eb" : "rgba(255, 255, 255, 0.05)",
        border: active ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.15)",
        color: "#ffffff",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        transition: "all 0.2s ease"
      }}
    >
      {label}
    </button>
  );
}