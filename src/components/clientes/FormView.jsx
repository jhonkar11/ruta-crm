import { useState } from "react";
import { C, inputStyle } from "../../styles/tokens";
import { TextInput } from "../ui/UIKit";
import { Camera, X, User, MapPin, Briefcase, FileText, Image as ImageIcon } from "lucide-react";

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

  // Estilo común para las tarjetas de sección dentro del formulario
  const cardSectionStyle = {
    background: "rgba(30, 41, 59, 0.45)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)"
  };

  const labelStyle = {
    fontFamily: "'IBM Plex Mono', monospace", 
    fontSize: 11, 
    fontWeight: 700, 
    color: "#94a3b8", // Texto claro mejorado para contraste
    textTransform: "uppercase", 
    display: "block", 
    marginBottom: 6,
    letterSpacing: "0.5px"
  };

  const inputDarkStyle = {
    ...inputStyle(false),
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 14px"
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      background: "rgba(15, 23, 42, 0.75)", 
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: 20, 
      padding: 24, 
      position: "relative",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
      color: "#f8fafc"
    }}>
      <h2 style={{ 
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22, 
        fontWeight: 700, 
        color: "#ffffff", 
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        {initial ? "Editar Prospecto / Cliente" : "Nuevo Prospecto"}
      </h2>

      {/* SECCIÓN 1: Identificación y Datos Básicos */}
      <div style={cardSectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#38bdf8", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "1px" }}>
          <User size={16} /> Identificación Personal
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Cédula / NIT *</label>
          <TextInput
            value={form.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="Número de cédula o NIT"
            disabled={!!initial}
            style={inputDarkStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombres *</label>
            <TextInput
              value={form.nombres}
              onChange={(e) => handleChange("nombres", e.target.value)}
              placeholder="Nombres"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Apellidos</label>
            <TextInput
              value={form.apellidos}
              onChange={(e) => handleChange("apellidos", e.target.value)}
              placeholder="Apellidos"
              style={inputDarkStyle}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Contacto */}
      <div style={cardSectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#38bdf8", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "1px" }}>
          <FileText size={16} /> Canales de Contacto
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Teléfono *</label>
            <TextInput
              value={form.telefono}
              onChange={(e) => handleChange("telefono", e.target.value)}
              placeholder="Teléfono de contacto"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <TextInput
              value={form.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="Número de WhatsApp"
              style={inputDarkStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Correo Electrónico</label>
          <TextInput
            type="email"
            value={form.correo}
            onChange={(e) => handleChange("correo", e.target.value)}
            placeholder="correo@ejemplo.com"
            style={inputDarkStyle}
          />
        </div>
      </div>

      {/* SECCIÓN 3: Ubicación */}
      <div style={cardSectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#38bdf8", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "1px" }}>
          <MapPin size={16} /> Ubicación
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Dirección</label>
          <TextInput
            value={form.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
            placeholder="Dirección del local o casa"
            style={inputDarkStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Barrio</label>
            <TextInput
              value={form.barrio || ""}
              onChange={(e) => handleChange("barrio", e.target.value)}
              placeholder="Barrio o sector"
              style={inputDarkStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ciudad</label>
            <TextInput
              value={form.ciudad}
              onChange={(e) => handleChange("ciudad", e.target.value)}
              placeholder="Ciudad"
              style={inputDarkStyle}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: Negocio y Gestión */}
      <div style={cardSectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#38bdf8", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "1px" }}>
          <Briefcase size={16} /> Clasificación y Seguimiento
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Resultado / Categoría</label>
            <select
              value={form.categoria_cliente}
              onChange={(e) => handleChange("categoria_cliente", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer" }}
            >
              {["Nuevo", "Interesado", "Preoferta", "No localizado", "En trámite / Pendiente"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tipo de Negocio</label>
            <select
              value={form.tipo_negocio}
              onChange={(e) => handleChange("tipo_negocio", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer" }}
            >
              {["Comercio", "Industria", "Servicios", "Agropecuario", "Independiente"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer" }}
            >
              {["Pendiente", "Programado", "Visitado", "Cancelado"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Próximo Seguimiento</label>
            <TextInput
              type="date"
              value={form.fecha_seguimiento}
              onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
              style={inputDarkStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Observaciones / Notas de la visita</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            placeholder="Escribe notas relevantes de la visita..."
            style={{ ...inputDarkStyle, width: "100%", height: 90, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* SECCIÓN 5: Multimedia */}
      <div style={cardSectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#38bdf8", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "1px" }}>
          <ImageIcon size={16} /> Evidencia Fotográfica
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <label style={{
            background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px 16px",
            borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#ffffff",
            transition: "background 0.2s ease"
          }}>
            <Camera size={18} color={C.coral} />
            <span>{form.foto_url ? "Cambiar foto" : "Subir foto"}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>

          {form.foto_url && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={form.foto_url}
                alt="Vista previa"
                onClick={() => setShowModal(true)}
                style={{ width: 75, height: 75, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", cursor: "zoom-in" }}
                title="Haz clic para ampliar"
              />
              <button
                type="button"
                onClick={() => handleChange("foto_url", "")}
                style={{
                  position: "absolute", top: -8, right: -8, background: "#EF4444", color: "#fff",
                  border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.4)"
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
            background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 99999, cursor: "zoom-out"
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={form.foto_url}
              alt="Foto ampliada"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 16, objectFit: "contain", border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" }}
            />
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute", top: -12, right: -12, background: "#EF4444", color: "#fff",
                border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
              }}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div style={{ display: "flex", gap: 14, marginTop: 28, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", padding: "14px",
            borderRadius: 12, fontWeight: 600, cursor: "pointer", color: "#e2e8f0", fontSize: 14,
            transition: "all 0.2s ease"
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1, background: C.coral, border: "none", padding: "14px",
            borderRadius: 12, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1, fontSize: 14,
            boxShadow: "0 4px 15px rgba(225, 78, 42, 0.4)",
            transition: "all 0.2s ease"
          }}
        >
          {saving ? "Guardando..." : "Guardar registro"}
        </button>
      </div>
    </form>
  );
}