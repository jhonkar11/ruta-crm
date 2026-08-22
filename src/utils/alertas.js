// ============================================================
// Cálculo de alertas de gestión: documentos estancados, créditos
// "En Estudio" sin respuesta, y seguimientos retrasados.
// Todo se deriva de `records` (la lista de clientes) — no requiere
// tablas nuevas aparte de estado_credito_actualizado_en.
// ============================================================

export const DIAS_ALERTA_DOCUMENTOS = 3; // "Documentación Pendiente" sin avanzar
export const DIAS_ALERTA_ESTUDIO = 5;    // "En Estudio" sin respuesta de la entidad

function diasDesde(fechaISO) {
  if (!fechaISO) return null;
  const ms = Date.now() - new Date(fechaISO).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function calcularAlertas(records = [], hoyISO) {
  const activos = (records || []).filter((r) => r && r.estado !== "Archivado");

  const documentosPendientes = activos
    .filter((r) => r.estado_credito === "Documentación Pendiente")
    .map((r) => ({ ...r, _dias: diasDesde(r.estado_credito_actualizado_en) }))
    .filter((r) => r._dias !== null && r._dias >= DIAS_ALERTA_DOCUMENTOS)
    .sort((a, b) => b._dias - a._dias);

  const estudioEstancado = activos
    .filter((r) => r.estado_credito === "En Estudio")
    .map((r) => ({ ...r, _dias: diasDesde(r.estado_credito_actualizado_en) }))
    .filter((r) => r._dias !== null && r._dias >= DIAS_ALERTA_ESTUDIO)
    .sort((a, b) => b._dias - a._dias);

  const seguimientosRetrasados = activos
    .filter((r) => {
      if (!r.fecha_seguimiento) return false;
      if (["Visitado", "Cumplida", "Cancelado"].includes(r.estado)) return false;
      return r.fecha_seguimiento.slice(0, 10) < hoyISO;
    })
    .sort((a, b) => (a.fecha_seguimiento || "").localeCompare(b.fecha_seguimiento || ""));

  const total = documentosPendientes.length + estudioEstancado.length + seguimientosRetrasados.length;

  return { documentosPendientes, estudioEstancado, seguimientosRetrasados, total };
}
