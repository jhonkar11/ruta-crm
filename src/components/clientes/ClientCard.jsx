import { Phone, MessageCircle, Edit3, Archive, Trash2, Calendar } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function ClientCard({ client, onEdit, onArchive, onDelete }) {
  if (!client) return null;

  // Unificamos el estado para que la etiqueta pequeña y la grande coincidan exactamente
  const estadoReal = client.estado || client.categoria_cliente || "Registrado";

  const formatPhone = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const telClean = formatPhone(client.telefono);
  const waClean = formatPhone(client.whatsapp || client.telefono);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "14px 16px",
      border: `1px solid ${C.line}`,
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      {/* Cabecera de la tarjeta: Nombre y Estado Principal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, textTransform: "uppercase" }}>
            {client.nombres} {client.apellidos}
          </h3>
          <p style={{ fontSize: 11.5, color: C.ink70, margin: "2px 0 0 0" }}>
            CC/NIT: {client.id || client.cedula || "S/N"}
          </p>
        </div>
        <Stamp estado={estadoReal} size="sm" />
      </div>

      {/* Dirección */}
      {client.direccion && (
        <div style={{ fontSize: 12, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: C.coral }}>📍</span>
          <span>{client.direccion} {client.barrio ? `- ${client.barrio}` : ""}</span>
        </div>
      )}

      {/* Detalles secundarios (Tipo de negocio y Estado unificado coherente) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.ink70, flexWrap: "wrap" }}>
        {client.tipo_negocio && (
          <span style={{ background: "#f8fafc", padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.line}`, fontWeight: 500 }}>
            {client.tipo_negocio}
          </span>
        )}
        <span>•</span>
        <span style={{ color: C.coral, fontWeight: 600 }}>
          {estadoReal}
        </span>
        {client.fecha_seguimiento && (
          <>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff7ed", padding: "2px 6px", borderRadius: 6, color: "#9a3412" }}>
              <Calendar size={12} /> Seguimiento: {client.fecha_seguimiento}
            </span>
          </>
        )}
      </div>

      {/* Botones de acción rápida inferior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn 
            icon={Phone} 
            label="Llamar" 
            href={telClean ? `tel:${telClean}` : undefined} 
            disabled={!telClean} 
          />
          <IconBtn 
            icon={MessageCircle} 
            label="WhatsApp" 
            href={waClean ? `https://wa.me/57${waClean}` : undefined} 
            disabled={!waClean} 
          />
          <IconBtn 
            icon={Edit3} 
            label="Editar" 
            onClick={() => onEdit(client)} 
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn 
            icon={Archive} 
            label="Archivar" 
            onClick={() => onArchive && onArchive(client)} 
          />
          <IconBtn 
            icon={Trash2} 
            label="Eliminar" 
            onClick={() => onDelete && onDelete(client.id)} 
          />
        </div>
      </div>
    </div>
  );
}