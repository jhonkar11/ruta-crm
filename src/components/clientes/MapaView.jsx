import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, TrendingUp, Phone, MessageCircle, Edit3, Calendar, ShieldCheck } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function MapaView({ records = [], onEdit }) {
  const [filtroActivo, setFiltroActivo] = useState("TODOS");
  const [activeClient, setActiveClient] = useState(null);

  const activos = records.filter((r) => r && r.estado !== "Archivado");
  const total = activos.length;

  const obtenerEstadoLimpio = (r) => {
    return (r.estado || r.categoria_cliente || "").trim().toLowerCase();
  };

  const matchFiltro = (r, tipo) => {
    const est = obtenerEstadoLimpio(r);
    if (tipo === "Interesado") return est.includes("interesado") || est.includes("preoferta");
    if (tipo === "En trámite") return est.includes("trámite") || est.includes("pendiente");
    if (tipo === "Contactado") return est.includes("contactado");
    if (tipo === "No localizado") return est.includes("no localizado");
    if (tipo === "Reprogramada") return est.includes("reprogramada") || est.includes("reprogramado");
    if (tipo === "Créditos OK") return est.includes("cumplida") || est.includes("crédito ok") || est.includes("desembolsado");
    return false;
  };

  const interesados = activos.filter(r => matchFiltro(r, "Interesado")).length;
  const enTramite = activos.filter(r => matchFiltro(r, "En trámite")).length;
  const contactados = activos.filter(r => matchFiltro(r, "Contactado")).length;
  const noLocalizados = activos.filter(r => matchFiltro(r, "No localizado")).length;
  const reprogramados = activos.filter(r => matchFiltro(r, "Reprogramada")).length;
  const creditosOk = activos.filter(r => matchFiltro(r, "Créditos OK")).length;

  const filtrados = filtroActivo === "TODOS" 
    ? activos 
    : activos.filter(r => matchFiltro(r, filtroActivo));

  return (
    <div style={{ padding: "4px 4px 110px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Panel de Metas y Filtros
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "2px 0 0 0" }}>
            Control unificado de base de datos y créditos
          </p>
        </div>
        <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "6px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={14} color={C.coral} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.coral }}>{total} Total</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard title="Interesados" count={interesados} icon={CheckCircle2} color="#16a34a" active={filtroActivo === "Interesado"} onClick={() => setFiltroActivo(filtroActivo === "Interesado" ? "TODOS" : "Interesado")} />
        <StatCard title="En Trámite" count={enTramite} icon={Clock} color="#0284c7" active={filtroActivo === "En trámite"} onClick={() => setFiltroActivo(filtroActivo === "En trámite" ? "TODOS" : "En trámite")} />
        <StatCard title="Contactados" count={contactados} icon={AlertCircle} color="#ca8a04" active={filtroActivo === "Contactado"} onClick={() => setFiltroActivo(filtroActivo === "Contactado" ? "TODOS" : "Contactado")} />
        <StatCard title="No Localizados" count={noLocalizados} icon={XCircle} color="#dc2626" active={filtroActivo === "No localizado"} onClick={() => setFiltroActivo(filtroActivo === "No localizado" ? "TODOS" : "No localizado")} />
        <StatCard title="Reprogramadas" count={reprogramados} icon={Calendar} color="#8B5CF6" active={filtroActivo === "Reprogramada"} onClick={() => setFiltroActivo(filtroActivo === "Reprogramada" ? "TODOS" : "Reprogramada")} />
        <StatCard title="Créditos OK" count={creditosOk} icon={ShieldCheck} color="#059669" active={filtroActivo === "Créditos OK"} onClick={() => setFiltroActivo(filtroActivo === "Créditos OK" ? "TODOS" : "Créditos OK")} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 2px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
          {filtroActivo === "TODOS" ? "Mostrando todos los registros" : `Filtro aplicado: ${filtroActivo}`}
        </span>
        {filtroActivo !== "TODOS" && (
          <button onClick={() => setFiltroActivo("TODOS")} style={{ background: "none", border: "none", color: "#FDE047", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
            Quitar filtro
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.length === 0 ? (
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, textAlign: "center", border: `1px solid ${C.line}` }}>
            <p style={{ color: C.ink70, fontSize: 13, margin: 0 }}>No hay registros en esta categoría.</p>
          </div>
        ) : (
          filtrados.map((r) => (
            <div 
              key={r.id} 
              onClick={() => setActiveClient(activeClient?.id === r.id ? null : r)}
              style={{
                background: "#fff", borderRadius: 12, padding: 12, border: `1.5px solid ${activeClient?.id === r.id ? C.coral : C.line}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, textTransform: "uppercase" }}>
                  {r.nombres} {r.apellidos}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#DC2626", fontWeight: 700, marginTop: 3, display: "flex", gap: 6 }}>
                  <span>CC/NIT: {r.id}</span>
                  <span>•</span>
                  <span>{r.tipo_negocio || "Comercio"}</span>
                </div>
              </div>
              <Stamp estado={r.estado || r.categoria_cliente} size="sm" />
            </div>
          ))
        )}
      </div>

      {/* Tarjeta flotante inferior detallada al hacer clic en un cliente */}
      {activeClient && (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: `1.5px solid ${C.coral}`, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>
                {activeClient.nombres} {activeClient.apellidos}
              </div>
              <div style={{ fontSize: 12, color: C.ink70, marginTop: 2 }}>
                {activeClient.direccion ? `${activeClient.direccion}, ${activeClient.barrio || ''}` : "Sin dirección registrada"}
              </div>
            </div>
            <Stamp estado={activeClient.estado || activeClient.categoria_cliente} size="sm" />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <IconBtn icon={Phone} label="Llamar" href={activeClient.telefono ? `tel:${activeClient.telefono}` : undefined} disabled={!activeClient.telefono} />
            <IconBtn icon={MessageCircle} label="WhatsApp" href={activeClient.whatsapp ? `https://wa.me/57${String(activeClient.whatsapp).replace(/\D/g, "")}` : undefined} disabled={!activeClient.whatsapp} />
            <IconBtn icon={Edit3} tone="coral" label="Editar ficha" onClick={() => onEdit(activeClient)} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, icon: Icon, color, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: active ? "#fff7ed" : "#fff",
        border: `2px solid ${active ? C.coral : C.line}`,
        borderRadius: 12, padding: "10px 8px", cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 64
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.ink70, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{count}</div>
    </div>
  );
}