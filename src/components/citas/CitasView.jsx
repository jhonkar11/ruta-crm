import { useState, useMemo } from "react";
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, CalendarDays, Search } from "lucide-react";
import { C, inputStyle } from "../../styles/tokens";
import { EmptyState, TextInput } from "../ui/UIKit";

export default function CitasView({ citas = [], clientes = [], currentUser, onCrear, onPosponer, onCumplida, onCancelar }) {
  const [filtroTab, setFiltroTab] = useState("TODAS");
  const [modalAgendar, setModalAgendar] = useState(false);
  const [modalReprogramar, setModalReprogramar] = useState(null);

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
      {/* Encabezado con título en blanco impecable */}
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
          <p style={{ 
            fontSize: 13, 
            color: "rgba(255, 255, 255, 0.8)", 
            margin: 0 
          }}>
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

      {/* Pestañas de filtrado superior estilo chips */}
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

      {/* Listado de citas */}
      {citasFiltradas.length === 0 ? (
        <EmptyState text="No hay citas registradas en esta vista." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {citasFiltradas.map((c) => {
            // Robustez para encontrar el cliente sin importar cómo venga la relación desde la base de datos
            const idBuscado = c.cliente_id || c.clienteId || (typeof c.cliente === "string" ? c.cliente : null);
            const clienteObjEnCita = typeof c.cliente === "object" && c.cliente !== null ? c.cliente : null;
            
            const cliente = clienteObjEnCita || clientes.find(cli => cli.id === idBuscado || String(cli.id) === String(idBuscado));
            
            const nombreCliente = cliente ? `${cliente.nombres || cliente.nombre || ""} ${cliente.apellidos || ""}`.trim() : (c.nombre_cliente || "Cliente sin nombre");
            const cedulaCliente = cliente ? cliente.id : (idBuscado || "N/A");
            const direccionCliente = cliente ? cliente.direccion : (c.direccion || "Sin dirección");

            return (
              <div
                key={c.id || Math.random()}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "16px 20px",
                  border: `1px solid ${C.line}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  position: "relative"
                }}
              >
                {/* Badge de estado superior derecho */}
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
                    {c.estado}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>{nombreCliente}</h4>
                  <span style={{ fontSize: 12, color: C.ink40 }}>CC/NIT {cedulaCliente}</span>
                </div>

                <div style={{ fontSize: 13, color: C.ink70, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📍</span> {direccionCliente}
                </div>

                <div style={{ fontSize: 12.5, color: C.ink70, display: "flex", alignItems: "center", gap: 12, background: "#F8FAFC", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={14} color={C.coral} /> {c.fecha_hora ? c.fecha_hora.slice(0, 10) : ""}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={14} color={C.coral} /> {c.fecha_hora ? c.fecha_hora.slice(11, 16) : ""}</span>
                </div>

                {/* Botones de acción inferiores */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
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

      {/* MODAL NUEVA CITA (AGENDAR) */}
      {modalAgendar && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460,
            padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>Agendar nueva cita</h3>
              <button onClick={() => setModalAgendar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink40 }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 6 }}>CLIENTE *</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 8 }}
                >
                  <option value="">— Seleccionar —</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nombres} {cli.apellidos} ({cli.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 6 }}>FECHA *</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 6 }}>HORA *</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 8 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 6 }}>NOTAS</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles de la cita..."
                  style={{ ...inputStyle(false), width: "100%", padding: "10px", borderRadius: 8, height: 80, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalAgendar(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: C.ink, color: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPROGRAMAR (NUEVA FECHA) */}
      {modalReprogramar && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
            padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>Nueva Fecha</h3>
              <button onClick={() => setModalReprogramar(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink40 }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleReprogramarSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 6 }}>SELECCIONAR NUEVA FECHA</label>
                <input
                  type="date"
                  value={nuevaFechaReprogramar}
                  onChange={(e) => setNuevaFechaReprogramar(e.target.value)}
                  style={{ ...inputStyle(false), width: "100%", padding: "12px", borderRadius: 10 }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
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