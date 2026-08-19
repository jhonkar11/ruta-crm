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
  const { user, profile: rawProfile, loading: authLoading, logout } = useAuth();
  const { records, loading: recordsLoading, error, saveCliente, archivar, eliminar } = useClientes();

  const [view, setView] = useState("mapa");
  const [editing, setEditing] = useState(undefined);
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");

  const profile = useMemo(() => {
    if (!rawProfile) return null;
    const correo = (rawProfile.nombre || rawProfile.email || "").toLowerCase();
    let nombreReal = rawProfile.nombre_completo || rawProfile.nombre;
    if (correo.includes("jhonka001")) nombreReal = "Jhon Alexander Vasquez Revelo";
    else if (correo.includes("sanloren1210")) nombreReal = "Sandra Lorena Vásquez";
    return { ...rawProfile, nombre: nombreReal, nombre_completo: nombreReal };
  }, [rawProfile]);

  // Adaptación de citas para la vista de CitasView
  const citas = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => r && r.estado !== "Archivado" && r.fecha_seguimiento)
      .map((r) => ({
        id: r.id,
        clienteId: r.id,
        fecha_hora: `${r.fecha_seguimiento}T09:00:00`,
        estado: r.estado || "Programada", // Usamos el estado real del registro
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

  // Funciones de acción actualizadas
  const posponerSimulado = async (cita, nuevaFecha) => {
    const clienteObj = records.find(r => r && r.id === (cita.clienteId || cita.id));
    if (!clienteObj) return;
    // Guardamos estado "Reprogramada" y la nueva fecha
    await saveCliente({ ...clienteObj, fecha_seguimiento: nuevaFecha, estado: "Reprogramada" }, false, user.id);
  };

  const marcarCumplidaSimulada = async (cita) => {
    const clienteObj = records.find(r => r && r.id === (cita.clienteId || cita.id));
    if (!clienteObj) return;
    // Guardamos estado "Cumplida"
    await saveCliente({ ...clienteObj, estado: "Cumplida" }, false, user.id);
  };

  const handleSave = async (record, isNew) => {
    try {
      await saveCliente(record, isNew, user.id);
      setEditing(undefined);
      setView("todos");
    } catch (e) { alert("Error: " + e.message); }
  };

  // ... (El resto de tu código de renderizado permanece igual)
  // Asegúrate de pasar las funciones correctamente en el bloque de view === "citas":

  /* 
     Dentro de tu bloque render, asegúrate que las props en CitasView sean así:
     <CitasView
        citas={citas}
        clientes={records ? records.filter((r) => r && r.estado !== "Archivado") : []}
        onPosponer={posponerSimulado}
        onCumplida={marcarCumplidaSimulada}
     />
  */

  if (authLoading) return <div>Cargando sesión…</div>;
  if (!user || !profile) return <LoginScreen />;
  if (recordsLoading || records === null) return <div>Cargando registros…</div>;

  // ... (Mantén el resto del return exactamente como lo tenías)
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
       {/* ... resto del JSX ... */}
    </div>
  );
}