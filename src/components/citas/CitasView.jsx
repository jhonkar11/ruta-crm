import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, Plus, CheckCircle, XCircle, FileText, MapPin, Search } from "lucide-react";
import { C, inputStyle } from "../../styles/tokens";
import { EmptyState } from "../ui/UIKit";

export default function CitasView({ citas = [], clientes = [], currentUser, onCrear, onPosponer, onCumplida, onCancelar }) {
  const [filtroTab, setFiltroTab] = useState(() => localStorage.getItem("citas_filtro_activo") || "TODAS");
  const [modalAgendar, setModalAgendar] = useState(false);
  const [modalReprogramar, setModalReprogramar] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    localStorage.setItem("citas_filtro_activo", filtroTab);
  }, [filtroTab]);

  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [notas, setNotas] = useState("");

  const [nuevaFechaReprogramar, setNuevaFechaReprogramar] = useState("");
  const [nuevaHoraReprogramar, setNuevaHoraReprogramar] = useState("09:00");
  const [nuevaNotaReprogramar, setNuevaNotaReprogramar] = useState("");
  const [nuevaDireccionReprogramar, setNuevaDireccionReprogramar] = useState("");

  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      const matchTab = 
        filtroTab === "TODAS" ? true :
        filtroTab === "PROGRAMADAS" ? (c.estado === "Programada" || c.estado === "Pendiente") :
        filtroTab === "CUMPLIDAS" ? (c.estado === "Cumplida" || c.estado === "Visitado") :
        filtroTab === "REPROGRAMADAS" ? (c.estado === "Reprogramada") : true;

      const textoBusqueda = busqueda.toLowerCase();
      const matchBusqueda = 
        !busqueda || 
        (c.nombre_cliente && c.nombre_cliente.toLowerCase().includes(textoBusqueda)) ||
        (c.observaciones && c.observaciones.toLowerCase().includes(textoBusqueda)) ||
        (c.direccion && c.direccion.toLowerCase().includes(textoBusqueda));

      return matchTab && matchBusqueda;
    });
  }, [citas, filtroTab, busqueda]);

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !fecha) return alert("Por favor selecciona un cliente y una fecha.");

    const payload = {
      cliente_id: parseInt(clienteId),
      fecha_seguimiento: `${fecha}T${hora}:00`,
      observaciones: notas || "",
      estado: "Programada"
    };

    try {
      await onCrear(payload);
      setModalAgendar(false);
      setClienteId(""); setFecha(""); setHora("09:00"); setNotas("");
    } catch (err) {
      alert("Error al agendar: " + err.message);
    }
  };

  const abrirModalReprogramar = (c) => {
    setModalReprogramar(c);
    const fechaBase = c.fecha_seguimiento || c.fecha_hora || "";
    if (fechaBase) {
      const [f, h] = fechaBase.split("T");
      setNuevaFechaReprogramar(f);
      setNuevaHoraReprogramar(h ? h.substring(0, 5) : "09:00");
    }
    setNuevaNotaReprogramar(c.observaciones || "");
    setNuevaDireccionReprogramar(c.direccion || "");
  };

  const handleReprogramarSubmit = async (e) => {
    e.preventDefault();
    if (!modalReprogramar) return;

    const payloadActualizado = {
      fecha_seguimiento: `${nuevaFechaReprogramar}T${nuevaHoraReprogramar}:00`,
      observaciones: nuevaNotaReprogramar,
      direccion: nuevaDireccionReprogramar,
      estado: 'Reprogramada'
    };

    await onPosponer(modalReprogramar, payloadActualizado);
    setModalReprogramar(null);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* BARRA SUPERIOR DE ACCIONES Y FILTROS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, background: "#F1F5F9", padding: 4, borderRadius: 12 }}>
          {["TODAS", "PROGRAMADAS", "REPROGRAMADAS", "CUMPLIDAS"].map(tab => (
            <button
              key={tab}
              onClick={() => setFiltroTab(tab)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: filtroTab === tab ? "#fff" : "transparent",
                color: filtroTab === tab ? C.coral : "#64748B",
                boxShadow: filtroTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModalAgendar(true)}
          style={{ background: C.coral, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <Plus size={18} /> Nueva Cita
        </button>
      </div>

      {/* LISTADO DE CITAS */}
      {citasFiltradas.length === 0 ? (
        <EmptyState icon={Calendar} title="No hay citas registradas" description="No se encontraron elementos que coincidan con los filtros actuales." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {citasFiltradas.map((c, idx) => (
            <div key={c.id || idx} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.coral, background: "#FFF1F2", padding: "4px 8px", borderRadius: 6 }}>
                    {c.estado || "Programada"}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={14} /> {c.fecha_seguimiento ? c.fecha_seguimiento.replace("T", " ") : "Sin fecha"}
                  </span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                  {c.nombre_cliente || c.cliente?.nombre || "Cliente sin nombre"}
                </h4>
                {c.direccion && (
                  <p style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    <MapPin size={14} /> {c.direccion}
                  </p>
                )}
                {c.observaciones && (
                  <p style={{ fontSize: 13, color: "#64748B", background: "#F8FAFC", padding: 8, borderRadius: 8 }}>
                    {c.observaciones}
                  </p>
                )}
              </div>

              {/* ACCIONES DE TARJETA */}
              <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
                <button onClick={() => abrirModalReprogramar(c)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Reprogramar
                </button>
                {onCumplida && (
                  <button onClick={() => onCumplida(c)} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#DCFCE7", color: "#166534", fontSize: 12, fontWeight: 600, cursor: "pointer" }} title="Marcar como cumplida">
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVA CITA */}
      {modalAgendar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Agendar Nueva Cita</h3>
            <form onSubmit={handleCrearSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: 4 }}>Cliente</label>
                <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={inputStyle(false)}>
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: 4 }}>Fecha</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle(false)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: 4 }}>Hora</label>
                  <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={inputStyle(false)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: 4 }}>Notas / Observaciones</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Detalles de la cita..." style={inputStyle(false)} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setModalAgendar(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 12, background: C.coral, color: "#fff", border: "none", cursor: "pointer" }}>Guardar Cita</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPROGRAMAR INTEGRADO */}
      {modalReprogramar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Reprogramar Cita</h3>
            <form onSubmit={handleReprogramarSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input type="date" value={nuevaFechaReprogramar} onChange={e => setNuevaFechaReprogramar(e.target.value)} style={inputStyle(false)} />
                <input type="time" value={nuevaHoraReprogramar} onChange={e => setNuevaHoraReprogramar(e.target.value)} style={inputStyle(false)} />
              </div>
              <input type="text" value={nuevaDireccionReprogramar} onChange={e => setNuevaDireccionReprogramar(e.target.value)} placeholder="Dirección" style={inputStyle(false)} />
              <textarea value={nuevaNotaReprogramar} onChange={e => setNuevaNotaReprogramar(e.target.value)} placeholder="Notas..." style={inputStyle(false)} />
              
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setModalReprogramar(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 12, background: C.coral, color: "#fff", border: "none", cursor: "pointer" }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}