export const C = {
  ink: "#12203D",
  inkSoft: "#1D3054",
  paper: "#EBEEF2",
  card: "#FFFFFF",
  coral: "#E14E2A",
  coralDark: "#C13F1F",
  amber: "#F0A93B",
  blue: "#3B7FC4",
  teal: "#128A7E",
  green: "#2E8B57",
  slate: "#8792A2",
  violet: "#7A5FC1",
  ink70: "rgba(18,32,61,0.7)",
  ink40: "rgba(18,32,61,0.4)",
  line: "rgba(18,32,61,0.10)",
};

export const ESTADOS = ["Pendiente", "Contactado", "Visitado", "Cliente", "No Viable", "Archivado"];
export const TIPOS = ["Tienda", "Taller", "Servicios", "Restaurante", "Farmacia", "Otro"];

export const ESTADO_STYLE = {
  "Pendiente": { bg: C.amber, fg: "#3B2A05" },
  "Contactado": { bg: C.blue, fg: "#FFFFFF" },
  "Visitado": { bg: C.teal, fg: "#FFFFFF" },
  "Cliente": { bg: C.green, fg: "#FFFFFF" },
  "No Viable": { bg: "#B94A3B", fg: "#FFFFFF" },
  "Archivado": { bg: C.slate, fg: "#FFFFFF" },
};

export const CITA_ESTADOS = ["Programada", "Pospuesta", "Cumplida", "Cancelada"];

export const CITA_ESTADO_STYLE = {
  "Programada": { bg: C.blue, fg: "#FFFFFF" },
  "Pospuesta": { bg: C.amber, fg: "#3B2A05" },
  "Cumplida": { bg: C.green, fg: "#FFFFFF" },
  "Cancelada": { bg: "#B94A3B", fg: "#FFFFFF" },
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const inputStyle = (error) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  fontSize: 14,
  border: `1.5px solid ${error ? C.coral : "#CBD5E1"}`,
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  background: "#FFFFFF",
  color: "#0F172A",
  boxSizing: "border-box",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
});

// Contenedor flex reutilizable para alinear un ícono + texto de forma
// consistente (corrige el desalineamiento vertical del prototipo original).
export const iconRow = (gap = 6) => ({
  display: "inline-flex",
  alignItems: "center",
  gap,
  lineHeight: 1,
});

// ============================================================
// Glassmorphism corporativo — misma receta exacta que la tarjeta
// de LoginScreen.jsx, centralizada aquí para que cualquier modal o
// panel flotante (Documentos, Alertas, Historial, confirmaciones)
// se vea consistente con el login sin duplicar el CSS en cada uno.
// ============================================================
export const glass = {
  // Fondo oscuro semitransparente detrás del modal (mismo overlay del login)
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(11, 17, 32, 0.65)",
    zIndex: 70,
  },
  // La tarjeta/panel de cristal en sí
  panel: {
    background: "rgba(255, 255, 255, 0.07)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
    color: "#fff",
  },
  // Chips/pills translúcidas dentro de un panel de cristal (como la
  // etiqueta "GESTIÓN INTELIGENTE DE CAMPO" del login)
  pill: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  // Campos de texto: fondo claro y sólido para que el contraste con el
  // texto oscuro se mantenga legible incluso en móvil, sobre el cristal.
  input: {
    background: "rgba(248, 250, 252, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#0F172A",
  },
};