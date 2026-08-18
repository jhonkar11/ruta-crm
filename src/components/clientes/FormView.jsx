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
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Teléfono"><TextInput value={f.telefono} onChange={(e) => set("telefono", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="WhatsApp"><TextInput value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field></div>
      </div>
      <Field label="Correo electrónico"><TextInput type="email" value={f.correo} onChange={(e) => set("correo", e.target.value)} /></Field>

      <Field label="Dirección"><TextInput value={f.direccion} onChange={(e) => set("direccion", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Barrio"><TextInput value={f.barrio} onChange={(e) => set("barrio", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Ciudad"><TextInput value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} /></Field></div>
      </div>

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
        <Field label="Especifique el tipo de negocio" required>
          <TextInput value={f.otro_tipo_negocio || ""} onChange={(e) => set("otro_tipo_negocio", e.target.value)} placeholder="Ej. Pizzería Don Juan" />
        </Field>
      )}

      <SectionLabel>Gestión de visitas</SectionLabel>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Estado">
            <Select value={f.estado} onChange={(e) => set("estado", e.target.value)} options={ESTADOS} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Próximo seguimiento">
            <input type="date" value={f.fecha_seguimiento || ""} onChange={(e) => set("fecha_seguimiento", e.target.value)} style={inputStyle(false)} />
          </Field>
        </div>
      </div>

      <Field label="Observaciones / notas de la visita">
        <textarea value={f.observaciones || ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} style={{ ...inputStyle(false), resize: "vertical" }} />
      </Field>

      <Field label="Foto de la visita">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
        <button onClick={() => fileRef.current.click()} style={{ background: C.paper, padding: "10px 14px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${C.line}` }}>
          {uploading ? "Subiendo..." : f.foto_url ? "Cambiar foto" : "Adjuntar foto"}
        </button>
      </Field>

      <SectionLabel>Metadatos del sistema</SectionLabel>
      <div style={{ background: C.paper, borderRadius: 12, padding: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.ink70 }}>
        Asesor: <b>{f.asesor_nombre}</b>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, marginBottom: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1.5px solid ${C.line}`, background: "#fff", cursor: "pointer" }}>Cancelar</button>
        <button onClick={save} disabled={saving || uploading} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: C.coral, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Guardando..." : "Guardar registro"}
        </button>
      </div>
    </div>
  );
}