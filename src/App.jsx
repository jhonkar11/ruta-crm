import { useMemo, useState } from "react";
import { Search, BellRing } from "lucide-react";
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

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const { records, loading: recordsLoading, error, saveCliente, archivar, eliminar } = useClientes();

  const [view, setView] = useState("mapa");
  const [editing, setEditing] = useState(undefined);
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");

  // Transformamos los clientes que tienen fecha de seguimiento en "citas" virtuales
  const citas = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => r && r.estado !== "Archivado" && r.fecha_seguimiento)
      .map((r) => ({
        id: r.id,
        clienteId: r.id,
        fecha_hora: `${r.fecha_seguimiento}T09:00:00`,
        estado: r.estado === "Visitado" || r.estado === "Cancelado" ? "Cumplida" : "Programada",
        notas: r.observaciones || "Seguimiento programado",
        cliente: r
      }));
  }, [records]);

  // Alerta automática para visitas programadas exactamente para mañana
  const mananaISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const citasManana = useMemo(() => {
    if (!records) return [];
    return records.filter(r => r && r.fecha_seguimiento === mananaISO && r.estado !== "Archivado" && r.estado !== "Visitado" && r.estado !== "Cancelado");
  }, [records, mananaISO]);

  const buscados = useMemo(() => {
    if (!query.trim() || !records) return [];
    const q = query.trim().toLowerCase();
    return records.filter((r) => r && r.estado !== "Archivado" &&
      (`${r.nombres || ""} ${r.apellidos || ""}`.toLowerCase().includes(q) || (r.id || "").toString().includes(q)));
  }, [query, records]);

  const todos = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => r && (showArchived || r.estado !== "Archivado"))
      .filter((r) => {
        if (filtroActivo === "PENDIENTES") return r.fecha_seguimiento && !["Visitado", "Cancelado"].includes(r.estado);
        if (filtroActivo === "NO_LOCALIZADOS") return r.categoria_cliente === "No localizado" || r.estado === "No localizado";
        if (filtroActivo === "INTERESADOS") return ["Interesado", "Preoferta", "En trámite / Pendiente"].includes(r.categoria_cliente || r.estado);
        return true; // "TODOS"
      })
      .sort((a, b) => (b.fecha_creacion || "").localeCompare(a.fecha_creacion || ""));
  }, [records, showArchived, filtroActivo]);

  const citasHoyCount = useMemo(() => {
    const hoy = todayISO();
    return (citas || []).filter((c) => c && c.estado === "Programada" && c.fecha_hora.slice(0, 10) <= hoy).length;
  }, [citas]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        Cargando sesión…
      </div>
    );
  }
  if (!user || !profile) return <LoginScreen />;

  if (recordsLoading || records === null) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        Cargando registros…
      </div>
    );
  }

  const openEdit = (r) => { setEditing(r); setView("form"); };
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

  const crearCitaSimulada = async ({ clienteId, fechaHora }) => {
    const clienteObj = records.find(r => r && r.id === clienteId);
    if (!clienteObj) return;
    const fechaLimpia = fechaHora.slice(0, 10);
    await saveCliente({ ...clienteObj, fecha_seguimiento: fechaLimpia, estado: "Pendiente" }, false, user.id);
  };

  const posponerSimulado = async (cita, nuevaFechaHora) => {
    const clienteObj = records.find(r => r && r.id === (cita.clienteId || cita.id));
    if (!clienteObj) return;
    const fechaLimpia = nuevaFechaHora.slice(0, 10);
    await saveCliente({ ...clienteObj, fecha_seguimiento: fechaLimpia }, false, user.id);
  };

  const marcarCumplidaSimulada = async (id) => {
    const clienteObj = records.find(r => r && r.id === id);
    if (!clienteObj) return;
    await saveCliente({ ...clienteObj, estado: "Visitado" }, false, user.id);
  };

  const cancelarSimulado = async (id) => {
    const clienteObj = records.find(r => r && r.id === id);
    if (!clienteObj) return;
    await saveCliente({ ...clienteObj, estado: "Cancelado" }, false, user.id);
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

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ 
        maxWidth: "1100px", 
        margin: "0 auto", 
        minHeight: "100vh", 
        background: C.paper, 
        position: "relative", 
        boxShadow: "0 0 40px rgba(0,0,0,0.08)" 
      }}>
        <TopBar profile={profile} userId={user.id} onLogout={logout} />

        <div style={{ padding: "24px 24px 100px" }}>
          {error && (
            <div style={{ background: "#FCEBE5", color: C.coralDark, padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              Error cargando datos: {error}
            </div>
          )}

          {/* Alerta inteligente de visitas programadas para mañana */}
          {citasManana.length > 0 && (
            <div style={{ 
              background: "#FEF3C7", 
              border: "1.5px solid #F59E0B", 
              color: "#92400E", 
              padding: "14px 18px", 
              borderRadius: 14, 
              marginBottom: 18, 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)"
            }}>
              <div style={{ background: "#F59E0B", color: "#fff", padding: 8, borderRadius: "50%", display: "flex" }}>
                <BellRing size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>¡Alerta de ruta para mañana! ({citasManana.length} cliente(s) agendado(s))</strong>
                <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.9 }}>
                  Tienes visitas próximas programadas para el {mananaISO}. No olvides confirmar la asistencia con cada cliente.
                </div>
              </div>
            </div>
          )}

          {view === "mapa" && (
            <>
              <ViewHeader title="Panel de Metas y Filtros" subtitle={`${records ? records.filter(r => r && r.estado !== "Archivado").length : 0} registros totales en la base de datos`} />
              <MapaView records={records} onEdit={openEdit} />
            </>
          )}

          {view === "citas" && (
            <CitasView
              citas={citas}
              clientes={records ? records.filter((r) => r && r.estado !== "Archivado") : []}
              currentUser={{ id: user.id, nombre: profile.nombre }}
              onCrear={crearCitaSimulada}
              onPosponer={posponerSimulado}
              onCumplida={marcarCumplidaSimulada}
              onCancelar={cancelarSimulado}
            />
          )}

          {view === "buscar" && (
            <>
              <ViewHeader title="Búsqueda rápida" subtitle="Por nombre o cédula" />
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
              <ViewHeader title="Base de datos de créditos" subtitle={`${todos.length} registros en total`} />
              
              {/* Botones de filtro rápido comercial */}
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
      border: `1.5px solid ${active ? C.coral : C.line}`, background: active ? "#FCEBE5" : "#fff",
      color: active ? C.coralDark : C.ink70, borderRadius: 20, padding: "5px 12px", fontSize: 12,
      fontWeight: 600, cursor: "pointer",
    }}>{label}</button>
  );
}