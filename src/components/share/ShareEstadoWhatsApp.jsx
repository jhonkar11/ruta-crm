import { MessageCircle } from "lucide-react";
import { calcularProgreso, documentosFaltantes, DOCUMENTOS_CREDITO_DEFAULT } from "../../utils/documentosCredito";

/**
 * Genera un enlace de "seguimiento" simulado para el cliente.
 *
 * IMPORTANTE: esto NO es un enlace real todavía. Para que el cliente pueda
 * abrirlo de verdad y ver su expediente en vivo, se necesita:
 *   1) una tabla/columna donde guardar el checklist (ej. clientes.documentos_json)
 *   2) una ruta pública de solo-lectura (ej. /seguimiento/:token) que la sirva
 *   3) un token no adivinable en vez del id del cliente en crudo
 * Mientras tanto, esta función arma una URL con el mismo formato para que
 * puedas conectarla al backend real sin tocar el resto del componente.
 */
export function buildEnlaceSeguimiento(cliente, { baseUrl = "https://rutacrm.app/seguimiento" } = {}) {
  const token = btoa(`${cliente.id}-${cliente.nombres ?? ""}`).replace(/=+$/, "");
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
  const progreso = calcularProgreso(checklist, documentos);
  const faltantes = documentosFaltantes(checklist, documentos);
  const nombreCliente = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() || "cliente";

  const lineaEstado = estadoCredito ? `Estado actual: *${estadoCredito}*.\n` : "";
  const lineaFaltantes = faltantes.length
    ? `Documentos pendientes: ${faltantes.join(", ")}.`
    : "¡Ya tienes todos los documentos completos! 🎉";

  return (
    `Hola ${nombreCliente}, te saluda ${asesorNombre}. ` +
    `Tu expediente de crédito va en ${progreso}% de avance.\n` +
    lineaEstado +
    lineaFaltantes +
    `\n\nPuedes ver el detalle aquí: ${enlace}`
  );
}

/**
 * Botón "Compartir estado por WhatsApp". Reutiliza el mismo patrón de
 * IconBtn/enlace wa.me que ya usa ClientCard.jsx.
 */
export default function ShareEstadoWhatsApp({
  cliente,
  asesorNombre,
  checklist,
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
  estadoCredito,
  variant = "full", // "full" (botón con texto) | "icon" (solo icono, mismo tamaño que IconBtn)
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
