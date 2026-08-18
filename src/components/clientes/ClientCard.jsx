import { Phone, MessageCircle, Edit3, Archive, Trash2, Building2, Tag, Clock } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function ClientCard({ r, onEdit, onArchive, onDelete, canDelete }) {
  const tel = `tel:${r.telefono}`;
  const wa = `https://wa.me/57${(r.whatsapp || "").replace(/\D/g, "")}`;

  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
      border: `1px solid ${C.line}`, position: "relative",
    }}>
      <div style={{ position: "absolute", top: -8, right: 14 }}>
        <Stamp estado={r.categoria_cliente || r.estado} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, paddingRight: 70 }}>
        {r.nombres} {r.apellidos}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.ink40, marginTop: 2 }}>
        CC/NIT {r.id}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 8, fontSize: 13, color: C.ink70 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Building2 size={14} color={C.coral} />
          <span>{r.tipo_negocio || "Comercio"}</span>
        </span>
        <span style={{ color: C.line }}>|</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Tag size={14} color={C.coral} />
          <span style={{ fontWeight: 600, color: C.ink }}>{r.categoria_cliente || "Nuevo"}</span>
        </span>
      </div>

      {r.fecha_seguimiento && !["Archivado"].includes(r.estado) && (
        <div style={{
          marginTop: 8, fontSize: 12, color: C.coralDark, background: "#FCEBE5",
          padding: "3px 9px", borderRadius: 20, width: "fit-content", display: "flex", alignItems: "center", gap: 4
        }}>
          <Clock size={12} /> <span>Seguimiento: {r.fecha_seguimiento}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
        <IconBtn icon={Phone} label="Llamar" href={r.telefono ? tel : undefined} disabled={!r.telefono} />
        <IconBtn icon={MessageCircle} label="WhatsApp" href={r.whatsapp ? wa : undefined} disabled={!r.whatsapp} />
        <IconBtn icon={Edit3} label="Editar ficha" onClick={() => onEdit(r)} />
        <div style={{ flex: 1 }} />
        {r.estado !== "Archivado" && <IconBtn icon={Archive} label="Archivar" onClick={() => onArchive(r)} />}
        {canDelete && <IconBtn icon={Trash2} label="Eliminar definitivamente" tone="line" onClick={() => onDelete(r)} />}
      </div>
    </div>
  );
}