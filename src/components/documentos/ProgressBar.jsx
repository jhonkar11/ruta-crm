function colorForProgress(pct) {
  if (pct >= 100) return "#0D9488";
  if (pct >= 50) return "#D97706";
  return "#DC2626";
}

export default function ProgressBar({ value = 0, height = 8, showLabel = true, tone = "light" }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = colorForProgress(pct);
  const trackBg = tone === "dark" ? "rgba(255,255,255,0.1)" : "#F1F5F9";
  const trackBorder = tone === "dark" ? "1px solid rgba(255,255,255,0.15)" : "1px solid #E2E8F0";
  const labelColor = tone === "dark" ? "rgba(255,255,255,0.85)" : "#475569";

  return (
    <div>
      {showLabel && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 11.5, fontWeight: 700, color: labelColor, marginBottom: 6,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          <span>EXPEDIENTE</span>
          <span style={{ color }}>{pct}%</span>
        </div>
      )}
      <div style={{
        width: "100%", height, borderRadius: height, background: trackBg,
        border: trackBorder, overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: height,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 0.4s ease, background 0.4s ease",
        }} />
      </div>
    </div>
  );
}
