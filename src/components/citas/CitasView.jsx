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
    fontSize: "11.5px",
    fontWeight: "700",
    color: "#1e3a8a",
    display: "block",
    marginBottom: "6px",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  };

  // Estados del formulario para nueva cita
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [direccionNueva, setDireccionNueva] = useState("");
  const [notas, setNotas] = useState("");

  // Estados para el formulario de reprogramación avanzada
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

  // Función clave: Al seleccionar un cliente, autocompletamos sus datos pero permitiendo editarlos
  const handleClienteSelectChange = (e) => {
    const idSeleccionado = e.target.value;
    setClienteId(idSeleccionado);

    if (!idSeleccionado) {
      setDireccionNueva("");
      setNotas("");
      return;
    }

    const clienteEncontrado = clientes.find(cli => cli && (cli.id === idSeleccionado || String(cli.id) === String(idSeleccionado)));
    if (clienteEncontrado) {
      setDireccionNueva(clienteEncontrado.direccion || "");
      setNotas(clienteEncontrado.observaciones || clienteEncontrado.notas || "");
    }
  };

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !fecha) {
      alert("Por favor selecciona un cliente y una fecha.");
      return;
    }

    try {
      const payload = {
        clienteId: String(clienteId),
        cliente_id: parseInt(clienteId),
        fechaHora: `${fecha}T${hora}:00`,
        fecha_seguimiento: `${fecha}T${hora}:00`,
        direccion: direccionNueva,
        observaciones: notas || "",
        estado: "Programada"
      };

      await onCrear(payload);

      setModalAgendar(false);
      setClienteId("");
      setFecha("");
      setHora("09:00");
      setDireccionNueva("");
      setNotas("");
    } catch (error) {
      alert(`Error al guardar: ${error.message || JSON.stringify(error)}`);
    }
  };

  const abrirModalReprogramar = (c) => {
    setModalReprogramar(c);
    
    const fechaBase = c.fecha_seguimiento || c.fecha_hora;
    if (fechaBase) {
      const partes = fechaBase.split("T");
      setNuevaFechaReprogramar(partes[0] || "");
      if (partes[1]) {
        setNuevaHoraReprogramar(partes[1].substring(0, 5));
      } else {
        setNuevaHoraReprogramar("09:00");
      }
    } else {
      setNuevaFechaReprogramar("");
      setNuevaHoraReprogramar("09:00");
    }
    
    setNuevaNotaReprogramar(c.observaciones || c.notas || "");

    const idBuscado = c.clienteId || c.cliente_id || c.id;
    const clienteEnLista = clientes.find(cli => cli && (cli.id === idBuscado || String(cli.id) === String(idBuscado)));
    const clienteObjEnCita = typeof c.cliente === "object" && c.cliente !== null ? c.cliente : null;
    const clienteFinal = clienteObjEnCita || clienteEnLista || c;
    setNuevaDireccionReprogramar(clienteFinal.direccion || c.direccion || "");
  };

  const handleReprogramarSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaFechaReprogramar || !modalReprogramar) {
      alert("Selecciona una nueva fecha.");
      return;
    }
    
    const fechaHoraCompleta = `${nuevaFechaReprogramar}T${nuevaHoraReprogramar}:00`;
    
    const payloadActualizado = {
      estado: 'Reprogramada',
      fecha_seguimiento: fechaHoraCompleta,
      observaciones: nuevaNotaReprogramar,
      direccion: nuevaDireccionReprogramar
    };

    await onPosponer(modalReprogramar, payloadActualizado);
    setModalReprogramar(null);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#ffffff", margin: 0, marginBottom: 4 }}>
            Citas y visitas
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
            {citas.length} programadas en total
          </p>
        </div>
        <button
          onClick={() => setModalAgendar(true)}
          style={{
            background: C.ink, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px",
            fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <Plus size={16} /> Agendar
        </button>
      </div>

      {/* Pestañas de filtrado */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { key: "TODAS", label: "Todas" },
          { key: "PROGRAMADAS", label: "Programadas" },
          { key: "CUMPLIDAS", label: "Cumplidas" },
          { key: "REPROGRAMADAS", label: "Reprogramadas" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFiltroTab(tab.key)}
            style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
              border: `1.5px solid ${filtroTab === tab.key ? C.coral : C.line}`,
              background: filtroTab === tab ? "#FCEBE5" : "#fff",
              color: filtroTab === tab ? C.coralDark : C.ink70,
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listado de tarjetas */}
      {citasFiltradas.length === 0 ? (
        <EmptyState text="No hay citas registradas en esta vista." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {citasFiltradas.map((c) => {
            const idBuscado = c.clienteId || c.cliente_id || c.id;
            const clienteEnLista = clientes.find(cli => cli && (cli.id === idBuscado || String(cli.id) === String(idBuscado)));
            const clienteObjEnCita = typeof c.cliente === "object" && c.cliente !== null ? c.cliente : null;
            const clienteFinal = clienteObjEnCita || clienteEnLista || c;

            const nombres = clienteFinal.nombres || clienteFinal.nombre || "";
            const apellidos = clienteFinal.apellidos || "";
            const nombreCompleto = `${nombres} ${apellidos}`.trim() || c.nombre_cliente || "Cliente sin nombre";
            const cedula = clienteFinal.id || idBuscado || "N/A";
            const direccion = clienteFinal.direccion || c.direccion || "Sin dirección registrada";
            
            const fechaMostrada = c.fecha_seguimiento || c.fecha_hora;
            const notaMostrada = c.observaciones || c.notas;

            return (
              <div
                key={c.id || Math.random()}
                style={{
                  background: "#FFFFFF", borderRadius: 12, padding: 20, border: `1px solid #E2E8F0`,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", position: "relative"
                }}
              >
                <div style={{ position: "absolute", top: 16, right: 20 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                    background: c.estado === "Cumplida" || c.estado === "Visitado" ? "#D1FAE5" : c.estado === "Reprogramada" ? "#DBEAFE" : "#FEF3C7",
                    color: c.estado === "Cumplida" || c.estado === "Visitado" ? "#065F46" : c.estado === "Reprogramada" ? "#1E40AF" : "#92400E",
                    textTransform: "uppercase"
                  }}>
                    {c.estado || "Programada"}
                  </span>
                </div>

                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A", paddingRight: 100 }}>
                  {nombreCompleto}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#64748B", marginTop: 4 }}>
                  CC/NIT: {cedula}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 14, fontSize: 13, color: "#475569" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📍</span> {direccion}
                  </span>
                </div>

                {fechaMostrada && (
                  <div style={{
                    marginTop: 12, fontSize: 11.5, color: "#92400E", background: "#FEF3C7",
                    padding: "5px 10px", borderRadius: 6, width: "fit-content", display: "flex", alignItems: "center", gap: 6, fontWeight: 600
                  }}>
                    <Clock size={12} /> <span>Fecha y Hora: {fechaMostrada.replace("T", " ")}</span>
                  </div>
                )}

                {notaMostrada && (
                  <div style={{
                    marginTop: 10, background: "#F8FAFC", borderLeft: "3px solid #3B82F6",
                    padding: "8px 12px", borderRadius: "0 8px 8px 0", fontSize: 12.5, color: "#334155", display: "flex", gap: 8
                  }}>
                    <FileText size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div><strong style={{ color: "#1E293B", marginRight: 4 }}>Nota:</strong><span style={{ fontStyle: "italic" }}>{notaMostrada}</span></div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 18, borderTop: `1px solid #F1F5F9`, paddingTop: 14 }}>
                  <button
                    onClick={() => abrirModalReprogramar(c)}
                    style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.ink70, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Reprogramar
                  </button>
                  <button
                    onClick={() => onCumplida(c)}
                    style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <CheckCircle size={14} /> Cumplida
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NUEVA CITA CON CAMPOS EDITABLES AUTOCOMPLETADOS */}
      {modalAgendar && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460,
            padding: 28, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", border: "1px solid #F1F5F9", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Agendar nueva cita
              </h3>
              <button onClick={() => setModalAgendar(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={labelStyleAzulOscuro}>CLIENTE *</div>
                <select
                  value={clienteId}
                  onChange={handleClienteSelectChange}
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1" }}
                >
                  <option value="">— Seleccionar —</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nombres} {cli.apellidos} ({cli.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={labelStyleAzulOscuro}>FECHA *</div>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1" }}
                  />
                </div>
                <div>
                  <div style={labelStyleAzulOscuro}>HORA *</div>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1", background: "#fff" }}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyleAzulOscuro}>DIRECCIÓN (AUTOCARREGADA / EDITABLE)</div>
                <input
                  type="text"
                  value={direccionNueva}
                  onChange={(e) => setDireccionNueva(e.target.value)}
                  placeholder="Dirección del cliente..."
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1" }}
                />
              </div>

              <div>
                <div style={labelStyleAzulOscuro}>NOTAS / OBSERVACIONES</div>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles de la cita..."
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, height: 72, resize: "none", borderColor: "#CBD5E1" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setModalAgendar(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid #CBD5E1`, background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#0F172A", color: "#fff", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)" }}
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPROGRAMAR */}
      {modalReprogramar && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460,
            padding: 28, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Reprogramar Cita / Visita
              </h3>
              <button onClick={() => setModalReprogramar(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleReprogramarSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={labelStyleAzulOscuro}>NUEVA FECHA *</div>
                  <input
                    type="date"
                    value={nuevaFechaReprogramar}
                    onChange={(e) => setNuevaFechaReprogramar(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1" }}
                  />
                </div>
                <div>
                  <div style={labelStyleAzulOscuro}>NUEVA HORA *</div>
                  <input
                    type="time"
                    value={nuevaHoraReprogramar}
                    onChange={(e) => setNuevaHoraReprogramar(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1", background: "#fff" }}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyleAzulOscuro}>ACTUALIZAR DIRECCIÓN</div>
                <input
                  type="text"
                  value={nuevaDireccionReprogramar}
                  onChange={(e) => setNuevaDireccionReprogramar(e.target.value)}
                  placeholder="Dirección de la visita..."
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, borderColor: "#CBD5E1" }}
                />
              </div>

              <div>
                <div style={labelStyleAzulOscuro}>NOTA / OBSERVACIÓN</div>
                <textarea
                  value={nuevaNotaReprogramar}
                  onChange={(e) => setNuevaNotaReprogramar(e.target.value)}
                  placeholder="Notas adicionales..."
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 10, height: 64, resize: "none", borderColor: "#CBD5E1" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setModalReprogramar(null)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid #CBD5E1`, background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: C.coral, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(232, 89, 12, 0.25)" }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}