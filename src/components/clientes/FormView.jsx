import { useState } from "react";
import { C, inputStyle } from "../../styles/tokens";
import { TextInput } from "../ui/UIKit";
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
      foto_url: ""
    }
  );

  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("foto_url", reader.result);
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
    <form onSubmit={handleSubmit} style={{ 
      background: "#FFFFFF", 
      borderRadius: 16, 
      padding: 24, 
      position: "relative",
      border: "1px solid #E2E8F0",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
    }}>
      <h2 style={{ 
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 20, 
        fontWeight: 700, 
        color: "#0F172A", 
        marginBottom: 20 
      }}>
        {initial ? "Editar Prospecto / Cliente" : "Nuevo Prospecto"}
      </h2>

      {/* Sección Cédula / NIT */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Cédula / NIT *
        </label>
        <TextInput
          value={form.id}
          onChange={(e) => handleChange("id", e.target.value)}
          placeholder="Número de cédula o NIT"
          disabled={!!initial}
          style={inputStyle(false)}
        />
      </div>

      {/* Nombres y Apellidos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Nombres *
          </label>
          <TextInput
            value={form.nombres}
            onChange={(e) => handleChange("nombres", e.target.value)}
            placeholder="Nombres"
            style={inputStyle(false)}
          />
        </div>
        <div>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Apellidos
          </label>
          <TextInput
            value={form.apellidos}
            onChange={(e) => handleChange("apellidos", e.target.value)}
            placeholder="Apellidos"
            style={inputStyle(false)}
          />
        </div>
      </div>

      {/* Teléfono y WhatsApp */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Teléfono *
          </label>
          <TextInput
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            placeholder="Teléfono de contacto"
            style={inputStyle(false)}
          />
        </div>
        <div>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            WhatsApp
          </label>
          <TextInput
            value={form.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            placeholder="Número de WhatsApp"
            style={inputStyle(false)}
          />
        </div>
      </div>

      {/* Correo Electrónico (Recuperado) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Correo Electrónico
        </label>
        <TextInput
          type="email"
          value={form.correo}
          onChange={(e) => handleChange("correo", e.target.value)}
          placeholder="correo@ejemplo.com"
          style={inputStyle(false)}
        />
      </div>

      {/* Dirección */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Dirección
        </label>
        <TextInput
          value={form.direccion}
          onChange={(e) => handleChange("direccion", e.target.value)}
          placeholder="Dirección del local o casa"
          style={inputStyle(false)}
        />
      </div>

      {/* Segmentación Comercial */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Resultado / Categoría
          </label>
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
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Tipo de Negocio
          </label>
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

      {/* Gestión de Visitas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Estado
          </label>
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
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Próximo Seguimiento
          </label>
          <TextInput
            type="date"
            value={form.fecha_seguimiento}
            onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
            style={inputStyle(false)}
          />
        </div>
      </div>

      {/* Observaciones */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Observaciones / Notas de la visita
        </label>
        <textarea
          value={form.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          placeholder="Escribe notas relevantes de la visita..."
          style={{ ...inputStyle(false), width: "100%", height: 85, background: "#fff", resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Foto de la Visita */}
      <div style={{ marginBottom: 24, borderTop: `1px solid #E2E8F0`, paddingTop: 16 }}>
        <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Foto de la Visita
        </label>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <label style={{
            background: "#F1F5F9", border: `1px solid #CBD5E1`, padding: "8px 14px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#0F172A"
          }}>
            <Camera size={16} color={C.coral} />
            <span>{form.foto_url ? "Cambiar foto" : "Subir foto"}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>

          {form.foto_url && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={form.foto_url}
                alt="Vista previa"
                onClick={() => setShowModal(true)}
                style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid #CBD5E1`, cursor: "zoom-in" }}
                title="Haz clic para ampliar"
              />
              <button
                type="button"
                onClick={() => handleChange("foto_url", "")}
                style={{
                  position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff",
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

      {/* Modal Zoom Foto */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, cursor: "zoom-out"
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={form.foto_url}
              alt="Foto ampliada"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, objectFit: "contain", border: "2px solid #fff", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)" }}
            />
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute", top: -12, right: -12, background: "#EF4444", color: "#fff",
                border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
              }}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div style={{ display: "flex", gap: 12, marginTop: 24, borderTop: `1px solid #E2E8F0`, paddingTop: 20 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, background: "#fff", border: `1.5px solid #CBD5E1`, padding: "12px",
            borderRadius: 10, fontWeight: 600, cursor: "pointer", color: "#475569"
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1, background: C.coral, border: "none", padding: "12px",
            borderRadius: 10, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1,
            boxShadow: "0 4px 6px -1px rgba(225, 112, 85, 0.3)"
          }}
        >
          {saving ? "Guardando..." : "Guardar registro"}
        </button>
      </div>
    </form>
  );
}