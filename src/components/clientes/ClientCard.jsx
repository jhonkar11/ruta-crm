import { Phone, MessageCircle, Edit3, Archive, Trash2, Building2, Tag, Clock } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function ClientCard({ r, onEdit, onArchive, onDelete, canDelete, profile }) {
  const tel = r.telefono ? `tel:${r.telefono}` : undefined;
  
  // Normalización del nombre del asesor
  let nombreAsesor = "Jhon Alexander Vasquez Revelo";
  
  // Mensaje optimizado para Banco Caja Social
  const mensajeWa = encodeURIComponent(
    `Hola ${r?.nombres || "Cliente"}, te saluda ${nombreAsesor} de Banco Caja Social. Como tu banco amigo, te recordamos nuestra visita de seguimiento. ¿Te queda bien el horario acordado? ¡Un amigo hoy, mañana y siempre!`
  );
  
  const wa = r.whatsapp || r.telefono ? `https://wa.me/57${((r.whatsapp || r.telefono) + "").replace(/\D/g, "")}?text=${mensajeWa}` : undefined;

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
        <Stamp estado={r?.estado || r?.categoria_cliente || "Nuevo"} />
      </div>

      {/* Cabecera de la tarjeta */}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A", paddingRight: 100 }}>
        {r?.nombres || ""} {r?.apellidos || ""}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#64748B", marginTop: 4 }}>
        CC/NIT: {r?.id || "N/A"}
      </div>

      {/* Detalles del negocio */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 16, fontSize: 13, color: "#475569" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Building2 size={14} color={C.coral} />
          {r?.tipo_negocio || "Comercio"}
        </span>
        <span style={{ color: "#CBD5E1" }}>|</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tag size={14} color={C.coral} />
          <span style={{ fontWeight: 600, color: "#1E293B" }}>{r?.categoria_cliente || "Sin categoría"}</span>
        </span>
      </div>

      {/* Fecha de seguimiento destacada */}
      {r?.fecha_seguimiento && !["Archivado"].includes(r?.estado) && (
        <div style={{
          marginTop: 12, fontSize: 11, color: "#92400E", background: "#FEF3C7",
          padding: "4px 10px", borderRadius: 6, width: "fit-content", display: "flex", alignItems: "center", gap: 6,
          fontWeight: 600
        }}>
          <Clock size={12} /> <span>Seguimiento: {r.fecha_seguimiento}</span>
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 10, marginTop: 20, borderTop: `1px solid #F1F5F9`, paddingTop: 16 }}>
        <IconBtn icon={Phone} label="Llamar" href={tel} disabled={!r?.telefono} />
        <IconBtn icon={MessageCircle} label="WhatsApp" href={wa} disabled={!r?.whatsapp && !r?.telefono} />
        <IconBtn icon={Edit3} label="Editar" onClick={() => onEdit(r)} />
        <div style={{ flex: 1 }} />
        {r?.estado !== "Archivado" && <IconBtn icon={Archive} label="Archivar" onClick={() => onArchive(r)} />}
        {canDelete && <IconBtn icon={Trash2} label="Eliminar" tone="line" onClick={() => onDelete(r)} />}
      </div>
    </div>
  );
}