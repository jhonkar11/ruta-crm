// ============================================================
// Documentos requeridos para el estudio de crédito + helpers
// ============================================================

// Lista por defecto. Es solo el valor inicial: cada cliente puede
// tener su propia lista si el negocio lo requiere (ver DocumentChecklist).
export const DOCUMENTOS_CREDITO_DEFAULT = [
  { id: "cedula_150", label: "Cédula al 150%" },
  { id: "extractos_3m", label: "Extractos bancarios (3 meses)" },
  { id: "certificado_laboral", label: "Certificado laboral" },
  { id: "referencias", label: "Referencias personales" },
];

// checklist: { [documentoId]: boolean }
export function calcularProgreso(checklist = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  if (!documentos.length) return 0;
  const completados = documentos.filter((d) => !!checklist[d.id]).length;
  return Math.round((completados / documentos.length) * 100);
}

// Función auxiliar requerida por ClientCard.jsx para mostrar conteo y porcentaje
export function calcularProgresoCredito(documentosState = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  const total = documentos.length;
  let completados = 0;

  documentos.forEach(doc => {
    // Soporta tanto booleano simple como objeto de estado de documento
    const estadoDoc = documentosState[doc.id];
    if (estadoDoc === true || estadoDoc?.estado === "completado" || estadoDoc === "completado") {
      completados++;
    }
  });

  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  return {
    total,
    completados,
    porcentaje
  };
}

export function documentosFaltantes(checklist = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  return documentos.filter((d) => !checklist[d.id]).map((d) => d.label);
}

export function expedienteCompleto(checklist = {}, documentos = DOCUMENTOS_CREDITO_DEFAULT) {
  return calcularProgreso(checklist, documentos) === 100;
}

// ============================================================
// Etapas del crédito (más específicas que el estado comercial
// genérico de "Interesado/Contactado/etc"). Se usan en la tarjeta
// de cita y en la ficha del cliente para reflejar en qué punto del
// embudo de crédito va cada expediente.
// ============================================================
export const ESTADOS_CREDITO = [
  "Documentación Pendiente",
  "En Estudio",
  "Aprobado",
  "Desembolsado",
  "Rechazado",
];

// Mismo formato {bg, fg} que ya usa el resto de la app (ver Stamp in UIKit.jsx),
// para que un <Stamp estado={...} /> se vea idéntico a los demás badges.
export const ESTADO_CREDITO_STYLE = {
  "Documentación Pendiente": { bg: "#FEF3C7", fg: "#D97706" },
  "En Estudio": { bg: "#DBEAFE", fg: "#1D4ED8" },
  "Aprobado": { bg: "#DCFCE7", fg: "#16A34A" },
  "Desembolsado": { bg: "#0D9488", fg: "#FFFFFF" },
  "Rechazado": { bg: "#FEE2E2", fg: "#B91C1C" },
};