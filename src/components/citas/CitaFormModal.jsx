import { useState } from "react";
import { C, inputStyle } from "../../styles/tokens";
import { Field, Select, ConfirmModal } from "../ui/UIKit";

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
      display: "flex",
      alignItems: "center", // Centrado vertical
      justifyContent: "center", // Centrado horizontal
      zIndex: 100,
      background: "rgba(15, 23, 42, 0.4)", // Fondo oscuro semitransparente
      backdropFilter: "blur(4px)", // Efecto cristal profesional
      padding: 20
    }}>
      <ConfirmModal
        title={mode === "posponer" ? "Reprogramar cita" : "Agendar nueva cita"}
        confirmLabel={mode === "posponer" ? "Reprogramar" : "Agendar"}
        onConfirm={confirmar}
        onCancel={onCancel}
      >
        {mode !== "posponer" && (
          <Field label="Cliente" required>
            <Select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              options={clientes.map((c) => `${c.id} — ${c.nombres} ${c.apellidos}`)}
            />
          </Field>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Fecha" required>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle(false)} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Hora" required>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inputStyle(false)} />
            </Field>
          </div>
        </div>

        <Field label="Notas">
          <textarea 
            value={notas} 
            onChange={(e) => setNotas(e.target.value)} 
            rows={3}
            style={{ 
              ...inputStyle(false), 
              resize: "none", 
              fontFamily: "'IBM Plex Mono', monospace", 
              padding: "10px" 
            }} 
          />
        </Field>

        {error && <div style={{ color: C.coral, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      </ConfirmModal>
    </div>
  );
}