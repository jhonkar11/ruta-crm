import { CalendarClock, MapPin, Phone, MessageCircle, CalendarPlus, Check, X } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

function formatFechaHora(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CitaCard({ cita, onPosponer, onCumplida, onCancelar }) {
  const cliente = cita.cliente || {};
  const activa = cita.estado === "Programada";
  const wa = `https://wa.me/57${(cliente.whatsapp || "").replace(/\D/g, "")}`;

  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.line}`, position: "relative" }}>
      <div style={{ position: "absolute", top: -8, right: 14 }}>
        <Stamp estado={cita.estado} kind="cita" size="sm" />
      </div>
      <div className="icon-row" style={{ color: C.coralDark, fontSize: 12.5, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
        <CalendarClock size={14} /> <span>{formatFechaHora(cita.fecha_hora)}</span>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.ink, marginTop: 4 }}>
        {cliente.nombres} {cliente.apellidos}
      </div>
      <div className="icon-row" style={{ marginTop: 4, fontSize: 12.5, color: C.ink70 }}>
        <MapPin size={13} /> <span>{[cliente.direccion, cliente.barrio, cliente.ciudad].filter(Boolean).join(", ") || "Sin dirección"}</span>
      </div>
      {cita.notas && <div style={{ fontSize: 12.5, color: C.ink70, marginTop: 6, fontStyle: "italic" }}>{cita.notas}</div>}

      {activa && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <IconBtn icon={Phone} label="Llamar" href={cliente.telefono ? `tel:${cliente.telefono}` : undefined} disabled={!cliente.telefono} />
          <IconBtn icon={MessageCircle} label="WhatsApp" href={cliente.whatsapp ? wa : undefined} disabled={!cliente.whatsapp} />
          <IconBtn icon={CalendarPlus} label="Posponer / reprogramar" onClick={() => onPosponer(cita)} />
          <div style={{ flex: 1 }} />
          <IconBtn icon={Check} label="Marcar cumplida" onClick={() => onCumplida(cita)} />
          <IconBtn icon={X} label="Cancelar cita" tone="line" onClick={() => onCancelar(cita)} />
        </div>
      )}
    </div>
  );
}
