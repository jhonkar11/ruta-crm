import { X, FileCheck2 } from "lucide-react";
import { C, glass } from "../../styles/tokens";
import { Stamp, Select } from "../ui/UIKit";
import DocumentChecklist from "./DocumentChecklist";
import ShareEstadoWhatsApp from "../share/ShareEstadoWhatsApp";
import { DOCUMENTOS_CREDITO_DEFAULT, ESTADOS_CREDITO, calcularProgresoCredito } from "../../utils/documentosCredito";

// Modal de expediente de crédito de un cliente: etapa del crédito + checklist
// de documentos + progreso + compartir por WhatsApp. Mismo glassmorphism
// exacto que LoginScreen.jsx (ver styles/tokens.js -> glass).
export default function DocumentosModal({
  cliente,
  asesorNombre,
  onChangeChecklist,
  onChangeEstadoCredito,
  onClose,
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
}) {
  if (!cliente) return null;

  const checklist = cliente.documentos_json || {};
  const estadoCredito = cliente.estado_credito || "";
  const nombreCliente = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
  const progreso = calcularProgresoCredito(checklist, documentos);

  return (
    <div style={{
      ...glass.overlay,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        ...glass.panel,
        borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxWidth: 440,
        maxHeight: "88vh", overflowY: "auto",
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
            ...glass.pill,
            borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.8)", textTransform: "uppercase", marginBottom: 6,
          }}>
            Etapa del crédito
          </div>
          <Select
            value={estadoCredito}
            onChange={(e) => onChangeEstadoCredito && onChangeEstadoCredito(e.target.value)}
            options={ESTADOS_CREDITO}
          />
          {estadoCredito && (
            <div style={{ marginTop: 10 }}>
              <Stamp estado={estadoCredito} size="sm" />
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
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
