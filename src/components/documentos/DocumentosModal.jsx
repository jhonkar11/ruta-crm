import { X, FileCheck2 } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp } from "../ui/UIKit";
import DocumentChecklist from "./DocumentChecklist";
import ShareEstadoWhatsApp from "../share/ShareEstadoWhatsApp";
import { DOCUMENTOS_CREDITO_DEFAULT, calcularProgreso } from "../../utils/documentosCredito";

/**
 * Modal de expediente de crédito de un cliente: checklist de documentos +
 * progreso + botón para compartir el estado por WhatsApp. Mismo lenguaje
 * visual (glass oscuro, bottom-sheet) que ConfirmModal en UIKit.jsx.
 *
 * Props:
 *  - cliente: objeto cliente (id, nombres, apellidos, whatsapp, telefono...)
 *  - checklist / onChangeChecklist: estado controlado del checklist
 *  - estadoCredito: una de ESTADOS_CREDITO (opcional, solo para mostrar el Stamp)
 *  - asesorNombre: nombre del asesor logueado, para el mensaje de WhatsApp
 *  - documentos: lista de documentos requeridos (opcional, usa el default)
 *  - onClose: cierra el modal
 */
export default function DocumentosModal({
  cliente,
  checklist,
  onChangeChecklist,
  estadoCredito,
  asesorNombre,
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
  onClose,
}) {
  if (!cliente) return null;
  const nombreCliente = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
  const progreso = calcularProgreso(checklist, documentos);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 70,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 440,
        boxShadow: "0 -8px 30px rgba(0,0,0,0.5)", maxHeight: "88vh", overflowY: "auto",
        color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck2 size={18} color={C.coral} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
                Expediente de crédito
              </span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
              {nombreCliente} · CC/NIT {cliente.id}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <X size={16} />
          </button>
        </div>

        {estadoCredito && (
          <div style={{ margin: "10px 0 6px" }}>
            <Stamp estado={estadoCredito} size="sm" />
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <DocumentChecklist
            checklist={checklist}
            documentos={documentos}
            onChange={onChangeChecklist}
            tone="dark"
          />
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          {progreso < 100 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              El cliente podrá ver desde su celular cuáles documentos le faltan.
            </div>
          )}
          <ShareEstadoWhatsApp
            cliente={cliente}
            asesorNombre={asesorNombre}
            checklist={checklist}
            documentos={documentos}
            estadoCredito={estadoCredito}
          />
        </div>
      </div>
    </div>
  );
}
