import { Phone, MessageCircle, Navigation, Edit3, Archive, Trash2, Building2, MapPin, Clock } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function ClientCard({ r, onEdit, onArchive, onDelete, canDelete }) {
  const gmaps = `https://www.google.com/maps?q=${r.lat},${r.lng}`;
  const tel = `tel:${r.telefono}`;
  const wa = `https://wa.me/57${(r.whatsapp || "").replace(/\D/g, "")}`;

  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
      border: `1px solid ${C.line}`, position: "relative",
    }}>
      <div style={{ position: "absolute", top: -8, right: 14 }}>
        <Stamp estado={r.estado} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, paddingRight: 70 }}>
        {r.nombres} {r.apellidos}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.ink40, marginTop: 2 }}>
        CC/NIT {r.id}
      </div>

      <div className="icon-row" style={{ flexWrap: "wrap", marginTop: 8, fontSize: 13, color: C.ink70 }}>
        <span className="icon-row"><Building2 size={14} /><span>{r.tipo_negocio || "—"}</span></span>
        <span style={{ color: C.line }}>|</span>
        <span className="icon-row"><MapPin size={14} /><span>{r.barrio}, {r.ciudad}</span></span>
      </div>

      {r.fecha_seguimiento && !["Cliente", "No Viable", "Archivado"].includes(r.estado) && (
        <div className="icon-row" style={{
          marginTop: 8, fontSize: 12, color: C.coralDark, background: "#FCEBE5",
          padding: "3px 9px", borderRadius: 20, width: "fit-content",
        }}>
          <Clock size={12} /> <span>Seguimiento: {r.fecha_seguimiento}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
        <IconBtn icon={Phone} label="Llamar" href={r.telefono ? tel : undefined} disabled={!r.telefono} />
        <IconBtn icon={MessageCircle} label="WhatsApp" href={r.whatsapp ? wa : undefined} disabled={!r.whatsapp} />
        <IconBtn icon={Navigation} label="Ver en Google Maps" href={gmaps} />
        <IconBtn icon={Edit3} label="Editar" onClick={() => onEdit(r)} />
        <div style={{ flex: 1 }} />
        {r.estado !== "Archivado" && <IconBtn icon={Archive} label="Archivar" onClick={() => onArchive(r)} />}
        {canDelete && <IconBtn icon={Trash2} label="Eliminar definitivamente" tone="line" onClick={() => onDelete(r)} />}
      </div>
    </div>
  );
}
