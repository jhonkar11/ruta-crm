import { useState } from "react";
import { C, inputStyle } from "../../styles/tokens";
import { Field, Select, TextInput, ConfirmModal } from "../ui/UIKit";

// Modal compartido para: (a) agendar una cita nueva desde cero, eligiendo
// cliente, y (b) posponer/reprogramar una cita existente (cliente fijo).
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
    // En modo "crear", el valor del <select> viene como "id — Nombre Apellido"
    const idReal = mode === "posponer" ? clienteId : clienteId.split(" — ")[0];
    onConfirm({ clienteId: idReal, fechaHora, notas });
  };

  return (
    <ConfirmModal
      title={mode === "posponer" ? "Posponer / reprogramar cita" : "Agendar nueva cita"}
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

      <div style={{ display: "flex", gap: 10 }}>
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
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
          style={{ ...inputStyle(false), resize: "vertical", fontFamily: "'Inter', sans-serif" }} />
      </Field>

      {error && <div style={{ color: C.coral, fontSize: 12.5 }}>{error}</div>}
    </ConfirmModal>
  );
}
