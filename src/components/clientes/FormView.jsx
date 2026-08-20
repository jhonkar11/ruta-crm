import { useState } from "react";
import { ViewHeader, TextInput, Stamp } from "../ui/UIKit";
import { C, inputStyle } from "../../styles/tokens";
import { Camera, Upload } from "lucide-react";

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
  color: "#fdba74",
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
      whatsapp: "",
      correo: "",
      direccion: "",
      categoria_cliente: "Interesado",
      tipo_negocio: "Comercio",
      estado: "Pendiente",
      fecha_seguimiento: "",
      observaciones: "",
      foto: ""
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {/* Cédula y Teléfono */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Cédula / NIT *</label>
            <TextInput
              disabled={!!initial}
              value={form.id}
              onChange={(e) => handleChange("id", e.target.value)}
              placeholder="Número de cédula o NIT"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <TextInput
              value={form.telefono || ""}
              onChange={(e) => handleChange("telefono", e.target.value)}
              placeholder="Teléfono de contacto"
              style={inputDarkStyle}
            />
          </div>
        </div>

        {/* Nombres y Apellidos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombres *</label>
            <TextInput
              value={form.nombres || ""}
              onChange={(e) => handleChange("nombres", e.target.value)}
              placeholder="Nombres"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Apellidos</label>
            <TextInput
              value={form.apellidos || ""}
              onChange={(e) => handleChange("apellidos", e.target.value)}
              placeholder="Apellidos"
              style={inputDarkStyle}
            />
          </div>
        </div>

        {/* WhatsApp y Correo Electrónico */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <TextInput
              value={form.whatsapp || ""}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="Número de WhatsApp"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Correo Electrónico</label>
            <TextInput
              type="email"
              value={form.correo || ""}
              onChange={(e) => handleChange("correo", e.target.value)}
              placeholder="correo@ejemplo.com"
              style={inputDarkStyle}
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label style={labelStyle}>Dirección</label>
          <TextInput
            value={form.direccion || ""}
            onChange={(e) => handleChange("direccion", e.target.value)}
            placeholder="Dirección del local o casa"
            style={inputDarkStyle}
          />
        </div>

        {/* Resultado/Categoría y Tipo de Negocio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Resultado / Categoría</label>
            <select
              value={form.categoria_cliente || "Interesado"}
              onChange={(e) => handleChange("categoria_cliente", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer", height: "42px", borderRadius: "8px", padding: "0 12px" }}
            >
              {["Nuevo", "Interesado", "Preoferta", "En trámite", "No localizado", "Cancelado"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tipo de Negocio</label>
            <select
              value={form.tipo_negocio || "Comercio"}
              onChange={(e) => handleChange("tipo_negocio", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer", height: "42px", borderRadius: "8px", padding: "0 12px" }}
            >
              {["Comercio", "Servicios", "Independiente", "Empresa", "Otro"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado y Próximo Seguimiento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Estado</label>
            <select
              value={form.estado || "Pendiente"}
              onChange={(e) => handleChange("estado", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer", height: "42px", borderRadius: "8px", padding: "0 12px" }}
            >
              {["Pendiente", "Programada", "Visitado", "Cumplida", "Cancelado", "Reprogramada"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Próximo Seguimiento</label>
            <TextInput
              type="date"
              value={form.fecha_seguimiento || ""}
              onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", colorScheme: "dark", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label style={labelStyle}>Observaciones / Notas de la visita</label>
          <textarea
            value={form.observaciones || ""}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            placeholder="Escribe notas relevantes de la visita..."
            rows={3}
            style={{ ...inputDarkStyle, width: "100%", padding: "10px", borderRadius: "8px", resize: "vertical" }}
          />
        </div>

        {/* Foto de la Visita */}
        <div>
          <label style={labelStyle}>Foto de la Visita</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => alert("Función de cámara / subida de foto activada")}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Camera size={16} /> Subir foto
            </button>
            {form.foto && <span style={{ fontSize: "12px", color: "#10b981" }}>Foto cargada ✓</span>}
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              background: C.coral || "#f97316",
              color: "#fff",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Guardar registro
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormView;