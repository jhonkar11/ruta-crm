import { AlertCircle } from "lucide-react";
import { C, inputStyle, iconRow, glass } from "../../styles/tokens";

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
        color: error ? C.coral : "var(--text-muted, #475569)", textTransform: "uppercase", marginBottom: 5,
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
  let bg = tone === "coral" ? C.coral : tone === "line" ? "transparent" : tone === "glass" ? "rgba(255,255,255,0.08)" : "rgba(15, 23, 42, 0.06)";
  let fg = tone === "coral" ? "#fff" : tone === "line" ? "#0F172A" : tone === "glass" ? "#fff" : "#0F172A";

  if (disabled) {
    fg = tone === "glass" ? "rgba(255,255,255,0.35)" : "rgba(15, 23, 42, 0.3)";
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
        border: tone === "line" ? "1px solid rgba(15, 23, 42, 0.2)" : tone === "glass" ? "1px solid rgba(255,255,255,0.2)" : "none",
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
      ...glass.overlay,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        ...glass.panel,
        borderRadius: 24, padding: 24, width: "100%",
        maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
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
      textAlign: "center", padding: "40px 20px", color: "var(--text-muted, #64748B)", fontSize: 13.5,
      background: "var(--bg-surface, #FFFFFF)", borderRadius: 16, border: "1px dashed var(--border-subtle, #CBD5E1)",
    }}>{text}</div>
  );
}

export function ViewHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-main, #0F172A)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12.5, color: "var(--text-muted, #475569)", marginTop: 2 }}>{subtitle}</div>}
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

export function NavTab({ icon: Icon, label, active, onClick, badge, isDark = true }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl border text-center transition-all duration-150 relative ${
        active
          ? isDark
            ? "bg-slate-800/80 border-slate-700 text-emerald-400 font-bold shadow-md"
            : "bg-white border-orange-500 text-slate-900 font-extrabold shadow-md"
          : isDark
            ? "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40"
            : "bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-900 hover:bg-white hover:border-slate-400 shadow-sm font-bold"
      }`}
    >
      <span className="relative flex items-center justify-center">
        <Icon size={18} className={`shrink-0 ${active ? (isDark ? "text-emerald-400" : "text-orange-600") : (isDark ? "text-slate-400" : "text-slate-700")}`} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 shadow-sm">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className={`text-[10px] tracking-tight font-mono leading-none ${active ? (isDark ? "text-emerald-300 font-bold" : "text-slate-900 font-extrabold") : (isDark ? "text-slate-400" : "text-slate-700 font-bold")}`}>{label}</span>
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
        background: active ? "#2563eb" : "var(--bg-surface, #FFFFFF)",
        border: active ? "1.5px solid #2563eb" : "1px solid var(--border-subtle, #CBD5E1)",
        color: active ? "#ffffff" : "var(--text-main, #1E293B)",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        boxShadow: active ? "0 2px 8px rgba(37, 99, 235, 0.3)" : "0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.2s ease"
      }}
    >
      {label}
    </button>
  );
}