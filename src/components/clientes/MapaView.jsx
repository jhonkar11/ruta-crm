import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, TrendingUp, Phone, MessageCircle, Edit3, Calendar, ShieldCheck } from "lucide-react";
import { C } from "../../styles/tokens";
import { Stamp, IconBtn } from "../ui/UIKit";

export default function MapaView({ records = [], onEdit }) {
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");
  const [activeClient, setActiveClient] = useState(null);

  // Filtrar registros activos (excluyendo archivados)
  const activos = records.filter((r) => r.estado !== "Archivado");

  // Contadores rápidos actualizados para los 6 bloques de gestión
  const total = activos.length;
  const interesados = activos.filter(r => r.categoria_cliente === "Interesado").length;
  const enTramite = activos.filter(r => r.categoria_cliente === "En trámite / Pendiente" || r.estado === "En trámite" || r.estado === "Pendiente").length;
  const contactados = activos.filter(r => r.categoria_cliente === "Contactado").length;
  const noLocalizados = activos.filter(r => r.categoria_cliente === "No localizado" || r.estado === "No localizado").length;
  const reprogramados = activos.filter(r => r.categoria_cliente === "Reprogramada" || r.estado === "Reprogramada").length;
  const creditosOk = activos.filter(r => ["Aprobado", "Crédito OK", "Desembolsado", "Cumplida"].includes(r.categoria_cliente || r.estado)).length;

  // Filtrar lista según la categoría seleccionada en las tarjetas de 3 columnas
  const filtrados = categoriaFiltro === "TODOS" 
    ? activos 
    : activos.filter(r => {
        const val = r.categoria_cliente || r.estado;
        if (categoriaFiltro === "En trámite / Pendiente") {
          return val === "En trámite / Pendiente" || val === "En trámite" || val === "Pendiente";
        }
        if (categoriaFiltro === "Créditos OK") {
          return ["Aprobado", "Crédito OK", "Desembolsado", "Cumplida"].includes(val);
        }
        if (categoriaFiltro === "Reprogramada") {
          return val === "Reprogramada";
        }
        return val === categoriaFiltro;
      });

  return (
    <div style={{ padding: "4px 4px 90px 4px" }}>
      {/* Cabecera del Panel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>
            Panel de Metas y Filtros
          </h2>
          <p style={{ fontSize: 12, color: C.ink70, margin: "2px 0 0 0" }}>
            Control de base de datos y créditos
          </p>
        </div>
        <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "6px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={14} color={C.coral} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.coral }}>{total} Total</span>
        </div>
      </div>

      {/* Tarjetas de Resumen / Filtros rápidos organizados en 3 columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard 
          title="Interesados" 
          count={interesados} 
          icon={CheckCircle2} 
          color="#16a34a" 
          active={categoriaFiltro === "Interesado"}
          onClick={() => setCategoriaFiltro(categoriaFiltro === "Interesado" ? "TODOS" : "Interesado")} 
        />
        <StatCard 
          title="En Trámite" 
          count={enTramite} 
          icon={Clock} 
          color="#0284c7" 
          active={categoriaFiltro === "En trámite / Pendiente"}
          onClick={() => setCategoriaFiltro(categoriaFiltro === "En trámite / Pendiente" ? "TODOS" : "En trámite / Pendiente")} 
        />
        <StatCard 
          title="Contactados" 
          count={contactados} 
          icon={AlertCircle} 
          color="#ca8a04" 
          active={categoriaFiltro === "Contactado"}
          onClick={() => setCategoriaFiltro(categoriaFiltro === "Contactado" ? "TODOS" : "Contactado")} 
        />
        <StatCard 
          title="No Localizados" 
          count={noLocalizados} 
          icon={XCircle} 
          color="#dc2626" 
          active={categoriaFiltro === "No localizado"}
          onClick={() => setCategoriaFiltro(categoriaFiltro === "No localizado" ? "TODOS" : "No localizado")} 
        />
        <StatCard 
          title="Reprogramadas" 
          count={reprogramados} 
          icon={Calendar} 
          color="#8B5CF6" 
          active={categoriaFiltro === "Reprogramada"}
          onClick={() => setCategoriaFiltro(categoriaFiltro === "Reprogramada" ? "TODOS" : "Reprogramada")} 
        />
        <StatCard 
          title="Créditos OK" 
          count={creditosOk} 
          icon={ShieldCheck} 
          color="#059669" 
          active={categoriaFiltro === "Créditos OK"}
          onClick={() => setCategoriaFiltro(categoriaFiltro === "Créditos OK" ? "TODOS" : "Créditos OK")} 
        />
      </div>

      {/* Barra de estado del filtro actual */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 2px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink70 }}>
          {categoriaFiltro === "TODOS" ? "Mostrando todos los registros" : `Filtro: ${categoriaFiltro}`}
        </span>
        {categoriaFiltro !== "TODOS" && (
          <button 
            onClick={() => setCategoriaFiltro("TODOS")}
            style={{ background: "none", border: "none", color: C.coral, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Quitar filtro
          </button>
        )}
      </div>

      {/* Lista de clientes filtrados */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.length === 0 ? (
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, textAlign: "center", border: `1px solid ${C.line}` }}>
            <p style={{ color: C.ink70, fontSize: 13, margin: 0 }}>No hay registros con este estado.</p>
          </div>
        ) : (
          filtrados.map((r) => (
            <div 
              key={r.id} 
              onClick={() => setActiveClient(activeClient?.id === r.id ? null : r)}
              style={{
                background: "#fff", borderRadius: 12, padding: 12, border: `1px solid ${activeClient?.id === r.id ? C.coral : C.line}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, textTransform: "uppercase" }}>
                  {r.nombres} {r.apellidos}
                </div>
                <div style={{ fontSize: 11.5, color: C.ink70, marginTop: 2, display: "flex", gap: 6 }}>
                  <span>CC: {r.id}</span>
                  <span>•</span>
                  <span>{r.tipo_negocio || "Comercio"}</span>
                </div>
              </div>
              <Stamp estado={r.categoria_cliente || r.estado} size="sm" />
            </div>
          ))
        )}
      </div>

      {/* Tarjeta de acciones rápidas al seleccionar un cliente de la lista */}
      {activeClient && (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: `1.5px solid ${C.coral}`, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>
                {activeClient.nombres} {activeClient.apellidos}
              </div>
              <div style={{ fontSize: 12, color: C.ink70, marginTop: 2 }}>
                {activeClient.direccion ? `${activeClient.direccion}, ${activeClient.barrio || ''}` : "Sin dirección registrada"}
              </div>
            </div>
            <Stamp estado={activeClient.categoria_cliente || activeClient.estado} size="sm" />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <IconBtn icon={Phone} label="Llamar" href={activeClient.telefono ? `tel:${activeClient.telefono}` : undefined} disabled={!activeClient.telefono} />
            <IconBtn icon={MessageCircle} label="WhatsApp" href={activeClient.whatsapp ? `https://wa.me/57${activeClient.whatsapp.replace(/\D/g, "")}` : undefined} disabled={!activeClient.whatsapp} />
            <IconBtn icon={Edit3} label="Ver ficha" onClick={() => onEdit(activeClient)} />
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
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 64
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.ink70, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>
        {count}
      </div>
    </div>
  );
}