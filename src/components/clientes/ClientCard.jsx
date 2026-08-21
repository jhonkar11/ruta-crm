import { useState } from "react";
import { Phone, MessageCircle, Edit3, Archive, Trash2, Building2, Tag, Clock, FolderCheck } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";
import DocumentosModal from "../documentos/DocumentosModal";
import ShareEstadoWhatsApp from "../share/ShareEstadoWhatsApp";
import { calcularProgresoCredito } from "../../utils/documentosCredito";

export default function ClientCard({ client, r: clientProp, profile, onEdit, onArchive, onDelete, canDelete, onUpdateClient }) {
  const currentClient = client || clientProp;
  if (!currentClient) return null;

  const [showDocumentosModal, setShowDocumentosModal] = useState(false);

  const estadoReal = currentClient.estado || currentClient.categoria_cliente || "Registrado";

  const formatPhone = (phone) => {
    if (!phone) return "";
    return String(phone).replace(/\D/g, "");
  };

  const telClean = formatPhone(currentClient.telefono);
  const waClean = formatPhone(currentClient.whatsapp || currentClient.telefono);

  const nombreCliente = `${currentClient.nombres || ""} ${currentClient.apellidos || ""}`.trim() || "Cliente sin nombre";
  const nombreAsesor = profile?.nombre || "Jhon Alexander Vasquez Revelo";

  const textoMensaje = `Hola ${nombreCliente}, te saluda ${nombreAsesor} de Banco Caja Social. Como tu banco amigo, te recordamos nuestra visita de seguimiento. ¿Te queda bien el horario acordado? ¡Un amigo hoy, mañana y siempre!`;
  
  const waHref = waClean ? `https://wa.me/57${waClean}?text=${encodeURIComponent(textoMensaje)}` : undefined;

  const documentosState = currentClient.documentos_credito || {};
  const progreso = calcularProgresoCredito(documentosState);

  const handleSaveDocumentos = (newDocumentos) => {
    if (onUpdateClient) {
      onUpdateClient({
        ...currentClient,
        documentos_credito: newDocumentos
      });
    }
  };

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      border: `1px solid #E2E8F0`,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      position: "relative",
      transition: "transform 0.2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, paddingRight: 10 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A", lineHeight: 1.2 }}>
          {nombreCliente}
        </div>
        <div style={{ flexShrink: 0, marginTop: -2 }}>
          <Stamp estado={estadoReal} size="sm" />
        </div>
      </div>

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: "#DC2626", fontWeight: 600, marginTop: 4 }}>
        CC/NIT: {currentClient?.cedula || currentClient?.id || "N/A"}
      </div>

      {currentClient.direccion && (
        <div style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <span style={{ color: C.coral }}>📍</span>
          <span>{currentClient.direccion} {currentClient.barrio ? `- ${currentClient.barrio}` : ""}</span>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 12, fontSize: 13, color: "#475569" }}>
        {currentClient.tipo_negocio && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#DC2626", fontWeight: 600 }}>
            <Building2 size={14} color="#DC2626" />
            {currentClient.tipo_negocio}
          </span>
        )}
        {currentClient.tipo_negocio && <span style={{ color: "#CBD5E1" }}>|</span>}
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tag size={14} color={C.coral} />
          <span style={{ fontWeight: 600, color: "#1E293B" }}>{estadoReal}</span>
        </span>
      </div>

      <div 
        onClick={() => setShowDocumentosModal(true)}
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background 0.2s"
        }}
        title="Clic para gestionar documentos de crédito"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FolderCheck size={16} color="#0D9488" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
            Documentos: {progreso.completados}/{progreso.total} ({progreso.porcentaje}%)
          </span>
        </div>
        <div style={{ width: 80, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${progreso.porcentaje}%`, height: "100%", background: progreso.porcentaje === 100 ? "#16A34A" : "#0D9488", transition: "width 0.3s" }} />
        </div>
      </div>

      {currentClient.fecha_seguimiento && !["Archivado"].includes(currentClient.estado) && (
        <div style={{
          marginTop: 12, fontSize: 11.5, color: "#92400E", background: "#FEF3C7",
          padding: "4px 10px", borderRadius: 6, width: "fit-content", display: "flex", alignItems: "center", gap: 6,
          fontWeight: 600
        }}>
          <Clock size={12} /> <span>Seguimiento: {currentClient.fecha_seguimiento}</span>
        </div>
      )}

      {(currentClient.observaciones || currentClient.notas) && (
        <div style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "#F8FAFC",
          borderLeft: "3px solid #E11D48",
          borderRadius: "0 8px 8px 0",
          fontSize: 12.5,
          color: "#475569",
          lineHeight: 1.4
        }}>
          <span style={{ fontWeight: 700, color: "#E11D48", marginRight: 6 }}>Última nota:</span>
          {currentClient.observaciones || currentClient.notas}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18, borderTop: `1px solid #F1F5F9`, paddingTop: 14, alignItems: "center" }}>
        <IconBtn icon={Phone} label="Llamar" href={telClean ? `tel:${telClean}` : undefined} disabled={!telClean} />
        <IconBtn icon={MessageCircle} label="WhatsApp" href={waHref} disabled={!waClean} />
        <ShareEstadoWhatsApp client={currentClient} />
        <IconBtn icon={FolderCheck} label="Documentos" onClick={() => setShowDocumentosModal(true)} tone="line" />
        <IconBtn icon={Edit3} label="Editar" onClick={() => onEdit && onEdit(currentClient)} />
        <div style={{ flex: 1 }} />
        {currentClient.estado !== "Archivado" && <IconBtn icon={Archive} label="Archivar" onClick={() => onArchive && onArchive(currentClient)} />}
        {canDelete && <IconBtn icon={Trash2} label="Eliminar" tone="line" onClick={() => onDelete && onDelete(currentClient)} />}
      </div>

      <DocumentosModal
        isOpen={showDocumentosModal}
        onClose={() => setShowDocumentosModal(false)}
        client={currentClient}
        onSave={handleSaveDocumentos}
      />
    </div>
  );
}