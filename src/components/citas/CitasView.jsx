import { useState } from "react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn, EmptyState } from "../ui/UIKit";
import { Phone, MessageCircle, Calendar, CheckCircle2, Clock } from "lucide-react";

export default function CitasView({ citas = [], clientes = [], onAgendar, onPosponer, onCompletar }) {
  const [filtro, setFiltro] = useState("todos"); // "todos", "vencidas", "hoy", "proximas"

  // Función auxiliar para formatear fecha y hora de forma limpia
  const formatearFechaHora = (fechaHoraStr) => {
    if (!fechaHoraStr) return { fecha: "Sin fecha", hora: "Sin hora" };
    try {
      const d = new Date(fechaHoraStr);
      if (isNaN(d.getTime())) return { fecha: "Sin fecha", hora: "Sin hora" };
      
      const fechaFormateada = d.toLocaleDateString("es-CO", { year: 'numeric', month: '2-digit', day: '2-digit' });
      const horaFormateada = d.toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit', hour12: true });
      return { fecha: fechaFormateada, hora: horaFormateada };
    } catch {
      return { fecha: "Sin fecha", hora: "Sin hora" };
    }
  };

  // Filtrado de citas según la pestaña seleccionada
  const citasFiltradas = citas.filter(c => {
    if (filtro === "vencidas") return c.estado === "Vencida" || (c.fecha_hora && new Date(c.fecha_hora) < new Date());
    if (filtro === "hoy") return c.estado === "Hoy";
    if (filtro === "proximas") return c.estado === "Programada" || c.estado === "Próxima";
    return true;
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Pestañas de Filtro Rápido */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { id: "todos", label: "Todas" },
          { id: "vencidas", label: "Vencidas" },
          { id: "hoy", label: "Hoy" },
          { id: "proximas", label: "Próximas" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFiltro(tab.id)}
            style={{
              background: filtro === tab.id ? C.coral : "#FFFFFF",
              color: filtro === tab.id ? "#FFFFFF" : C.ink70,
              border: `1px solid ${filtro === tab.id ? C.coral : C.line}`,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: filtro === tab.id ? "0 2px 4px rgba(225, 112, 85, 0.3)" : "none"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listado de Tarjetas */}
      {citasFiltradas.length === 0 ? (
        <EmptyState text="No hay citas registradas en este filtro." />
      ) : (
        citasFiltradas.map((cita) => {
          // Búsqueda flexible del cliente por ID (flexible a string/number) o usando propiedades directas de la cita
          const cliente = clientes.find(c => String(c.id) === String(cita.cliente_id || cita.id_cliente)) || {};
          
          const nombreCliente = cliente.nombres 
            ? `${cliente.nombres} ${cliente.apellidos || ""}` 
            : (cita.nombre_cliente || cita.nombres || "Cliente sin nombre");

          const nitCliente = cliente.id || cita.cliente_id || cita.id_cliente || "N/A";
          const direccionCliente = cliente.direccion || cita.direccion || "Dirección no especificada";
          const telefonoCliente = cliente.telefono || cita.telefono;
          const whatsappCliente = cliente.whatsapp || cliente.telefono || cita.whatsapp;

          const { fecha, hora } = formatearFechaHora(cita.fecha_hora || cita.fecha);

          return (
            <div 
              key={cita.id || cita.cliente_id} 
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                marginBottom: 14,
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                position: "relative"
              }}
            >
              {/* Encabezado de la Tarjeta */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink }}>
                    {nombreCliente}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.ink40 }}>
                    CC/NIT {nitCliente}
                  </div>
                </div>
                <Stamp estado={cita.estado || "Programada"} size="sm" />
              </div>

              {/* Fecha, Hora y Dirección Real */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: C.ink70, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={13} color={C.coral} /> {fecha}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={13} color={C.coral} /> {hora}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: C.ink70, marginBottom: 14 }}>
                📍 {direccionCliente}
              </div>

              {/* Barra de Acciones Directas (Llamada, WhatsApp, Reprogramar, Cumplida) */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {telefonoCliente && (
                    <IconBtn 
                      icon={Phone} 
                      href={`tel:${telefonoCliente}`} 
                      label="Llamar" 
                    />
                  )}
                  {whatsappCliente && (
                    <IconBtn 
                      icon={MessageCircle} 
                      href={`https://wa.me/57${whatsappCliente}`} 
                      label="WhatsApp" 
                    />
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onPosponer) onPosponer(cita);
                    }}
                    style={{
                      background: "#FEF3C7",
                      color: "#D97706",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  >
                    Reprogramar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCompletar) onCompletar(cita);
                    }}
                    style={{
                      background: "#D1FAE5",
                      color: "#059669",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <CheckCircle2 size={13} /> Cumplida
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}