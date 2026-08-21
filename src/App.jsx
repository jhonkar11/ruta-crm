import { useMemo, useState } from "react";
import { Search, BellRing, X, Phone, MessageCircle, Edit3 } from "lucide-react";
import { C, inputStyle, todayISO } from "./styles/tokens";
import { useAuth } from "./hooks/useAuth";
import { useClientes } from "./hooks/useClientes";

import LoginScreen from "./components/auth/LoginScreen";
import TopBar from "./components/layout/TopBar";
import BottomNav from "./components/layout/BottomNav";
import ClientCard from "./components/clientes/ClientCard";
import MapaView from "./components/clientes/MapaView";
import FormView from "./components/clientes/FormView";
import CitasView from "./components/citas/CitasView";
import { ViewHeader, EmptyState, ConfirmModal, TextInput } from "./components/ui/UIKit";
import { Stamp, IconBtn } from "./components/ui/UIKit";

export default function App() {
  const { user, profile: rawProfile, loading: authLoading, logout } = useAuth();
  const { records, loading: recordsLoading, error, saveCliente, archivar, eliminar } = useClientes();

  const [view, setView] = useState("mapa");
  const [editing, setEditing] = useState(undefined);
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");
  
  const [showMananaModal, setShowMananaModal] = useState(false);

  const profile = useMemo(() => {
    if (!rawProfile) return null;
    const correo = (rawProfile.nombre || rawProfile.email || "").toLowerCase();
    let nombreReal = rawProfile.nombre_completo || rawProfile.nombre;
    if (correo.includes("jhonka001")) {
      nombreReal = "Jhon Alexander Vasquez Revelo";
    } else if (correo.includes("sanloren1210")) {
      nombreReal = "Sandra Lorena Vásquez";
    }
    return { ...rawProfile, nombre: nombreReal, nombre_completo: nombreReal };
  }, [rawProfile]);

  const citas = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => r && r.estado !== "Archivado" && r.fecha_seguimiento)
      .map((r) => ({
        id: r.id,
        clienteId: r.id,
        fecha_hora: `${r.fecha_seguimiento}T09:00:00`,
        estado: r.estado || "Programada",
        notas: r.observaciones || "Seguimiento programado",
        cliente: r,
        nombres: r.nombres,
        apellidos: r.apellidos,
        direccion: r.direccion
      }));
  }, [records]);

  const mananaISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const citasManana = useMemo(() => {
    if (!records) return [];
    return records.filter(r => r && r.fecha_seguimiento === mananaISO && !["Archivado", "Visitado", "Cancelado"].includes(r.estado));
  }, [records, mananaISO]);

  const buscados = useMemo(() => {
    if (!query.trim() || !records) return [];
    const q = query.trim().toLowerCase();
    return records.filter((r) => r && r.estado !== "Archivado" && (`${r.nombres || ""} ${r.apellidos || ""}`.toLowerCase().includes(q) || (r.id || "").toString().includes(q)));
  }, [query, records]);

  const todos = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => r && (showArchived || r.estado !== "Archivado"))
      .filter((r) => {
        if (filtroActivo === "PENDIENTES") return r.fecha_seguimiento && !["Visitado", "Cancelado"].includes(r.estado);
        if (filtroActivo === "NO_LOCALIZADOS") return r.categoria_cliente === "No localizado" || r.estado === "No localizado";
        if (filtroActivo === "INTERESADOS") return ["Interesado", "Preoferta", "En trámite / Pendiente"].includes(r.categoria_cliente || r.estado);
        return true;
      })
      .sort((a, b) => (b.fecha_creacion || "").localeCompare(a.fecha_creacion || ""));
  }, [records, showArchived, filtroActivo]);

  const citasHoyCount = useMemo(() => {
    const hoy = todayISO();
    return (citas || []).filter((c) => c && c.estado === "Programada" && c.fecha_hora.slice(0, 10) <= hoy).length;
  }, [citas]);

  const posponerSimulado = async (cita, nuevaFecha) => {
    const clienteObj = records.find(r => r && r.id === (cita.clienteId || cita.id));
    if (!clienteObj) return;
    await saveCliente({ ...clienteObj, fecha_seguimiento: nuevaFecha.slice(0, 10), estado: "Reprogramada" }, false, user.id);
  };

  const marcarCumplidaSimulada = async (cita) => {
    const clienteObj = records.find(r => r && r.id === (cita.clienteId || cita.id));
    if (!clienteObj) return;
    await saveCliente({ ...clienteObj, estado: "Cumplida" }, false, user.id);
  };

  const cancelarSimulado = async (cita) => {
    const clienteObj = records.find(r => r && r.id === (cita.clienteId || cita.id));
    if (!clienteObj) return;
    await saveCliente({ ...clienteObj, estado: "Cancelado" }, false, user.id);
  };

  const openEdit = (r) => { setEditing(undefined); setEditing(r); setView("form"); };
  const openNew = () => { setEditing(undefined); setView("form"); };

  const handleSave = async (record, isNew) => {
    if (isNew && records.some((r) => r && r.id === record.id)) {
      alert("Ya existe un registro con esa cédula/NIT.");
      return;
    }
    try {
      await saveCliente(record, isNew, user.id);
      setEditing(undefined);
      setView("todos");
    } catch (e) {
      alert("No se pudo guardar el registro: " + e.message);
    }
  };

  const handleArchive = (r) => setConfirmTarget({ type: "archive", record: r });
  const handleDelete = (r) => setConfirmTarget({ type: "delete", record: r });

  const confirmAction = async () => {
    if (!confirmTarget) return;
    const { type, record } = confirmTarget;
    try {
      if (type === "archive") await archivar(record.id);
      else await eliminar(record.id);
    } catch (e) {
      alert("No se pudo completar la acción: " + e.message);
    }
    setConfirmTarget(null);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1a0a3e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        Cargando sesión…
      </div>
    );
  }
  if (!user || !profile) return <LoginScreen />;

  if (recordsLoading || records === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#1a0a3e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        Cargando registros…
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      background: "#1a0a3e",
      overflowX: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Fondo de ondas exacto idéntico al login */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(180,80,20,0.5) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(120,40,200,0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 10% 80%, rgba(15,120,130,0.6) 0%, transparent 50%),
          linear-gradient(135deg, #2d1b69 0%, #1e0f4a 100%)
        `,
        pointerEvents: "none"
      }}>
        <svg style={{ position: "absolute", width: "100%", height: "100%" }} viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,200 Q250,100 500,250 T1000,200 L1000,0 L0,0 Z" fill="rgba(200,90,20,0.25)" />
          <path d="M0,600 Q300,500 600,650 T1000,600 L1000,0 L0,0 Z" fill="rgba(80,30,180,0.4)" />
          <path d="M0,700 Q400,600 800,750 T1000,700 L1000,1000 L0,1000 Z" fill="rgba(15,100,120,0.5)" />
        </svg>
      </div>

      {/* Contenedor principal del dashboard sobre las ondas */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <TopBar profile={profile} userId={user.id} onLogout={logout} />

        <div style={{ padding: "24px 24px 100px" }}>
          {error && (
            <div style={{ background: "#FCEBE5", color: C.coralDark, padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              Error cargando datos: {error}
            </div>
          )}

          {citasManana.length > 0 && (
            <div 
              onClick={() => setShowMananaModal(true)}
              style={{ 
                background: "rgba(254, 243, 199, 0.95)", 
                border: "1.5px solid #F59E0B", 
                color: "#92400E", 
                padding: "14px 18px", 
                borderRadius: 14, 
                marginBottom: 18, 
                display: "flex", 
                alignItems: "center", 
                gap: 12,
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
                cursor: "pointer",
                backdropFilter: "blur(8px)"
              }}
            >
              <div style={{ background: "#F59E0B", color: "#fff", padding: 8, borderRadius: "50%", display: "flex" }}>
                <BellRing size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>¡Alerta de ruta para mañana! ({citasManana.length} cliente(s) agendado(s)) - Toca para ver</strong>
                <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.9 }}>
                  Tienes visitas próximas programadas para el {mananaISO}. No olvides confirmar la asistencia con cada cliente.
                </div>
              </div>
            </div>
          )}

          {view === "mapa" && (
            <>
              <div style={{ color: "#ffffff", marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Panel de Metas y Filtros</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "4px 0 0 0" }}>{records ? records.filter(r => r && r.estado !== "Archivado").length : 0} registros totales en la base de datos</p>
              </div>
              <MapaView records={records} onEdit={openEdit} />
            </>
          )}

          {view === "citas" && (
            <CitasView
              citas={citas}
              clientes={records ? records.filter((r) => r && r.estado !== "Archivado") : []}
              currentUser={{ id: user.id, nombre: profile.nombre }}
              onPosponer={posponerSimulado}
              onCumplida={marcarCumplidaSimulada}
              onCancelar={cancelarSimulado}
            />
          )}

          {view === "buscar" && (
            <>
              <div style={{ color: "#ffffff", marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Búsqueda rápida</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "4px 0 0 0" }}>Por nombre o cédula</p>
              </div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <Search size={16} color={C.ink40} style={{ position: "absolute", left: 12, top: 13 }} />
                <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Escribe un nombre o número de cédula…"
                  style={{ ...inputStyle(false), paddingLeft: 36 }} />
              </div>
              {query.trim() && buscados.length === 0 && <EmptyState text="Sin resultados para esa búsqueda." />}
              {buscados.map((r) => (
                <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} canDelete={profile?.rol === "admin"} profile={profile || {}} />
              ))}
            </>
          )}

          {view === "todos" && (
            <>
              <div style={{ color: "#ffffff", marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Base de datos de créditos</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "4px 0 0 0" }}>{todos.length} registros en total</p>
              </div>
              
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                <FiltroChip active={filtroActivo === "TODOS"} onClick={() => setFiltroActivo("TODOS")} label="Todos" />
                <FiltroChip active={filtroActivo === "PENDIENTES"} onClick={() => setFiltroActivo("PENDIENTES")} label="📅 Con fecha / Pendientes" />
                <FiltroChip active={filtroActivo === "NO_LOCALIZADOS"} onClick={() => setFiltroActivo("NO_LOCALIZADOS")} label="❌ No localizados" />
                <FiltroChip active={filtroActivo === "INTERESADOS"} onClick={() => setFiltroActivo("INTERESADOS")} label="⭐ Interesados / Preofertas" />
                {profile.rol === "admin" && (
                  <FiltroChip active={showArchived} onClick={() => setShowArchived(!showArchived)} label="Archivados" />
                )}
              </div>

              {todos.length === 0 && <EmptyState text="No hay registros para este filtro." />}
              {todos.map((r) => (
                <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} canDelete={profile?.rol === "admin"} profile={profile || {}} />
              ))}
            </>
          )}

          {view === "form" && (
            <FormView 
              initial={editing} 
              currentUser={{ id: user.id, nombre: profile.nombre }} 
              onSave={handleSave} 
              onCancel={() => { setEditing(undefined); setView("todos"); }} 
            />
          )}
        </div>

        {view !== "form" && <BottomNav view={view} setView={setView} onNew={openNew} citasHoyCount={citasHoyCount} />}
      </div>

      {showMananaModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500,
            maxHeight: "85vh", display: "flex", flexDirection: "column",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)", overflow: "hidden"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF3C7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BellRing size={18} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#92400E" }}>
                  Visitas para mañana ({citasManana.length})
                </h3>
              </div>
              <button 
                onClick={() => setShowMananaModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#f8fafc" }}>
              {citasManana.map((r) => (
                <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: 14, border: `1px solid ${C.line}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, textTransform: "uppercase" }}>
                        {r.nombres} {r.apellidos}
                      </div>
                      <div style={{ fontSize: 12, color: C.ink70, marginTop: 2 }}>
                        {r.direccion ? `${r.direccion}, ${r.barrio || ''}` : "Sin dirección registrada"}
                      </div>
                    </div>
                    <Stamp estado={r.categoria_cliente || r.estado} size="sm" />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                    <IconBtn icon={Phone} label="Llamar" href={r.telefono ? `tel:${r.telefono}` : undefined} disabled={!r.telefono} />
                    <IconBtn icon={MessageCircle} label="WhatsApp" href={r.whatsapp ? `https://wa.me/57${r.whatsapp.replace(/\D/g, "")}` : undefined} disabled={!r.whatsapp} />
                    <IconBtn icon={Edit3} label="Ver ficha" onClick={() => { setShowMananaModal(false); openEdit(r); }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 12, borderTop: `1px solid ${C.line}`, background: "#fff", textAlign: "right" }}>
              <button 
                onClick={() => setShowMananaModal(false)}
                style={{ background: C.ink, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.type === "archive" ? "Archivar registro" : "Eliminar definitivamente"}
          body={confirmTarget.type === "archive"
            ? `${confirmTarget.record.nombres} ${confirmTarget.record.apellidos} se moverá a archivados. Podrás consultarlo luego, no se pierde el historial.`
            : `Esta acción borrará para siempre el registro de ${confirmTarget.record.nombres} ${confirmTarget.record.apellidos}. No se puede deshacer.`}
          confirmLabel={confirmTarget.type === "archive" ? "Archivar" : "Eliminar"}
          danger={confirmTarget.type === "delete"}
          onConfirm={confirmAction}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

function FiltroChip({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      border: `1.5px solid ${active ? C.coral : "rgba(255,255,255,0.2)"}`, 
      background: active ? "#FCEBE5" : "rgba(26, 10, 62, 0.6)",
      color: active ? C.coralDark : "#ffffff", 
      borderRadius: 20, 
      padding: "6px 14px", 
      fontSize: 12.5,
      fontWeight: 600, 
      cursor: "pointer", 
      backdropFilter: "blur(4px)"
    }}>{label}</button>
  );
}