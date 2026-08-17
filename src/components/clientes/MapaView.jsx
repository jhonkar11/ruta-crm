import { useState } from "react";
import { Phone, MessageCircle, Navigation, Edit3 } from "lucide-react";
import { C, ESTADO_STYLE } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function MapaView({ records, onEdit }) {
  const [active, setActive] = useState(null);
  const visibles = records.filter((r) => r.estado !== "Archivado" && r.lat && r.lng);
  const lats = visibles.map((r) => r.lat), lngs = visibles.map((r) => r.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 0.06;

  const project = (r) => {
    const x = ((r.lng - minLng) / ((maxLng - minLng) || 1)) * (1 - 2 * pad) + pad;
    const y = 1 - (((r.lat - minLat) / ((maxLat - minLat) || 1)) * (1 - 2 * pad) + pad);
    return { x: x * 100, y: y * 100 };
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        background: "#fff", borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden",
        position: "relative", height: 340,
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: "24px 24px", backgroundColor: "#F8F9FA",
      }}>
        {visibles.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink40, fontSize: 13 }}>
            Sin coordenadas para mostrar
          </div>
        )}
        {visibles.map((r, i) => {
          const p = project(r);
          const s = ESTADO_STYLE[r.estado];
          return (
            <button key={r.id} onClick={() => setActive(r)} style={{
              position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -100%)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50% 50% 50% 0", background: s.bg,
                transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)", border: "2px solid #fff",
              }}>
                <span style={{ transform: "rotate(45deg)", color: s.fg, fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div style={{ marginTop: 12, background: "#fff", borderRadius: 16, border: `1px solid ${C.line}`, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>
                {active.nombres} {active.apellidos}
              </div>
              <div style={{ fontSize: 12.5, color: C.ink70, marginTop: 2 }}>{active.direccion}, {active.barrio}</div>
            </div>
            <Stamp estado={active.estado} size="sm" />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <IconBtn icon={Phone} label="Llamar" href={active.telefono ? `tel:${active.telefono}` : undefined} disabled={!active.telefono} />
            <IconBtn icon={MessageCircle} label="WhatsApp" href={active.whatsapp ? `https://wa.me/57${active.whatsapp.replace(/\D/g, "")}` : undefined} disabled={!active.whatsapp} />
            <IconBtn icon={Navigation} label="Cómo llegar" href={`https://www.google.com/maps?q=${active.lat},${active.lng}`} />
            <IconBtn icon={Edit3} label="Ver ficha" onClick={() => onEdit(active)} />
          </div>
        </div>
      )}
    </div>
  );
}
