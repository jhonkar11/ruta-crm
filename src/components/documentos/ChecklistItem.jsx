import { CheckCircle2, Circle } from "lucide-react";

export default function ChecklistItem({ label, checked, onToggle, tone = "light" }) {
  const textColor = tone === "dark" ? "#FFFFFF" : "#0F172A";
  const subColor = tone === "dark" ? "rgba(255,255,255,0.5)" : "#94A3B8";
  const rowBg = checked
    ? (tone === "dark" ? "rgba(13,148,136,0.12)" : "#F0FDFA")
    : "transparent";

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 8px",
        background: rowBg,
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.2s ease",
      }}
    >
      {checked
        ? <CheckCircle2 size={20} color="#0D9488" style={{ flexShrink: 0 }} />
        : <Circle size={20} color={subColor} style={{ flexShrink: 0 }} />}
      <span style={{
        fontSize: 13.5,
        fontWeight: checked ? 600 : 500,
        color: checked ? textColor : subColor,
        textDecoration: checked ? "none" : "none",
      }}>
        {label}
      </span>
    </button>
  );
}
