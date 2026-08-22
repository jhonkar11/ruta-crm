import { X, AlertTriangle, FileWarning, Hourglass, CalendarClock, Phone, MessageCircle, Edit3 } from "lucide-react";
import { C } from "../../styles/tokens";

function ItemAlerta({ r, sublabel, onEdit }) {
  const waNumero = String(r.whatsapp || r.telefono || "").replace(/\D/g, "");
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 12px", marginBottom: 8,
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.nombres} {r.apellidos}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{sublabel}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a href={r.telefono ? `tel:${r.telefono}` : undefined} style={{
          width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          opacity: r.telefono ? 1 : 0.35, pointerEvents: r.telefono ? "auto" : "none",
        }}><Phone size={13} /></a>
        <a href={waNumero ? `https://wa.me/57${waNumero}` : undefined} target="_blank" rel="noreferrer" style={{
          width: 30, height: 30, borderRadius: 8, background: "rgba(37,211,102,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#25D366",
          opacity: waNumero ? 1 : 0.35, pointerEvents: waNumero ? "auto" : "none",
        }}><MessageCircle size={13} /></a>
        <button onClick={() => onEdit(r)} style={{
          width: 30, height: 30, borderRadius: 8, background: C.coral, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer",
        }}><Edit3 size={13} /></button>
      </div>
    </div>
  );
}

function Seccion({ icon: Icon, color, titulo, items, render, emptyText }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={15} color={color} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          {titulo}
        </span>
        <span style={{
          background: `${color}22`, color, fontSize: 11, fontWeight: 700, borderRadius: 20,
          padding: "1px 8px", marginLeft: "auto",
        }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>{emptyText}</div>
      ) : items.map((r) => render(r))}
    </div>
  );
}

export default function AlertasModal({ alertas, onClose, onEdit }) {
  const { documentosPendientes, estudioEstancado, seguimientosRetrasados } = alertas;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 75,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 460,
        boxShadow: "0 -8px 30px rgba(0,0,0,0.5)", maxHeight: "88vh", overflowY: "auto",
        color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} color="#F59E0B" />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
              Centro de alertas
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <X size={16} />
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
          icon={FileWarning} color="#D97706" titulo="Documentos estancados"
          items={documentosPendientes} emptyText="Ningún expediente lleva demasiado tiempo pendiente."
          render={(r) => (
            <ItemAlerta key={r.id} r={r} onEdit={onEdit}
              sublabel={`Documentación pendiente hace ${r._dias} día${r._dias === 1 ? "" : "s"}`} />
          )}
        />

        <Seccion
          icon={Hourglass} color="#1D4ED8" titulo="En estudio sin respuesta"
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
