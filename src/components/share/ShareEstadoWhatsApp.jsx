import { MessageCircle } from "lucide-react";
import { calcularProgresoCredito, documentosFaltantes, DOCUMENTOS_CREDITO_DEFAULT } from "../../utils/documentosCredito";

// Enlace de seguimiento respaldado por un token real (clientes.seguimiento_token,
// UUID generado por Supabase — ver supabase/migracion_checklist_creditos.sql).
// El token ya es real y no adivinable; lo que todavía no existe es la página
// pública que lo resuelva (ver nota en GUIA-CHECKLIST-CREDITOS.md).
export function buildEnlaceSeguimiento(cliente, { baseUrl = "https://rutacrm.app/seguimiento" } = {}) {
  const token = cliente.seguimiento_token;
  if (!token) return null;
  return `${baseUrl}/${token}`;
}

export function buildMensajeEstado({
  cliente,
  asesorNombre = "tu asesor",
  checklist = {},
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
  estadoCredito,
  enlace,
}) {
  const progreso = calcularProgresoCredito(checklist, documentos);
  const faltantes = documentosFaltantes(checklist, documentos);
  const nombreCliente = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() || "cliente";

  const lineaEstado = estadoCredito ? `Estado actual: *${estadoCredito}*.\n` : "";
  const lineaFaltantes = faltantes.length
    ? `Documentos pendientes: ${faltantes.join(", ")}.`
    : "¡Ya tienes todos los documentos completos! 🎉";
  const lineaEnlace = enlace ? `\n\nPuedes ver el detalle aquí: ${enlace}` : "";

  return (
    `Hola ${nombreCliente}, te saluda ${asesorNombre}. ` +
    `Tu expediente de crédito va en ${progreso}% de avance.\n` +
    lineaEstado +
    lineaFaltantes +
    lineaEnlace
  );
}

export default function ShareEstadoWhatsApp({
  cliente,
  asesorNombre,
  checklist,
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
  estadoCredito,
  variant = "full",
}) {
  const numero = String(cliente?.whatsapp || cliente?.telefono || "").replace(/\D/g, "");
  const enlace = buildEnlaceSeguimiento(cliente);
  const mensaje = buildMensajeEstado({ cliente, asesorNombre, checklist, documentos, estadoCredito, enlace });
  const href = numero ? `https://wa.me/57${numero}?text=${encodeURIComponent(mensaje)}` : undefined;
  const disabled = !numero;

  if (variant === "icon") {
    return (
      <a
        href={disabled ? undefined : href}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartir estado por WhatsApp"
        title="Compartir estado por WhatsApp"
        style={{
          background: "rgba(37, 211, 102, 0.12)",
          color: disabled ? "rgba(15,23,42,0.3)" : "#25D366",
          border: "none",
          width: 36, height: 36, minWidth: 36, borderRadius: 10,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          textDecoration: "none",
        }}
      >
        <MessageCircle size={16} />
      </a>
    );
  }

  return (
    <a
      href={disabled ? undefined : href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: disabled ? "#E2E8F0" : "#25D366",
        color: disabled ? "#94A3B8" : "#fff",
        border: "none", borderRadius: 10, padding: "11px 16px",
        fontWeight: 700, fontSize: 13, textDecoration: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 4px 12px rgba(37,211,102,0.35)",
      }}
    >
      <MessageCircle size={16} />
      Compartir estado por WhatsApp
    </a>
  );
}
