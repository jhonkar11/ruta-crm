import { useState } from "react";
import { ViewHeader, TextInput, Stamp } from "../ui/UIKit";
import { C, inputStyle } from "../../styles/tokens";

const inputDarkStyle = {
  ...inputStyle,
  background: "#0f172a",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  color: "#ffffff"
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "rgba(255, 255, 255, 0.7)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

export function FormView({ initial, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      id: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      direccion: "",
      barrio: "",
      lat: "",
      lng: "",
      estado: "Pendiente",
      fecha_seguimiento: "",
      observaciones: "",
      categoria_cliente: "Interesado"
    }
  );

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id || !form.nombres) {
      alert("Por favor completa al menos la cédula/NIT y los nombres.");
      return;
    }
    onSave(form, !initial);
  };

  return (
    <div>
      <ViewHeader 
        title={initial ? "Editar Cliente / Registro" : "Nuevo Cliente / Registro"} 
        action={<Stamp text={initial ? "Modificando" : "Creando"} />}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Cédula / NIT *</label>
            <TextInput
              disabled={!!initial}
              value={form.id}
              onChange={(e) => handleChange("id", e.target.value)}
              placeholder="Ej. 1061700000"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <TextInput
              value={form.telefono || ""}
              onChange={(e) => handleChange("telefono", e.target.value)}
              placeholder="Ej. 3101234567"
              style={inputDarkStyle}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombres *</label>
            <TextInput
              value={form.nombres || ""}
              onChange={(e) => handleChange("nombres", e.target.value)}
              placeholder="Nombres del cliente"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Apellidos</label>
            <TextInput
              value={form.apellidos || ""}
              onChange={(e) => handleChange("apellidos", e.target.value)}
              placeholder="Apellidos del cliente"
              style={inputDarkStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Dirección</label>
          <TextInput
            value={form.direccion || ""}
            onChange={(e) => handleChange("direccion", e.target.value)}
            placeholder="Dirección o ubicación"
            style={inputDarkStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer", height: "42px", borderRadius: "8px", padding: "0 12px" }}
            >
              {["Pendiente", "Programado", "Visitado", "Cancelado"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Próximo Seguimiento</label>
            <div style={{ position: "relative" }}>
              <TextInput
                type="date"
                value={form.fecha_seguimiento || ""}
                onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
                style={{
                  ...inputDarkStyle,
                  width: "100%",
                  colorScheme: "dark",
                  cursor: "pointer"
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Observaciones</label>
          <textarea
            value={form.observaciones || ""}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            placeholder="Notas adicionales..."
            rows={3}
            style={{ ...inputDarkStyle, width: "100%", padding: "10px", borderRadius: "8px", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button
            type="submit"
            style={{
              flex: 1,
              background: C.primary || "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Guardar Registro
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// Exportación por defecto secundaria para evitar errores en compiladores estrictos de Vite/Rollup
export default FormView;