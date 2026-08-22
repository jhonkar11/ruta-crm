import { X, AlertTriangle, FileWarning, Hourglass, CalendarClock, Phone, MessageCircle, Edit3 } from "lucide-react";
import { C } from "../../styles/tokens";

function ItemAlerta({ r, sublabel, onEdit }) {
  const waNumero = String(r.whatsapp || r.telefono || "").replace(/\D/g, "");
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.06)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      borderRadius: 16,
      padding: "12px 14px",
      marginBottom: 10,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.nombres} {r.apellidos}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.75)", marginTop: 3 }}>{sublabel}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a href={r.telefono ? `tel:${r.telefono}` : undefined} style={{
          width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          opacity: r.telefono ? 1 : 0.35, pointerEvents: r.telefono ? "auto" : "none",
        }}><Phone size={14} /></a>
        <a href={waNumero ? `https://wa.me/57${waNumero}` : undefined} target="_blank" rel="noreferrer" style={{
          width: 32, height: 32, borderRadius: 10, background: "rgba(37,211,102,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#25D366",
          opacity: waNumero ? 1 : 0.35, pointerEvents: waNumero ? "auto" : "none",
        }}><MessageCircle size={14} /></a>
        <button onClick={() => onEdit(r)} style={{
          width: 32, height: 32, borderRadius: 10, background: "#E14E2A", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer",
        }}><Edit3 size={14} /></button>
      </div>
    </div>
  );
}

function Seccion({ icon: Icon, color, titulo, items, render, emptyText }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={16} color={color} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {titulo}
        </span>
        <span style={{
          background: `${color}33`, color, fontSize: 11.5, fontWeight: 700, borderRadius: 20,
          padding: "2px 8px", marginLeft: "auto",
        }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.6)", fontStyle: "italic", paddingLeft: 4 }}>{emptyText}</div>
      ) : items.map((r) => render(r))}
    </div>
  );
}

export default function AlertasModal({ alertas, onClose, onEdit }) {
  const { documentosPendientes, estudioEstancado, seguimientosRetrasados } = alertas;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(15, 10, 25, 0.6)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      boxSizing: "border-box"
    }}>
      {/* Contenedor con el estilo exacto de la tarjeta de inicio de sesión */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        borderRadius: 28,
        padding: 32,
        width: "100%",
        maxWidth: 520,
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
        maxHeight: "88vh",
        overflowY: "auto",
        color: "#fff",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={22} color="#F59E0B" />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#FFFFFF" }}>
              Centro de alertas
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
            width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <X size={18} />
          </button>
        </div>

        <Seccion
          icon={CalendarClock} color="#EF4444" titulo="Seguimientos retrasados"
          items={seguimientosRetrasados} emptyText="No hay seguimientos atrasados. 🎉"
          render={(r) => (
            <ItemAlerta key={r.id} r={r} onEdit={onEdit}
              sublabel={`Debía contactarse el ${r.fecha_seguimiento}`} />
          )}
        />

        <Seccion
          icon={FileWarning} color="#F59E0B" titulo="Documentos estancados"
          items={documentosPendientes} emptyText="Ningún expediente lleva demasiado tiempo pendiente."
          render={(r) => (
            <ItemAlerta key={r.id} r={r} onEdit={onEdit}
              sublabel={`Documentación pendiente hace ${r._dias} día${r._dias === 1 ? "" : "s"}`} />
          )}
        />

        <Seccion
          icon={Hourglass} color="#60A5FA" titulo="En estudio sin respuesta"
          items={estudioEstancado} emptyText="Ningún crédito lleva demasiado tiempo en estudio."
          render={(r) => (
            <ItemAlerta key={r.id} r={r} onEdit={onEdit}
              sublabel={`En estudio hace ${r._dias} día${r._dias === 1 ? "" : "s"}`} />
          )}
        />
      </div>
    </div>
  );
}