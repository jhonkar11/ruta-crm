import { Phone, MessageCircle, Edit3, Archive, Trash2, Calendar } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function ClientCard({ client, r: clientProp, profile, onEdit, onArchive, onDelete }) {
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
  const nombreCliente = `${currentClient.nombres || ""} ${currentClient.apellidos || ""}`.trim();
  const nombreAsesor = profile?.nombre || "Asesor";

  // Mensaje exacto institucional de Banco Caja Social
  const textoMensaje = `Hola ${nombreCliente}, te saluda ${nombreAsesor} de Banco Caja Social. Como tu banco amigo, te recordamos que tenemos programada nuestra visita de seguimiento para el día de mañana. ¿Te queda bien el horario acordado para reunirnos? ¡Un amigo hoy, mañana y siempre!`;
  
  const waHref = waClean ? `https://wa.me/57${waClean}?text=${encodeURIComponent(textoMensaje)}` : undefined;

  return (
    <div style={{
      // Estilo Glassmorphism translúcido y elegante acorde al Login
      background: "rgba(255, 255, 255, 0.07)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: "16px 18px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginBottom: 10,
      color: "#fff"
    }}>
      {/* Cabecera de la tarjeta: Nombre y Estado Principal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, textTransform: "uppercase" }}>
            {nombreCliente}
          </h3>
          <p style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.6)", margin: "2px 0 0 0" }}>
            CC/NIT: {currentClient.id || currentClient.cedula || "S/N"}
          </p>
        </div>
        <Stamp estado={estadoReal} size="sm" />
      </div>

      {/* Dirección */}
      {currentClient.direccion && (
        <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.85)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#FF6B4A" }}>📍</span>
          <span>{currentClient.direccion} {currentClient.barrio ? `- ${currentClient.barrio}` : ""}</span>
        </div>
      )}

      {/* Detalles secundarios sincronizados */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "rgba(255, 255, 255, 0.65)", flexWrap: "wrap" }}>
        {currentClient.tipo_negocio && (
          <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.12)", fontWeight: 500, color: "#fff" }}>
            {currentClient.tipo_negocio}
          </span>
        )}
        <span>•</span>
        <span style={{ color: "#FF6B4A", fontWeight: 600 }}>
          {estadoReal}
        </span>
        {currentClient.fecha_seguimiento && (
          <>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(225, 78, 42, 0.15)", padding: "2px 6px", borderRadius: 6, color: "#ffb4a9", border: "1px solid rgba(225, 78, 42, 0.3)" }}>
              <Calendar size={12} /> Seguimiento: {currentClient.fecha_seguimiento}
            </span>
          </>
        )}
      </div>

      {/* Botones de acción rápida inferior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
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
            href={waHref} 
            disabled={!waClean} 
          />
          <IconBtn 
            icon={Edit3} 
            label="Editar" 
            onClick={() => onEdit && onEdit(currentClient)} 
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn 
            icon={Archive} 
            label="Archivar" 
            onClick={() => onArchive && onArchive(currentClient)} 
          />
          <IconBtn 
            icon={Trash2} 
            label="Eliminar" 
            onClick={() => onDelete && onDelete(currentClient.id)} 
          />
        </div>
      </div>
    </div>
  );
}