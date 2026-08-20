import { useState, useMemo } from "react";
import { Calendar, Clock, Plus, CheckCircle, XCircle } from "lucide-react";
import { C, inputStyle } from "../../styles/tokens";
import { EmptyState } from "../ui/UIKit";

export default function CitasView({ citas = [], clientes = [], currentUser, onCrear, onPosponer, onCumplida, onCancelar }) {
  const [filtroTab, setFiltroTab] = useState("TODAS");
  const [modalAgendar, setModalAgendar] = useState(false);
  const [modalReprogramar, setModalReprogramar] = useState(null);

  // Estilo ultra forzado en azul marino oscuro para máxima visibilidad
  const labelStyleAzulOscuro = {
    fontSize: "11.5px",
    fontWeight: "700 !important",
    color: "#1e3a8a", // Azul marino profundo y llamativo
    display: "block",
    marginBottom: "6px",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  };

  // Estados del formulario para nueva cita
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [notas, setNotas] = useState("");

  // Estado para la nueva fecha al reprogramar
  const [nuevaFechaReprogramar, setNuevaFechaReprogramar] = useState("");

  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      if (filtroTab === "PROGRAMADAS") return c.estado === "Programada" || c.estado === "Pendiente";
      if (filtroTab === "CUMPLIDAS") return c.estado === "Cumplida" || c.estado === "Visitado";
      if (filtroTab === "REPROGRAMADAS") return c.estado === "Reprogramada";
      return true; // "TODAS"
    });
  }, [citas, filtroTab]);

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !fecha) {
      alert("Por favor selecciona un cliente y una fecha.");
      return;
    }
    await onCrear({
      clienteId,
      fechaHora: `${fecha}T${hora}:00`,
      notas
    });
    setModalAgendar(false);
    setClienteId("");
    setFecha("");
    setNotas("");
  };

  const handleReprogramarSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaFechaReprogramar) {
      alert("Selecciona una nueva fecha.");
      return;
    }
    await onPosponer(modalReprogramar, `${nuevaFechaReprogramar}T09:00:00`);
    setModalReprogramar(null);
    setNuevaFechaReprogramar("");
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ 
            fontFamily: "'Space Grotesk', sans-serif", 
            fontSize: 22, 
            fontWeight: 700, 
            color: "#ffffff", 
            margin: 0,
            marginBottom: 4 
          }}>
            Citas y visitas
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
            {citas.length} programadas en total
          </p>
        </div>
        <button
          onClick={() => setModalAgendar(true)}
          style={{
            background: C.ink,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
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
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1.5px solid ${filtroTab === tab.key ? C.coral : C.line}`,
              background: filtroTab === tab.key ? "#FCEBE5" : "#fff",
              color: filtroTab === tab.key ? C.coralDark : C.ink70,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listado */}
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
            const nombreCompleto = `${nombres} ${apellidos}`.trim() || "Cliente sin nombre";
            const cedula = clienteFinal.id || idBuscado || "N/A";
            const direccion = clienteFinal.direccion || c.direccion || "Sin dirección registrada";

            return (
              <div
                key={c.id || Math.random()}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: 20,
                  border: `1px solid #E2E8F0`,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                  position: "relative"
                }}
              >
                <div style={{ position: "absolute", top: 16, right: 20 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
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

                {c.fecha_hora && (
                  <div style={{
                    marginTop: 12, fontSize: 11.5, color: "#92400E", background: "#FEF3C7",
                    padding: "5px 10px", borderRadius: 6, width: "fit-content", display: "flex", alignItems: "center", gap: 6,
                    fontWeight: 600
                  }}>
                    <Clock size={12} /> <span>Fecha y Hora: {c.fecha_hora.replace("T", " ")}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 18, borderTop: `1px solid #F1F5F9`, paddingTop: 14 }}>
                  <button
                    onClick={() => setModalReprogramar(c)}
                    style={{
                      background: "#fff",
                      border: `1px solid ${C.line}`,
                      color: C.ink70,
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Reprogramar
                  </button>

                  <button
                    onClick={() => onCumplida(c)}
                    style={{
                      background: "#ECFDF5",
                      border: "1px solid #A7F3D0",
                      color: "#065F46",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <CheckCircle size={14} /> Cumplida
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NUEVA CITA CON RETOQUE VISUAL */}
      {modalAgendar && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460,
            padding: 28, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #F1F5F9", position: "relative",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Agendar nueva cita
              </h3>
              <button 
                onClick={() => setModalAgendar(false)} 
                style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyleAzulOscuro}>CLIENTE *</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  style={{ ...inputStyle(false), width: "100%", padding: "11px", borderRadius: 10, borderColor: "#CBD5E1" }}
                >
                  <option value="">— Seleccionar —</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nombres} {cli.apellidos} ({cli.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyleAzulOscuro}>FECHA *</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "11px", borderRadius: 10, borderColor: "#CBD5E1" }}
                  />
                </div>
                <div>
                  <label style={labelStyleAzulOscuro}>HORA *</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "11px", borderRadius: 10, borderColor: "#CBD5E1" }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyleAzulOscuro}>NOTAS</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles de la cita..."
                  style={{ ...inputStyle(false), width: "100%", padding: "11px", borderRadius: 10, height: 84, resize: "none", borderColor: "#CBD5E1" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
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
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420,
            padding: 28, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Nueva Fecha</h3>
              <button 
                onClick={() => setModalReprogramar(null)} 
                style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleReprogramarSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyleAzulOscuro}>SELECCIONAR NUEVA FECHA</label>
                <input
                  type="date"
                  value={nuevaFechaReprogramar}
                  onChange={(e) => setNuevaFechaReprogramar(e.target.value)}
                  style={{ ...inputStyle(false), width: "100%", padding: "12px", borderRadius: 10, borderColor: "#CBD5E1" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: C.coral,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  marginTop: 8,
                  boxShadow: "0 4px 12px rgba(232, 89, 12, 0.25)"
                }}
              >
                Guardar Fecha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}