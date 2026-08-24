import { Phone, MessageCircle, Edit3, Archive, ArchiveRestore, Trash2, Building2, Tag, ClipboardList, History } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";
import SemaforoBadge from "../ui/SemaforoBadge";

export default function ClientCard({ client, r: clientProp, profile, onEdit, onArchive, onDelete, onDesarchivar, onOpenDocs, onOpenHistorial, onRegistrarContacto, canDelete }) {
  // Soporte universal para ambas formas en que las vistas pasan el registro
  const currentClient = client || clientProp;
  if (!currentClient) return null;

  const estadoReal = currentClient.estado || currentClient.categoria_cliente || "Registrado";

  const formatPhone = (phone) => {
    if (!phone) return "";
    return String(phone).replace(/\D/g, "");
  };

  const telClean = formatPhone(currentClient.telefono);
  const waClean = formatPhone(currentClient.whatsapp || currentClient.telefono);

  // Nombre del cliente y del asesor logueado
  const nombreCliente = `${currentClient.nombres || ""} ${currentClient.apellidos || ""}`.trim() || "Cliente sin nombre";
  const nombreAsesor = profile?.nombre || "Jhon Alexander Vasquez Revelo";

  // Mensaje optimizado para Banco Caja Social
  const textoMensaje = `Hola ${nombreCliente}, te saluda ${nombreAsesor} de Banco Caja Social. Como tu banco amigo, te recordamos nuestra visita de seguimiento. ¿Te queda bien el horario acordado? ¡Un amigo hoy, mañana y siempre!`;
  
  const waHref = waClean ? `https://wa.me/57${waClean}?text=${encodeURIComponent(textoMensaje)}` : undefined;

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
      {/* Etiqueta de estado en la parte superior derecha */}
      <div style={{ position: "absolute", top: 16, right: 20 }}>
        <Stamp estado={estadoReal} size="sm" />
      </div>

      {/* Cabecera de la tarjeta: Nombre y Cédula con contraste */}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A", paddingRight: 100 }}>
        {nombreCliente}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: "#DC2626", fontWeight: 600, marginTop: 4 }}>
        CC/NIT: {currentClient.id || currentClient.cedula || "N/A"}
      </div>

      {/* Dirección */}
      {currentClient.direccion && (
        <div style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <span style={{ color: C.coral }}>📍</span>
          <span>{currentClient.direccion} {currentClient.barrio ? `- ${currentClient.barrio}` : ""}</span>
        </div>
      )}

      {/* Detalles del negocio y categoría */}
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

      {/* Etapa del crédito (independiente del estado comercial de arriba) */}
      {currentClient.estado_credito && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Crédito:</span>
          <Stamp estado={currentClient.estado_credito} size="sm" rotate={false} />
        </div>
      )}

      {/* Semáforo de urgencia de seguimiento: rojo (vencido/hoy), amarillo
          (próximos 2 días) o verde (con margen) según fecha_seguimiento */}
      {currentClient.fecha_seguimiento && (
        <div style={{ marginTop: 12 }}>
          <SemaforoBadge fechaSeguimiento={currentClient.fecha_seguimiento} estado={currentClient.estado} />
        </div>
      )}

      {/* Sección de Observaciones */}
      {currentClient.observaciones && (
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
          <span style={{ fontWeight: 700, color: "#E11D48", marginRight: 6 }}>Nota:</span>
          {currentClient.observaciones}
        </div>
      )}

      {/* Botones de acción inferior */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, borderTop: `1px solid #F1F5F9`, paddingTop: 14, alignItems: "center" }}>
        <IconBtn icon={Phone} label="Llamar" href={telClean ? `tel:${telClean}` : undefined} disabled={!telClean}
          onClick={() => telClean && onRegistrarContacto && onRegistrarContacto(currentClient, "llamada")} />
        <IconBtn icon={MessageCircle} label="WhatsApp" href={waHref} disabled={!waClean}
          onClick={() => waClean && onRegistrarContacto && onRegistrarContacto(currentClient, "whatsapp")} />
        <IconBtn icon={Edit3} label="Editar" onClick={() => onEdit && onEdit(currentClient)} />
        {onOpenDocs && <IconBtn icon={ClipboardList} label="Documentos del crédito" onClick={() => onOpenDocs(currentClient)} />}
        {onOpenHistorial && <IconBtn icon={History} label="Historial de actividad" onClick={() => onOpenHistorial(currentClient)} />}
        <div style={{ flex: 1 }} />
        {currentClient.estado !== "Archivado" && <IconBtn icon={Archive} label="Archivar" onClick={() => onArchive && onArchive(currentClient)} />}
        {currentClient.estado === "Archivado" && onDesarchivar && <IconBtn icon={ArchiveRestore} label="Quitar de archivados" onClick={() => onDesarchivar(currentClient)} />}
        {canDelete && <IconBtn icon={Trash2} label="Eliminar" tone="line" onClick={() => onDelete && onDelete(currentClient)} />}
      </div>
    </div>
  );
}