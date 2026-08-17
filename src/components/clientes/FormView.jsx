import { useRef, useState } from "react";
import { ChevronLeft, Camera, Save, Check, Navigation } from "lucide-react";
import { C, ESTADOS, TIPOS, inputStyle, todayISO } from "../../styles/tokens";
import { Field, TextInput, Select, SectionLabel, IconBtn } from "../ui/UIKit";
import { uploadFotoVisita } from "../../services/storageService";

export default function FormView({ initial, currentUser, onSave, onCancel }) {
  const blank = {
    id: "", nombres: "", apellidos: "", telefono: "", whatsapp: "", correo: "",
    direccion: "", barrio: "", ciudad: "", lat: "", lng: "", tipo_negocio: "",
    estado: "Pendiente", fecha_ultima_visita: "", fecha_seguimiento: "", observaciones: "",
    asesor_id: currentUser.id, asesor_nombre: currentUser.nombre, foto_url: null,
  };
  const [f, setF] = useState(initial || blank);
  const [errors, setErrors] = useState({});
  const [geoMsg, setGeoMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const isNew = !initial;

  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  const useGPS = () => {
    if (!navigator.geolocation) { setGeoMsg("Geolocalización no disponible en este dispositivo."); return; }
    setGeoMsg("Obteniendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", pos.coords.latitude.toFixed(6));
        set("lng", pos.coords.longitude.toFixed(6));
        setGeoMsg("Ubicación capturada ✓");
      },
      () => setGeoMsg("No se pudo obtener la ubicación. Ingrésala manualmente."),
      { timeout: 8000 }
    );
  };

  const onPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!f.id.trim()) {
      setErrors((prev) => ({ ...prev, foto: "Ingresa primero la cédula/NIT para poder subir la foto." }));
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFotoVisita(file, f.id.trim());
      set("foto_url", url);
      setErrors((prev) => ({ ...prev, foto: undefined }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, foto: "No se pudo subir la foto. Intenta de nuevo." }));
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
    if (f.estado === "Visitado" && !f.foto_url) e.foto = "Adjunta una foto para confirmar la visita.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const record = { ...f };
    if (record.lat === "") record.lat = null;
    if (record.lng === "") record.lng = null;
    if (record.fecha_seguimiento === "") record.fecha_seguimiento = null;
    if (record.estado !== "Pendiente" && !record.fecha_ultima_visita) {
      record.fecha_ultima_visita = todayISO();
    }
    if (record.fecha_ultima_visita === "") record.fecha_ultima_visita = null;
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
        <TextInput value={f.id} disabled={!isNew} onChange={(e) => set("id", e.target.value)} error={errors.id}
          placeholder="Ej. 1017234567" style={{ ...inputStyle(errors.id), opacity: isNew ? 1 : 0.6 }} />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Nombres" required error={errors.nombres}>
            <TextInput value={f.nombres} onChange={(e) => set("nombres", e.target.value)} error={errors.nombres} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Apellidos" required error={errors.apellidos}>
            <TextInput value={f.apellidos} onChange={(e) => set("apellidos", e.target.value)} error={errors.apellidos} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Teléfono" required error={errors.telefono}>
            <TextInput value={f.telefono} onChange={(e) => set("telefono", e.target.value)} error={errors.telefono} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="WhatsApp">
            <TextInput value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Correo electrónico">
        <TextInput type="email" value={f.correo} onChange={(e) => set("correo", e.target.value)} />
      </Field>

      <Field label="Dirección">
        <TextInput value={f.direccion} onChange={(e) => set("direccion", e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Barrio">
            <TextInput value={f.barrio} onChange={(e) => set("barrio", e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Ciudad">
            <TextInput value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Coordenadas GPS">
        <div style={{ display: "flex", gap: 8 }}>
          <TextInput value={f.lat} onChange={(e) => set("lat", e.target.value)} placeholder="Latitud" />
          <TextInput value={f.lng} onChange={(e) => set("lng", e.target.value)} placeholder="Longitud" />
          <button onClick={useGPS} style={{
            background: C.ink, color: "#fff", border: "none", borderRadius: 10, padding: "0 12px", cursor: "pointer",
          }}><Navigation size={15} /></button>
        </div>
        {geoMsg && <div style={{ fontSize: 12, color: C.ink70, marginTop: 5 }}>{geoMsg}</div>}
      </Field>

      <SectionLabel>Gestión de visitas</SectionLabel>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Tipo de negocio">
            <Select value={f.tipo_negocio} onChange={(e) => set("tipo_negocio", e.target.value)} options={TIPOS} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Estado">
            <Select value={f.estado} onChange={(e) => set("estado", e.target.value)} options={ESTADOS} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Última visita (auto)">
            <TextInput value={f.fecha_ultima_visita || ""} disabled placeholder="Se registra al guardar" style={{ ...inputStyle(false), opacity: 0.6 }} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Próximo seguimiento">
            <input type="date" value={f.fecha_seguimiento || ""} onChange={(e) => set("fecha_seguimiento", e.target.value)} style={inputStyle(false)} />
          </Field>
        </div>
      </div>
      {f.fecha_seguimiento && (
        <div style={{ fontSize: 12, color: C.ink70, marginTop: -8, marginBottom: 14 }}>
          Al guardar, se agendará automáticamente una cita "Programada" para esta fecha (9:00 a.m.).
          Podrás ajustar la hora exacta desde la pestaña <b>Citas</b>.
        </div>
      )}
      <Field label="Observaciones / notas de la visita">
        <textarea value={f.observaciones || ""} onChange={(e) => set("observaciones", e.target.value)} rows={4}
          style={{ ...inputStyle(false), resize: "vertical", fontFamily: "'Inter', sans-serif" }} />
      </Field>
      <Field label="Foto de la visita" error={errors.foto} required={f.estado === "Visitado"}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
        <div className="icon-row" style={{ gap: 12 }}>
          <button onClick={() => fileRef.current.click()} disabled={uploading} className="icon-row" style={{
            background: C.paper, border: `1.5px solid ${errors.foto ? C.coral : C.line}`,
            borderRadius: 10, padding: "9px 14px", cursor: uploading ? "wait" : "pointer",
            color: C.ink, fontSize: 13, fontWeight: 600,
          }}>
            <Camera size={15} />
            <span>{uploading ? "Subiendo…" : f.foto_url ? "Cambiar foto" : "Adjuntar foto"}</span>
          </button>
          {f.foto_url && !uploading && (
            <img src={f.foto_url} alt="visita" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover" }} />
          )}
          {f.foto_url && !uploading && <Check size={18} color={C.green} />}
        </div>
      </Field>

      <SectionLabel>Metadatos del sistema</SectionLabel>
      <div style={{
        background: C.paper, borderRadius: 12, padding: 12, fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12, color: C.ink70, lineHeight: 1.9,
      }}>
        Asesor: <b>{f.asesor_nombre}</b>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22, marginBottom: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: 13, borderRadius: 12, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 600, cursor: "pointer",
        }}>Cancelar</button>
        <button onClick={save} disabled={saving || uploading} className="icon-row" style={{
          flex: 2, padding: 13, borderRadius: 12, border: "none", background: C.coral, color: "#fff",
          fontWeight: 700, cursor: saving ? "wait" : "pointer", justifyContent: "center", opacity: saving ? 0.7 : 1,
        }}><Save size={16} /> <span>{saving ? "Guardando…" : "Guardar registro"}</span></button>
      </div>
    </div>
  );
}
