import { useMemo, useState } from "react";
import { Search, BellRing, X, Phone, MessageCircle, Edit3, Sparkles } from "lucide-react";
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
import { ViewHeader, EmptyState, ConfirmModal, TextInput, FiltroChip } from "./components/ui/UIKit";
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
        cliente: r
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

  if (authLoading) return <div style={{ minHeight: "100vh", background: "#080E1E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600 }}>Cargando sesión…</div>;
  if (!user || !profile) return <LoginScreen />;
  if (recordsLoading || records === null) return <div style={{ minHeight: "100vh", background: "#080E1E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600 }}>Cargando registros…</div>;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080E1E",
      position: "relative",
      overflow: "hidden",
      color: "#f8fafc"
    }}>
      {/* FONDO HERMOSO - 3 blobs difuminados */}
      <div style={{
        position: "fixed",
        top: "-10%",
        left: "-15%",
        width: 900,
        height: 900,
        background: "radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(59,130,246,0.15) 30%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0
      }} />
      <div style={{
        position: "fixed",
        bottom: "-15%",
        right: "-10%",
        width: 800,
        height: 800,
        background: "radial-gradient(circle, rgba(225,78,42,0.28) 0%, rgba(251,113,133,0.12) 35%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 0
      }} />
      <div style={{
        position: "fixed",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 600,
        background: "radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* CONTENEDOR PRINCIPAL DE LA PLATAFORMA */}
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        minHeight: "100vh",
        background: "rgba(11, 17, 32, 0.75)",
        backdropFilter: "blur(15px)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        position: "relative",
        zIndex: 1,
        boxShadow: "0 0 60px rgba(0,0,0,0.6)"
      }}>
        <TopBar profile={profile} userId={user.id} onLogout={logout} />
        <div style={{ padding: "24px 24px 140px" }}>
          {error && <div style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", padding: 12, borderRadius: 10, marginBottom: 12 }}>Error: {error}</div>}
          
          {citasManana.length > 0 && (
            <div onClick={() => setShowMananaModal(true)} style={{ background: "rgba(245, 158, 11, 0.15)", border: "1.5px solid rgba(245, 158, 11, 0.4)", color: "#fef3c7", padding: "14px 18px", borderRadius: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <Sparkles size={20} />
              <div><strong style={{ display: "block" }}>¡Alerta de ruta para mañana!</strong> {citasManana.length} cliente(s) agendado(s).</div>
            </div>
          )}

          {view === "mapa" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: 0 }}>Panel de Metas y Filtros</h2>
                <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.85)" }}>{records.filter(r => r && r.estado !== "Archivado").length} registros totales</p>
              </div>
              <MapaView records={records} onEdit={openEdit} />
            </>
          )}

          {view === "citas" && <CitasView citas={citas} clientes={records.filter(r => r && r.estado !== "Archivado")} currentUser={{ id: user.id, nombre: profile.nombre }} onPosponer={posponerSimulado} onCumplida={marcarCumplidaSimulada} onCancelar={cancelarSimulado} />}

          {view === "buscar" && (
            <>
              <ViewHeader title={<span style={{ color: "#ffffff" }}>Búsqueda</span>} />
              <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Escribe un nombre o cédula…" />
              {buscados.map((r) => <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} canDelete={profile?.rol === "admin"} profile={profile} />)}
            </>
          )}

          {view === "todos" && (
            <>
              <ViewHeader title={<span style={{ color: "#ffffff" }}>Base de datos</span>} />
              <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <FiltroChip active={filtroActivo === "TODOS"} onClick={() => setFiltroActivo("TODOS")} label="Todos" />
                <FiltroChip active={filtroActivo === "PENDIENTES"} onClick={() => setFiltroActivo("PENDIENTES")} label="Pendientes" />
              </div>
              {todos.map((r) => <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} canDelete={profile?.rol === "admin"} profile={profile} />)}
            </>
          )}

          {view === "form" && <FormView initial={editing} currentUser={{ id: user.id, nombre: profile.nombre }} onSave={handleSave} onCancel={() => { setEditing(undefined); setView("todos"); }} />}
        </div>
      </div>

      {/* Menú Flotante */}
      <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, zIndex: 99999, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(25px)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: 28, boxShadow: "0 20px 45px rgba(0,0,0,0.7)", maxWidth: 480, width: "90%" }}>
          <BottomNav view={view} setView={setView} onNew={openNew} citasHoyCount={citasHoyCount} />
        </div>
      </div>
    </div>
  );
}