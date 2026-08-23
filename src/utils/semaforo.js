// ============================================================
// Semáforo de urgencia de seguimiento, basado en fecha_seguimiento.
// 🔴 vencido o para hoy · 🟡 mañana o en los próximos 2 días · 🟢 con margen
// ============================================================

import { todayISO } from "../styles/tokens";

// Clientes en estos estados ya no necesitan semáforo de urgencia:
// el seguimiento dejó de estar "abierto".
const ESTADOS_CERRADOS = ["Visitado", "Cumplida", "Cancelado", "Archivado"];

function diasDeDiferencia(fechaISO, hoyISO) {
  const a = new Date(`${fechaISO}T00:00:00`);
  const b = new Date(`${hoyISO}T00:00:00`);
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Devuelve null si no aplica semáforo (sin fecha, o el seguimiento ya
 * está cerrado), o un objeto { nivel, etiqueta, dias, fecha }.
 * nivel es "rojo" | "amarillo" | "verde".
 */
export function calcularUrgencia(fechaSeguimiento, estado, hoyISO = todayISO()) {
  if (!fechaSeguimiento) return null;
  if (ESTADOS_CERRADOS.includes(estado)) return null;

  const fecha = String(fechaSeguimiento).slice(0, 10);
  const dias = diasDeDiferencia(fecha, hoyISO);

  let nivel;
  if (dias <= 0) nivel = "rojo";
  else if (dias <= 2) nivel = "amarillo";
  else nivel = "verde";

  let etiqueta;
  if (dias < 0) etiqueta = `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`;
  else if (dias === 0) etiqueta = "Seguimiento hoy";
  else if (dias === 1) etiqueta = "Seguimiento mañana";
  else if (dias === 2) etiqueta = "En 2 días";
  else etiqueta = `Programado: ${fecha}`;

  return { nivel, etiqueta, dias, fecha };
}

export const SEMAFORO_STYLE = {
  rojo: { dot: "#DC2626", bg: "rgba(220, 38, 38, 0.12)", border: "rgba(220, 38, 38, 0.35)", fg: "#B91C1C" },
  amarillo: { dot: "#D97706", bg: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.35)", fg: "#92400E" },
  verde: { dot: "#16A34A", bg: "rgba(22, 163, 74, 0.12)", border: "rgba(22, 163, 74, 0.30)", fg: "#15803D" },
};
