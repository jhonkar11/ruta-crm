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