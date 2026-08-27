import { useEffect, useState } from "react";
import { X, History, Phone, MessageCircle, StickyNote, Tag, FileCheck2, UserPlus, Archive, Send } from "lucide-react";
import { C, glass } from "../../styles/tokens";
import { fetchActividad, registrarActividad } from "../../services/actividadService";

const ICONOS_TIPO = {
  llamada: { Icon: Phone, color: "#3B82F6" },
  whatsapp: { Icon: MessageCircle, color: "#25D366" },
  nota: { Icon: StickyNote, color: "#F59E0B" },
  estado: { Icon: Tag, color: "#A855F7" },
  documento: { Icon: FileCheck2, color: "#0D9488" },
  credito: { Icon: FileCheck2, color: "#0D9488" },
  creacion: { Icon: UserPlus, color: "#22C55E" },
  archivado: { Icon: Archive, color: "#94A3B8" },
};

function formatoFecha(iso) {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistorialClienteModal({ cliente, asesorNombre, asesorId, onClose }) {
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState(null);
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    let activo = true;
    fetchActividad(cliente.id)
      .then((data) => { if (activo) setEventos(data); })
      .catch((e) => { if (activo) setError(e.message); });
    return () => { activo = false; };
  }, [cliente?.id]);

  if (!cliente) return null;
  const nombreCliente = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();

  const agregarNota = async () => {
    const texto = nota.trim();
    if (!texto) return;
    setEnviando(true);
    try {
      const creado = await registrarActividad({
        clienteId: cliente.id, asesorId, asesorNombre, tipo: "nota", descripcion: texto,
      });
      setEventos((prev) => [creado, ...(prev || [])]);
      setNota("");
    } catch (e) {
      alert("No se pudo guardar la nota: " + e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      ...glass.overlay,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        ...glass.panel,
        borderRadius: 24, padding: 24, width: "100%", maxWidth: 460,
        maxHeight: "88vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} color={C.coral} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
                Historial de actividad
              </span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
              {nombreCliente} · CC/NIT {cliente.id}
            </div>
          </div>
          <button onClick={onClose} style={{
            ...glass.pill,
            borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Nota rápida */}
        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarNota()}
            placeholder="Agregar nota rápida de la visita o llamada..."
            style={{
              ...glass.input,
              flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13,
              outline: "none",
            }}
          />
          <button
            onClick={agregarNota}
            disabled={enviando || !nota.trim()}
            style={{
              background: C.coral, color: "#fff", border: "none", borderRadius: 10,
              width: 40, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: enviando || !nota.trim() ? "not-allowed" : "pointer",
              opacity: enviando || !nota.trim() ? 0.5 : 1,
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          {error && (
            <div style={{ color: "#FCA5A5", fontSize: 12.5 }}>
              No se pudo cargar el historial: {error}. Si es la primera vez, recuerda correr
              <code style={{ margin: "0 4px" }}>supabase/migracion_historial_alertas.sql</code>
              en Supabase.
            </div>
          )}
          {!error && eventos === null && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>Cargando historial…</div>
          )}
          {!error && eventos && eventos.length === 0 && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
              Todavía no hay novedades registradas para este cliente.
            </div>
          )}
          {!error && eventos && eventos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {eventos.map((ev) => {
                const conf = ICONOS_TIPO[ev.tipo] || ICONOS_TIPO.nota;
                const { Icon, color } = conf;
                return (
                  <div key={ev.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: `${color}22`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                    }}>
                      <Icon size={14} color={color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.4 }}>{ev.descripcion}</div>
                      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                        {formatoFecha(ev.creado_en)}{ev.asesor_nombre ? ` · ${ev.asesor_nombre}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
