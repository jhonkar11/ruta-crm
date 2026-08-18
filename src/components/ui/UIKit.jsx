import { AlertCircle } from "lucide-react";
import { C, inputStyle, iconRow } from "../../styles/tokens";

export function Stamp({ estado, size = "md", rotate = false, kind = "cliente" }) {
  const est = (estado || "Nuevo").toLowerCase();

  // Lógica de colores corporativos independientes
  let bg = "#F1F5F9";
  let fg = "#475569";

  if (est.includes("no localizado") || est.includes("cancelado")) {
    bg = "#FEE2E2"; fg = "#991B1B"; // Rojo suave profesional
  } else if (est.includes("trámite") || est.includes("pendiente")) {
    bg = "#FEF3C7"; fg = "#92400E"; // Ámbar/Mostaza profesional
  } else if (est.includes("preoferta") || est.includes("interesado")) {
    bg = "#DBEAFE"; fg = "#1E40AF"; // Azul corporativo
  } else if (est.includes("contactado") || est.includes("cumplida")) {
    bg = "#DCFCE7"; fg = "#166534"; // Verde éxito
  }

  const pad = size === "sm" ? "2px 8px" : "3px 10px";
  const font = size === "sm" ? "10px" : "11px";

  return (
    <span
      style={{
        background: bg, 
        color: fg, 
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700, 
        fontSize: font, 
        letterSpacing: "0.06em", 
        padding: pad,
        borderRadius: 6, 
        border: `1px solid ${fg}33`, 
        textTransform: "uppercase",
        transform: rotate ? "rotate(-2.5deg)" : "none", 
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {estado}
    </span>
  );
}

// ... Mantén el resto de tus funciones (IconBtn, Field, TextInput, etc.) exactamente igual