import { useState } from "react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn, EmptyState } from "../ui/UIKit";
import { Phone, MessageCircle, Calendar, CheckCircle2, Clock } from "lucide-react";

export default function CitasView({ citas = [], clientes = [], onAgendar, onPosponer, onCompletar }) {
  const [filtro, setFiltro] = useState("todos");

  // Si 'citas' llega vacío, usamos la lista de 'clientes' que tienen fecha_seguimiento asignada
  const listadoClientesOCitas = citas.length > 0 ? citas : clientes.filter(c => c.fecha_seguimiento);

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return { fecha: "Sin fecha", hora: "Sin hora" };
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return { fecha: fechaStr, hora: "09:00 a. m." };
      
      const fechaFormateada = d.toLocaleDateString("es-CO", { year: 'numeric', month: '2-digit', day: '2-digit' });
      return { fecha: fechaFormateada, hora: "09:00 a. m." };
    } catch {
      return { fecha: fechaStr, hora: "09:00 a. m." };
    }
  };

  const citasFiltradas = listadoClientesOCitas.filter(item => {
    const estadoItem = item.estado || item.categoria_cliente || "Programada";
    if (filtro === "vencidas") return item.fecha_seguimiento && new Date(item.fecha_seguimiento) < new Date();
    if (filtro === "hoy") return item.fecha_seguimiento === new Date().toISOString().split('T')[0];
    if (filtro === "proximas") return item.fecha_seguimiento && new Date(item.fecha_seguimiento) >= new Date();
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
        <EmptyState text="No hay citas o seguimientos registrados." />
      ) : (
        citasFiltradas.map((item, index) => {
          // Mapeo directo con las columnas de tu tabla clientes de Supabase
          const nombreCompleto = item.nombres ? `${item.nombres} ${item.apellidos || ""}`.trim() : (item.nombre_cliente || "Cliente sin nombre");
          const nitCliente = item.id || "N/A";
          const direccionCliente = item.direccion || "Dirección no especificada";
          const telefonoCliente = item.telefono;
          const whatsappCliente = item.whatsapp || item.telefono;
          const estadoEtiqueta = item.estado || item.categoria_cliente || "Programada";

          const { fecha, hora } = formatearFechaHora(item.fecha_seguimiento || item.fecha);

          return (
            <div 
              key={item.id || index} 
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
                    {nombreCompleto}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.ink40 }}>
                    CC/NIT {nitCliente}
                  </div>
                </div>
                <Stamp estado={estadoEtiqueta} size="sm" />
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
                📍 {direccionCliente} {item.barrio ? `- ${item.barrio}` : ""} {item.ciudad ? `(${item.ciudad})` : ""}
              </div>

              {/* Barra de Acciones Directas */}
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
                    onClick={() => onPosponer && onPosponer(item)}
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
                    onClick={() => onCompletar && onCompletar(item)}
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