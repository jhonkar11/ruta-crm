import { useRef, useState } from "react";
import { ChevronLeft, Camera, Save, Check } from "lucide-react";
import { C, ESTADOS, TIPOS, inputStyle, todayISO } from "../../styles/tokens";
import { Field, TextInput, Select, SectionLabel, IconBtn } from "../ui/UIKit";
import { uploadFotoVisita } from "../../services/storageService";
import imageCompression from 'browser-image-compression';

export default function FormView({ initial, currentUser, onSave, onCancel }) {
  const CATEGORIAS = [
    "Nuevo", "Antiguo", "Renovación", "Cancelado", 
    "Remitido", "Prospecto directo zona", "Preoferta"
  ];

  const blank = {
    id: "", nombres: "", apellidos: "", telefono: "", whatsapp: "", correo: "",
    direccion: "", barrio: "", ciudad: "", categoria_cliente: "Nuevo", 
    tipo_negocio: "", otro_tipo_negocio: "", estado: "Pendiente", 
    fecha_ultima_visita: "", fecha_seguimiento: "", observaciones: "",
    asesor_id: currentUser.id, asesor_nombre: currentUser.nombre, foto_url: null,
  };
  
  const [f, setF] = useState(initial || blank);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const isNew = !initial;

  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  const onPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!f.id || !f.id.trim()) {
      setErrors((prev) => ({ ...prev, foto: "Ingresa primero la cédula/NIT para poder subir la foto." }));
      return;
    }
    try {
      setUploading(true);
      setErrors((prev) => ({ ...prev, foto: undefined }));
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      const url = await uploadFotoVisita(compressedFile, f.id.trim());
      set('foto_url', url);
    } catch (err) {
      setErrors((prev) => ({ ...prev, foto: "Error al subir la foto." }));
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!f.id.trim()) e.id = "La cédula o NIT es obligatoria.";
    if (!f.nombres.trim()) e.nombres = "Los nombres son obligatorios.";
    if (!f.apellidos.trim()) e.apellidos = "Los apellidos son obligatorios.";
    if (!f.telefono.trim()) e.telefono = "El teléfono es obligatorio.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const record = { ...f };
    if (record.estado !== "Pendiente" && !record.fecha_ultima_visita) record.fecha_ultima_visita = todayISO();
    setSaving(true);
    try {
      await onSave(record, isNew);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <IconBtn icon={ChevronLeft} label="Volver" tone="line" onClick={onCancel} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
          {isNew ? "Nuevo prospecto" : "Editar registro"}
        </div>
      </div>

      <SectionLabel>Información del prospecto</SectionLabel>
      <Field label="Cédula / NIT" required error={errors.id}>
        <TextInput value={f.id} disabled={!isNew} onChange={(e) => set("id", e.target.value)} placeholder="Ej. 1017234567" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Nombres"><TextInput value={f.nombres} onChange={(e) => set("nombres", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Apellidos"><TextInput value={f.apellidos} onChange={(e) => set("apellidos", e.target.value)} /></Field></div>
      </div>
      <Field label="Teléfono"><TextInput value={f.telefono} onChange={(e) => set("telefono", e.target.value)} /></Field>

      <SectionLabel>Segmentación Comercial</SectionLabel>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Categoría de Cliente">
            <Select value={f.categoria_cliente} onChange={(e) => set("categoria_cliente", e.target.value)} options={CATEGORIAS} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Tipo de negocio">
            <Select value={f.tipo_negocio} onChange={(e) => set("tipo_negocio", e.target.value)} options={TIPOS} />
          </Field>
        </div>
      </div>

      {f.tipo_negocio === "Otro" && (
        <Field label="Especifique tipo de negocio"><TextInput value={f.otro_tipo_negocio || ""} onChange={(e) => set("otro_tipo_negocio", e.target.value)} /></Field>
      )}

      <SectionLabel>Gestión de visitas</SectionLabel>
      <Field label="Estado"><Select value={f.estado} onChange={(e) => set("estado", e.target.value)} options={ESTADOS} /></Field>
      <Field label="Observaciones">
        <textarea value={f.observaciones || ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} style={{ ...inputStyle(false), resize: "vertical" }} />
      </Field>
      
      <Field label="Foto de la visita">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
        <button onClick={() => fileRef.current.click()} style={{ background: C.paper, padding: "10px", borderRadius: 8, cursor: "pointer" }}>
          {uploading ? "Subiendo..." : f.foto_url ? "Cambiar foto" : "Tomar foto"}
        </button>
      </Field>

      <div style={{ marginTop: 20 }}>
        <button onClick={save} disabled={saving || uploading} style={{ width: "100%", padding: 15, background: C.coral, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Guardando..." : "Guardar registro"}
        </button>
      </div>
    </div>
  );
}