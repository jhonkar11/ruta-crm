import { useState, useRef } from "react";
import { ViewHeader, TextInput, Stamp } from "../ui/UIKit";
import { C, inputStyle } from "../../styles/tokens";
import { Camera, Upload, CheckCircle2, X } from "lucide-react";

// Estilo con fondo blanco puro y texto negro oscuro de alta visibilidad
const inputLightStyle = {
  ...inputStyle,
  background: "#FFFFFF",
  border: "1.5px solid #CBD5E1",
  color: "#0F172A"
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
      foto_url: "" // Mapeado correctamente a la columna de Supabase
    }
  );

  const [modalFoto, setModalFoto] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Se guarda en foto_url para que coincida exactamente con Supabase
        handleChange("foto_url", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id || !form.nombres) {
      alert("Por favor completa al menos la cédula/NIT y los nombres.");
      return;
    }
    onSave(form, !initial);
  };

  const fotoActual = form.foto_url || form.foto;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: 0 }}>
          {initial ? "Editar Cliente / Registro" : "Nuevo Cliente / Registro"}
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.85)", marginTop: 2 }}>
          {initial ? "Modificando información del registro" : "Creando nuevo prospecto en ruta"}
        </p>
      </div>

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
              style={inputLightStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <TextInput
              value={form.telefono || ""}
              onChange={(e) => handleChange("telefono", e.target.value)}
              placeholder="Teléfono de contacto"
              style={inputLightStyle}
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
              style={inputLightStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Apellidos</label>
            <TextInput
              value={form.apellidos || ""}
              onChange={(e) => handleChange("apellidos", e.target.value)}
              placeholder="Apellidos"
              style={inputLightStyle}
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
              style={inputLightStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Correo Electrónico</label>
            <TextInput
              type="email"
              value={form.correo || ""}
              onChange={(e) => handleChange("correo", e.target.value)}
              placeholder="correo@ejemplo.com"
              style={inputLightStyle}
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
            style={inputLightStyle}
          />
        </div>

        {/* Resultado/Categoría y Tipo de Negocio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Resultado / Categoría</label>
            <select
              value={form.categoria_cliente || "Interesado"}
              onChange={(e) => handleChange("categoria_cliente", e.target.value)}
              style={{ ...inputLightStyle, width: "100%", cursor: "pointer", height: "46px", borderRadius: "12px", padding: "0 12px" }}
            >
              {["Nuevo", "Interesado", "Preoferta", "En trámite", "No localizado", "Cancelado"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#FFFFFF", color: "#0F172A" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tipo de Negocio</label>
            <select
              value={form.tipo_negocio || "Comercio"}
              onChange={(e) => handleChange("tipo_negocio", e.target.value)}
              style={{ ...inputLightStyle, width: "100%", cursor: "pointer", height: "46px", borderRadius: "12px", padding: "0 12px" }}
            >
              {["Comercio", "Servicios", "Independiente", "Empresa", "Otro"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#FFFFFF", color: "#0F172A" }}>{opt}</option>
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
              style={{ ...inputLightStyle, width: "100%", cursor: "pointer", height: "46px", borderRadius: "12px", padding: "0 12px" }}
            >
              {["Pendiente", "Programada", "Visitado", "Cumplida", "Cancelado", "Reprogramada"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#FFFFFF", color: "#0F172A" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Próximo Seguimiento</label>
            <TextInput
              type="date"
              value={form.fecha_seguimiento || ""}
              onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
              style={{ ...inputLightStyle, width: "100%", cursor: "pointer" }}
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
            style={{ ...inputLightStyle, width: "100%", padding: "12px", borderRadius: "12px", resize: "vertical" }}
          />
        </div>

        {/* FOTO DE LA VISITA */}
        <div>
          <label style={labelStyle}>Foto de la Visita</label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Camera size={18} /> Tomar foto / Elegir de galería
            </button>
            {fotoActual && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399", fontSize: "13px", fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Foto cargada correctamente
              </div>
            )}
          </div>
          {fotoActual && (
            <div style={{ marginTop: 10 }}>
              <img
                src={fotoActual}
                alt="Vista previa"
                onClick={() => setModalFoto(true)}
                title="Haz clic para ampliar"
                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(255,255,255,0.3)", cursor: "pointer" }}
              />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Toca la imagen para ampliarla</div>
            </div>
          )}
        </div>

        {/* Modal para ampliar la foto */}
        {modalFoto && fotoActual && (
          <div
            onClick={() => setModalFoto(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20
            }}
          >
            <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setModalFoto(false)}
                style={{
                  position: "absolute", top: -12, right: -12, background: "#ef4444", color: "#fff",
                  border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 101, boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
                }}
              >
                <X size={18} />
              </button>
              <img
                src={fotoActual}
                alt="Foto ampliada"
                style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, border: "2px solid rgba(255,255,255,0.2)" }}
              />
            </div>
          </div>
        )}

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
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37,99,235,0.4)"
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