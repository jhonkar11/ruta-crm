import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { C, inputStyle, todayISO } from "./styles/tokens";
import { useAuth } from "./hooks/useAuth";
import { useClientes } from "./hooks/useClientes";
import { useCitas } from "./hooks/useCitas";

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
  const { citas, loading: citasLoading, crear: crearCita, posponer, marcarCumplida, cancelar } = useCitas();

  const [view, setView] = useState("mapa");
  const [editing, setEditing] = useState(undefined);
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [soloPendientes, setSoloPendientes] = useState(false);

  const buscados = useMemo(() => {
    if (!query.trim() || !records) return [];
    const q = query.trim().toLowerCase();
    return records.filter((r) => r.estado !== "Archivado" &&
      (`${r.nombres} ${r.apellidos}`.toLowerCase().includes(q) || r.id.includes(q)));
  }, [query, records]);

  const todos = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => showArchived || r.estado !== "Archivado")
      .filter((r) => !soloPendientes || r.estado === "Pendiente")
      .sort((a, b) => (b.fecha_creacion || "").localeCompare(a.fecha_creacion || ""));
  }, [records, showArchived, soloPendientes]);

  const citasHoyCount = useMemo(() => {
    const hoy = todayISO();
    return (citas || []).filter((c) => c.estado === "Programada" && c.fecha_hora.slice(0, 10) <= hoy).length;
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
    if (isNew && records.some((r) => r.id === record.id)) {
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

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: C.paper, position: "relative", boxShadow: "0 0 60px rgba(0,0,0,0.15)" }}>
        <TopBar profile={profile} userId={user.id} onLogout={logout} />

        <div style={{ padding: "18px 16px 100px" }}>
          {error && (
            <div style={{ background: "#FCEBE5", color: C.coralDark, padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              Error cargando datos: {error}
            </div>
          )}

          {view === "mapa" && (
            <>
              <ViewHeader title="Mapa de clientes" subtitle={`${todos.length} registros activos en el mapa`} />
              <MapaView records={records} onEdit={openEdit} />
            </>
          )}

          {view === "citas" && (
            citasLoading || citas === null ? (
              <EmptyState text="Cargando citas…" />
            ) : (
              <CitasView
                citas={citas}
                clientes={records.filter((r) => r.estado !== "Archivado")}
                currentUser={{ id: user.id, nombre: profile.nombre }}
                onCrear={crearCita}
                onPosponer={posponer}
                onCumplida={marcarCumplida}
                onCancelar={cancelar}
              />
            )
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
                <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} canDelete={profile.rol === "admin"} />
              ))}
            </>
          )}

          {view === "todos" && (
            <>
              <ViewHeader title="Todos los registros" subtitle={`${todos.length} en total`} />
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <FiltroChip active={soloPendientes} onClick={() => setSoloPendientes(!soloPendientes)} label="Solo pendientes" />
                {profile.rol === "admin" && (
                  <FiltroChip active={showArchived} onClick={() => setShowArchived(!showArchived)} label="Ver archivados" />
                )}
              </div>
              {todos.length === 0 && <EmptyState text="No hay registros para este filtro." />}
              {todos.map((r) => (
                <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} canDelete={profile.rol === "admin"} />
              ))}
            </>
          )}

          {view === "form" && (
            <FormView initial={editing} currentUser={{ id: user.id, nombre: profile.nombre }} onSave={handleSave} onCancel={() => setView("todos")} />
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
