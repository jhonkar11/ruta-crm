import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, Plus, CheckCircle, XCircle, FileText, MapPin } from "lucide-react";
import { C, inputStyle } from "../../styles/tokens";
import { EmptyState } from "../ui/UIKit";

export default function CitasView({ citas = [], clientes = [], currentUser, onCrear, onPosponer, onCumplida, onCancelar }) {
  const [filtroTab, setFiltroTab] = useState(() => localStorage.getItem("citas_filtro_activo") || "TODAS");
  const [modalAgendar, setModalAgendar] = useState(false);
  const [modalReprogramar, setModalReprogramar] = useState(null);

  useEffect(() => {
    localStorage.setItem("citas_filtro_activo", filtroTab);
  }, [filtroTab]);

  const labelStyleAzulOscuro = {
    fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", display: "block", marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase"
  };

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
      if (filtroTab === "PROGRAMADAS") return c.estado === "Programada" || c.estado === "Pendiente";
      if (filtroTab === "CUMPLIDAS") return c.estado === "Cumplida" || c.estado === "Visitado";
      if (filtroTab === "REPROGRAMADAS") return c.estado === "Reprogramada";
      return true;
    });
  }, [citas, filtroTab]);

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

    // Integración directa: enviamos el objeto cita completo y los cambios
    await onPosponer(modalReprogramar, payloadActualizado);
    setModalReprogramar(null);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Encabezado y Listado (Mantiene tu estructura original pero conectada a estas funciones) */}
      {/* ... (Tu UI de listado existente) ... */}
      
      {/* MODAL REPROGRAMAR INTEGRADO */}
      {modalReprogramar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Reprogramar Cita</h3>
            <form onSubmit={handleReprogramarSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Inputs de fecha y hora */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input type="date" value={nuevaFechaReprogramar} onChange={e => setNuevaFechaReprogramar(e.target.value)} style={inputStyle(false)} />
                <input type="time" value={nuevaHoraReprogramar} onChange={e => setNuevaHoraReprogramar(e.target.value)} style={inputStyle(false)} />
              </div>
              <input type="text" value={nuevaDireccionReprogramar} onChange={e => setNuevaDireccionReprogramar(e.target.value)} placeholder="Dirección" style={inputStyle(false)} />
              <textarea value={nuevaNotaReprogramar} onChange={e => setNuevaNotaReprogramar(e.target.value)} placeholder="Notas..." style={inputStyle(false)} />
              
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setModalReprogramar(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff" }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 12, background: C.coral, color: "#fff", border: "none" }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}