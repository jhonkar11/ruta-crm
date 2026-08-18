import { useState } from "react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn, EmptyState } from "../ui/UIKit";
import { Phone, MessageCircle, Calendar, CheckCircle2, Clock, X } from "lucide-react";

export default function CitasView({ citas = [], clientes = [], onAgendar, onPosponer, onCompletar, onCumplida }) {
  const [filtro, setFiltro] = useState("todos");
  // Estado para el modal de reprogramación
  const [citaAReprogramar, setCitaAReprogramar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Sin fecha";
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleDateString("es-CO", { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return fechaStr;
    }
  };

  const citasFiltradas = citas.filter(item => {
    if (filtro === "todos") return true;
    if (filtro === "vencidas") return item.fecha_hora && new Date(item.fecha_hora) < new Date();
    if (filtro === "hoy") return item.fecha_hora && item.fecha_hora.startsWith(new Date().toISOString().split('T')[0]);
    if (filtro === "proximas") return item.fecha_hora && new Date(item.fecha_hora) >= new Date();
    // Filtros por estado
    return item.estado === filtro;
  });

  const handleCumplir = (cita, c) => {
    const fn = onCumplida || onCompletar;
    if (fn) fn(cita);
  };

  const confirmarReprogramacion = () => {
    if (citaAReprogramar && nuevaFecha) {
      onPosponer(citaAReprogramar, nuevaFecha);
      setCitaAReprogramar(null);
      setNuevaFecha("");
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Pestañas de Filtro */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { id: "todos", label: "Todas" },
          { id: "Programada", label: "Programadas" },
          { id: "Cumplida", label: "Cumplidas" },
          { id: "Reprogramada", label: "Reprogramadas" }
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
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modal de Reprogramación */}
      {citaAReprogramar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 16, width: "100%", maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Nueva Fecha</h3>
              <X size={20} onClick={() => setCitaAReprogramar(null)} style={{ cursor: "pointer" }} />
            </div>
            <input type="date" onChange={(e) => setNuevaFecha(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 16 }} />
            <button onClick={confirmarReprogramacion} style={{ width: "100%", padding: 12, background: C.coral, color: "white", border: "none", borderRadius: 8, fontWeight: 700 }}>Guardar Fecha</button>
          </div>
        </div>
      )}

      {/* Listado */}
      {citasFiltradas.length === 0 ? (
        <EmptyState text="No hay citas con este filtro." />
      ) : (
        citasFiltradas.map((cita, index) => {
          const c = (typeof cita.cliente === 'object' && cita.cliente !== null) ? cita.cliente : clientes.find(cl => String(cl.id).trim() === String(cita.clienteId || cita.cliente_id || "").trim()) || {};
          const nombreCompleto = c.nombres ? `${c.nombres} ${c.apellidos || ""}`.trim() : "Cliente Desconocido";
          const estadoEtiqueta = cita.estado || "Programada";

          return (
            <div key={cita.id || index} style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 14, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{nombreCompleto}</div>
                  <div style={{ fontSize: 11, color: C.ink40 }}>CC/NIT {c.id || "N/A"}</div>
                </div>
                <Stamp estado={estadoEtiqueta} size="sm" />
              </div>

              <div style={{ fontSize: 12, color: C.ink70, marginBottom: 14 }}>📍 {c.direccion || "Sin dirección"}</div>

              <div style={{ display: "flex", gap: 8, borderTop: "1px solid #eee", paddingTop: 12 }}>
                <button onClick={() => setCitaAReprogramar(cita)} style={{ background: "#FEF3C7", color: "#D97706", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reprogramar</button>
                <button onClick={() => handleCumplir(cita, c)} style={{ background: "#D1FAE5", color: "#059669", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  <CheckCircle2 size={13} /> Cumplida
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}