// ============================================================
// Documentos requeridos para el estudio de crédito + helpers
// ============================================================

export const DOCUMENTOS_CREDITO_DEFAULT = [
  { id: "cedula_150", label: "Cédula al 150%" },
  { id: "extractos_3m", label: "Extractos bancarios (3 meses)" },
  { id: "certificado_laboral", label: "Certificado laboral" },
  { id: "referencias", label: "Referencias personales" },
];

// checklist: { [documentoId]: boolean }
export function calcularProgresoCredito(checklist = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  if (!documentos.length) return 0;
  const completados = documentos.filter((d) => !!checklist[d.id]).length;
  return Math.round((completados / documentos.length) * 100);
}

export function documentosFaltantes(checklist = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  return documentos.filter((d) => !checklist[d.id]).map((d) => d.label);
}

export function expedienteCompleto(checklist = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  return calcularProgresoCredito(checklist, documentos) === 100;
}

// ============================================================
// Etapas del crédito — se guardan en clientes.estado_credito
// (columna independiente del "estado" comercial que ya usas hoy).
// ============================================================
export const ESTADOS_CREDITO = [
  "Documentación Pendiente",
  "En Estudio",
  "Aprobado",
  "Desembolsado",
  "Rechazado",
];

export const ESTADO_CREDITO_STYLE = {
  "Documentación Pendiente": { bg: "#FEF3C7", fg: "#D97706" },
  "En Estudio": { bg: "#DBEAFE", fg: "#1D4ED8" },
  "Aprobado": { bg: "#DCFCE7", fg: "#16A34A" },
  "Desembolsado": { bg: "#0D9488", fg: "#FFFFFF" },
  "Rechazado": { bg: "#FEE2E2", fg: "#B91C1C" },
};
