import { Phone, MessageCircle, Calendar, Clock, MapPin, Building2 } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function CitaCard({ cita, onEdit, onComplete, profile }) {
  if (!cita) return null;

  // Extraer de forma segura el teléfono y datos del cliente asociado
  const cliente = cita.cliente || {};
  const telefono = cliente.telefono || cita.telefono || "";
  const whatsapp = cliente.whatsapp || cita.whatsapp || telefono;
  const nombres = cliente.nombres || cita.nombres || "Cliente";
  const apellidos = cliente.apellidos || cita.apellidos || "";

  // Solución inteligente para el nombre del asesor (maneja texto o objeto)
  let nombreAsesor = "Asesor";
  if (typeof profile === "string") {
    nombreAsesor = profile.includes("jhonka001") ? "Jhon Alexander Vasquez Revelo" : profile;
  } else {
    nombreAsesor = profile?.nombre || profile?.nombre_completo || profile?.displayName || profile?.name || (profile?.email?.includes("jhonka001") ? "Jhon Alexander Vasquez Revelo" : "Asesor");
  }

  const telHref = telefono ? `tel:${telefono}` : undefined;
  
  const mensajeWa = encodeURIComponent(
    `Hola ${nombres}, te saluda ${nombreAsesor} de Banco Caja Social para recordarte tu cita programada. ¡Un amigo hoy, mañana y siempre!`
  );
  const waHref = whatsapp ? `https://wa.me/57${whatsapp.replace(/\D/g, "")}?text=${mensajeWa}` : undefined;

  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
      border: `1px solid ${C.line}`, position: "relative",
    }}>
      <div style={{ position: "absolute", top: -8, right: 14 }}>
        <Stamp estado={cita.estado || "Pendiente"} />
      </div>

      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, paddingRight: 70 }}>
        {nombres} {apellidos}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 13, color: C.ink70 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Calendar size={14} color={C.coral} />
          <span>{cita.fecha || "Sin fecha"}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={14} color={C.coral} />
          <span>{cita.hora || "Sin hora"}</span>
        </span>
      </div>

      {cliente.direccion && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, color: C.ink70 }}>
          <MapPin size={13} color={C.coral} />
          <span>{cliente.direccion}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
        <IconBtn icon={Phone} label="Llamar" href={telHref} disabled={!telefono} />
        <IconBtn icon={MessageCircle} label="WhatsApp" href={waHref} disabled={!whatsapp} />
        <div style={{ flex: 1 }} />
        {onComplete && cita.estado !== "Completada" && (
          <button 
            onClick={() => onComplete(cita)}
            style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Completar
          </button>
        )}
      </div>
    </div>
  );
}