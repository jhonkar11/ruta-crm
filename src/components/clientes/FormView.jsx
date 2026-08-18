import { useState } from "react";
import { C, inputStyle } from "../../styles/tokens";
import { TextInput, TextArea } from "../ui/UIKit";
import { Camera, X } from "lucide-react";

export default function FormView({ initial, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      id: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      whatsapp: "",
      correo: "",
      direccion: "",
      barrio: "",
      ciudad: "Popayán",
      categoria_cliente: "Nuevo",
      tipo_negocio: "Comercio",
      estado: "Pendiente",
      fecha_seguimiento: "",
      observaciones: "",
      foto: ""
    }
  );

  const [saving, setSaving] = useState(false);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("foto", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.nombres || !form.telefono) {
      alert("Por favor completa los campos obligatorios: Cédula/NIT, Nombres y Teléfono.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form, !initial);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: C.paper, borderRadius: 16, padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 16 }}>
        {initial ? "Editar Prospecto / Cliente" : "Nuevo Prospecto"}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Cédula / NIT *</label>
          <TextInput
            value={form.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="Número de cédula o NIT"
            disabled={!!initial}
            style={inputStyle(false)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Nombres *</label>
          <TextInput
            value={form.nombres}
            onChange={(e) => handleChange("nombres", e.target.value)}
            placeholder="Nombres"
            style={inputStyle(false)}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Apellidos</label>
          <TextInput
            value={form.apellidos}
            onChange={(e) => handleChange("apellidos", e.target.value)}
            placeholder="Apellidos"
            style={inputStyle(false)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Teléfono *</label>
          <TextInput
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            placeholder="Teléfono de contacto"
            style={inputStyle(false)}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>WhatsApp</label>
          <TextInput
            value={form.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            placeholder="Número de WhatsApp"
            style={inputStyle(false)}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Dirección</label>
        <TextInput
          value={form.direccion}
          onChange={(e) => handleChange("direccion", e.target.value)}
          placeholder="Dirección del local o casa"
          style={inputStyle(false)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 4 }}>Resultado de Visita / Categoría</label>
          <select
            value={form.categoria_cliente}
            onChange={(e) => handleChange("categoria_cliente", e.target.value)}
            style={{ ...inputStyle(false), width: "100%", background: "#fff" }}
          >
            {["Nuevo", "Interesado", "Preoferta", "No localizado", "En trámite / Pendiente"].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 4 }}>Tipo de Negocio</label>
          <select
            value={form.tipo_negocio}
            onChange={(e) => handleChange("tipo_negocio", e.target.value)}
            style={{ ...inputStyle(false), width: "100%", background: "#fff" }}
          >
            {["Comercio", "Industria", "Servicios", "Agropecuario", "Independiente"].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 4 }}>Estado</label>
          <select
            value={form.estado}
            onChange={(e) => handleChange("estado", e.target.value)}
            style={{ ...inputStyle(false), width: "100%", background: "#fff" }}
          >
            {["Pendiente", "Programado", "Visitado", "Cancelado"].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Próximo Seguimiento</label>
          <TextInput
            type="date"
            value={form.fecha_seguimiento}
            onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
            style={inputStyle(false)}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>Observaciones / Notas de la visita</label>
        <TextArea
          value={form.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          placeholder="Escribe notas relevantes de la visita..."
          style={{ ...inputStyle(false), height: 80 }}
        />
      </div>

      <div style={{ marginBottom: 20, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ink70, display: "block", marginBottom: 8 }}>
          Foto de la Visita
        </label>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <label style={{
            background: "#f1f5f9", border: `1px solid ${C.line}`, padding: "8px 14px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.ink
          }}>
            <Camera size={16} color={C.coral} />
            <span>{form.foto ? "Cambiar foto" : "Subir foto"}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>

          {form.foto && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={form.foto}
                alt="Vista previa"
                style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.line}` }}
              />
              <button
                type="button"
                onClick={() => handleChange("foto", "")}
                style={{
                  position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff",
                  border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Eliminar foto"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, background: "#fff", border: `1.5px solid ${C.line}`, padding: "10px",
            borderRadius: 10, fontWeight: 600, cursor: "pointer", color: C.ink70
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1, background: C.coral, border: "none", padding: "10px",
            borderRadius: 10, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? "Guardando..." : "Guardar registro"}
        </button>
      </div>
    </form>
  );
}