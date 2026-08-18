import { useState } from "react";
import { C, inputStyle } from "../../styles/tokens";
import { Field, Select } from "../ui/UIKit";

export default function CitaFormModal({ mode, clientes, citaBase, onConfirm, onCancel }) {
  const [clienteId, setClienteId] = useState(citaBase?.cliente_id || "");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [notas, setNotas] = useState(citaBase?.notas || "");
  const [error, setError] = useState("");

  const confirmar = () => {
    if (!clienteId) { setError("Selecciona un cliente."); return; }
    if (!fecha) { setError("Selecciona una fecha."); return; }
    const fechaHora = `${fecha}T${hora}:00`;
    const idReal = mode === "posponer" ? clienteId : clienteId.split(" — ")[0];
    onConfirm({ clienteId: idReal, fechaHora, notas });
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      overflowY: "auto"
    }}>
      <div style={{
        background: "#FFFFFF",
        width: "100%",
        maxWidth: 440,
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        border: "1px solid #E2E8F0",
        animation: "fadeIn 0.2s ease-out"
      }}>
        {/* Título */}
        <div style={{ 
          fontFamily: "'Space Grotesk', sans-serif", 
          fontWeight: 700, 
          fontSize: 18, 
          color: "#0F172A", 
          marginBottom: 16 
        }}>
          {mode === "posponer" ? "Reprogramar cita" : "Agendar nueva cita"}
        </div>

        {/* Selector de Cliente */}
        {mode !== "posponer" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Cliente *
            </label>
            <Select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              options={clientes.map((c) => `${c.id} — ${c.nombres} ${c.apellidos}`)}
            />
          </div>
        )}

        {/* Fecha y Hora */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Fecha *
            </label>
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)} 
              style={{ ...inputStyle(false), width: "100%", background: "#fff" }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Hora *
            </label>
            <input 
              type="time" 
              value={hora} 
              onChange={(e) => setHora(e.target.value)} 
              style={{ ...inputStyle(false), width: "100%", background: "#fff" }} 
            />
          </div>
        </div>

        {/* Notas */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Notas
          </label>
          <textarea 
            value={notas} 
            onChange={(e) => setNotas(e.target.value)} 
            rows={3}
            placeholder="Escribe detalles adicionales..."
            style={{ 
              ...inputStyle(false), 
              width: "100%", 
              resize: "vertical", 
              fontFamily: "inherit",
              background: "#fff"
            }} 
          />
        </div>

        {error && (
          <div style={{ color: "#EF4444", fontSize: 12.5, marginBottom: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: "flex", gap: 10, borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
          <button 
            type="button" 
            onClick={onCancel} 
            style={{
              flex: 1, 
              padding: "12px", 
              borderRadius: 10, 
              border: "1.5px solid #CBD5E1",
              background: "#fff", 
              color: "#475569", 
              fontWeight: 600, 
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={confirmar} 
            style={{
              flex: 1, 
              padding: "12px", 
              borderRadius: 10, 
              border: "none",
              background: C.coral, 
              color: "#fff", 
              fontWeight: 600, 
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(225, 112, 85, 0.3)"
            }}
          >
            {mode === "posponer" ? "Reprogramar" : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}