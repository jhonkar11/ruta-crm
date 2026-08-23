import { useMemo, useState, useEffect } from "react";
import { Search, BellRing, X, PhoneCall, MessageSquareText, PencilLine, AlertTriangle, FileText, History, ArchiveRestore } from "lucide-react";
import { C, inputStyle, todayISO } from "./styles/tokens";
import { useAuth } from "./hooks/useAuth";
import { useClientes } from "./hooks/useClientes";
import { calcularAlertas } from "./utils/alertas";
import { calcularProgresoCredito, DOCUMENTOS_CREDITO_DEFAULT } from "./utils/documentosCredito";

import LoginScreen from "./components/auth/LoginScreen";
import TopBar from "./components/layout/TopBar";
import BottomNav from "./components/layout/BottomNav";
import ClientCard from "./components/clientes/ClientCard";
import MapaView from "./components/clientes/MapaView";
import FormView from "./components/clientes/FormView";
import CitasView from "./components/citas/CitasView";
import DocumentosModal from "./components/documentos/DocumentosModal";
import AlertasModal from "./components/alertas/AlertasModal";
import HistorialClienteModal from "./components/historial/HistorialClienteModal";
import { ViewHeader, EmptyState, ConfirmModal, TextInput, Stamp, IconBtn, FiltroChip } from "./components/ui/UIKit";

export default function App() {
  const { user, profile: rawProfile, loading: authLoading, logout } = useAuth();
  const { records, loading: recordsLoading, error, saveCliente, actualizarCampos, archivar, eliminar, registrarNovedad } = useClientes();

  const [view, setView] = useState(() => localStorage.getItem("crm_view") || "mapa");
  const [editing, setEditing] = useState(undefined);
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");
  const [docsCliente, setDocsCliente] = useState(null);
  const [historialCliente, setHistorialCliente] = useState(null);
  const [showAlertas, setShowAlertas] = useState(false);

  const [showMananaModal, setShowMananaModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("crm_view", view);
  }, [view]);

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
        fecha_hora: r.fecha_seguimiento.includes("T") ? r.fecha_seguimiento : `${r.fecha_seguimiento}T09:00:00`,
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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const citasManana = useMemo(() => {
    if (!records) return [];
    return records.filter(r => {
      if (!r || !r.fecha_seguimiento) return false;
      const fechaLimpia = r.fecha_seguimiento.split("T")[0];
      const esArchivadoOCancelado = ["Archivado", "Visitado", "Cumplida", "Cancelada", "Cancelado"].includes(r.estado);
      return fechaLimpia === mananaISO && !esArchivadoOCancelado;
    });
  }, [records, mananaISO]);

  const citasHoyCount = useMemo(() => {
    if (!records) return 0;
    const hoyISO = todayISO();
    return records.filter(r => r && r.fecha_seguimiento && r.fecha_seguimiento.slice(0, 10) === hoyISO && !["Archivado", "Cumplida", "Cancelado"].includes(r.estado)).length;
  }, [records]);

  const buscados = useMemo(() => {
    if (!query.trim() || !records) return [];
    const q = query.trim().toLowerCase();
    return records.filter((r) => r && r.estado !== "Archivado" && (`${r.nombres || ""} ${r.apellidos || ""}`.toLowerCase().includes(q) || (r.id || "").toString().includes(q)));
  }, [query, records]);

  const todos = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => {
        if (!r) return false;
        if (filtroActivo === "ARCHIVADOS") return r.estado === "Archivado";
        if (!showArchived && r.estado === "Archivado") return false;

        if (filtroActivo === "PENDIENTES") return r.fecha_seguimiento && !["Visitado", "Cumplida", "Cancelado"].includes(r.estado);
        if (filtroActivo === "NO_LOCALIZADOS") return r.categoria_cliente === "No localizado" || r.estado === "No localizado";
        if (filtroActivo === "INTERESADOS") return ["Interesado", "En trámite"].includes(r.categoria_cliente || r.estado);
        if (filtroActivo === "NEGADOS") return r.categoria_cliente === "Negado";
        if (filtroActivo === "DOCS_FALTAN") return calcularProgresoCredito(r.documentos_json || {}) < 100;
        if (filtroActivo === "DOCS_COMPLETO") return calcularProgresoCredito(r.documentos_json || {}) === 100;
        return true;
      })
      .sort((a, b) => (b.fecha_creacion || "").localeCompare(a.fecha_creacion || ""));
  }, [records, showArchived, filtroActivo]);

  const alertas = useMemo(() => calcularAlertas(records, todayISO()), [records]);

  const crearCitaSimulada = async (payload) => {
    const clienteObj = records.find(r => r && r.id === payload.clienteId);
    if (!clienteObj) throw new Error("Cliente no encontrado en los registros.");
    await saveCliente({
      ...clienteObj,
      fecha_seguimiento: payload.fechaHora,
      observaciones: payload.notas || clienteObj.observaciones,
      estado: "Programada"
    }, false, user.id);
  };

  const posponerSimulado = async (citaOriginal, datosActualizados) => {
    const clienteId = citaOriginal?.id || citaOriginal?.clienteId || citaOriginal?.cliente?.id;
    const clienteObj = records.find(r => r && r.id === clienteId);
    
    if (!clienteObj) {
      alert("No se encontró el registro del cliente para actualizar.");
      return;
    }

    const textoObservacion = datosActualizados.observaciones || datosActualizados.notas || clienteObj.observaciones;

    const payloadLimpio = {
      fecha_seguimiento: datosActualizados.fecha_seguimiento || clienteObj.fecha_seguimiento,
      observaciones: textoObservacion,
      direccion: datosActualizados.direccion || clienteObj.direccion,
      estado: "Reprogramada"
    };

    await saveCliente({ 
      ...clienteObj, 
      ...payloadLimpio 
    }, false, user.id);
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

  const openEdit = (r) => { 
    setEditing(r); 
    setView("form"); 
  };
  
  const openNew = () => { 
    setEditing(undefined); 
    setView("form"); 
  };

  const handleRegistrarContacto = (cliente, tipo) => {
    const descripcion = tipo === "llamada" ? "Llamada telefónica iniciada desde la app." : "Mensaje de WhatsApp enviado desde la app.";
    registrarNovedad(cliente.id, tipo, descripcion, profile);
    
    const tel = cliente.telefono || cliente.whatsapp;
    if (tel) {
      if (tipo === "llamada") {
        window.location.href = `tel:${tel}`;
      } else if (tipo === "whatsapp") {
        window.open(`https://wa.me/57${tel.replace(/\D/g, "")}`, "_blank");
      }
    }
  };

  const handleChangeChecklist = async (nuevoChecklist) => {
    if (!docsCliente) return;
    try {
      const anterior = docsCliente.documentos_json || {};
      const saved = await actualizarCampos(docsCliente.id, { documentos_json: nuevoChecklist });
      setDocsCliente((prev) => (prev ? { ...prev, ...saved } : prev));

      const cambiado = Object.keys(nuevoChecklist).find((k) => !!nuevoChecklist[k] !== !!anterior[k]);
      if (cambiado) {
        const marcado = !!nuevoChecklist[cambiado];
        const etiqueta = DOCUMENTOS_CREDITO_DEFAULT.find((d) => d.id === cambiado)?.label || cambiado;
        registrarNovedad(docsCliente.id, "documento", `Documento "${etiqueta}" ${marcado ? "marcado como entregado" : "desmarcado"}.`, profile);
      }
    } catch (e) {
      alert("No se pudo guardar el checklist: " + e.message);
    }
  };

  const handleChangeEstadoCredito = async (nuevoEstado) => {
    if (!docsCliente) return;
    try {
      const saved = await actualizarCampos(docsCliente.id, { estado_credito: nuevoEstado });
      setDocsCliente((prev) => (prev ? { ...prev, ...saved } : prev));
      registrarNovedad(docsCliente.id, "credito", `Etapa del crédito actualizada a "${nuevoEstado}".`, profile);
    } catch (e) {
      alert("No se pudo actualizar la etapa del crédito: " + e.message);
    }
  };

  const handleSave = async (record, isNew) => {
    if (isNew && records.some((r) => r && r.id === record.id)) {
      alert("Ya existe un registro con esa cédula/NIT.");
      return;
    }
    const previo = !isNew ? editing : null;
    try {
      await saveCliente(record, isNew, user.id);

      if (isNew) {
        registrarNovedad(record.id, "creacion", `Registro creado por ${profile?.nombre || "un asesor"}.`, profile);
      } else if (previo) {
        if ((previo.estado || "") !== (record.estado || "")) {
          registrarNovedad(record.id, "estado", `Cambio de estado: ${previo.estado || "—"} → ${record.estado || "—"}.`, profile);
        }
        if ((previo.observaciones || "") !== (record.observaciones || "") && record.observaciones) {
          registrarNovedad(record.id, "nota", record.observaciones, profile);
        }
      }

      setEditing(undefined);
      setView("todos");
    } catch (e) {
      alert("No se pudo guardar el registro: " + e.message);
    }
  };

  const handleArchive = (r) => setConfirmTarget({ type: "archive", record: r });
  
  // NUEVA FUNCIÓN: Para desarchivar un cliente y devolverlo a Pendiente / En trámite
  const handleUnarchive = async (r) => {
    try {
      await actualizarCampos(r.id, { estado: "Pendiente" });
      registrarNovedad(r.id, "desarchivado", `Cliente desarchivado por ${profile?.nombre || "un asesor"}.`, profile);
    } catch (e) {
      alert("No se pudo desarchivar el registro: " + e.message);
    }
  };

  const handleDelete = (r) => setConfirmTarget({ type: "delete", record: r });

  const confirmAction = async () => {
    if (!confirmTarget) return;
    const { type, record } = confirmTarget;
    try {
      if (type === "archive") {
        await archivar(record.id);
        registrarNovedad(record.id, "archivado", `Cliente archivado por ${profile?.nombre || "un asesor"}.`, profile);
      } else {
        await eliminar(record.id);
      }
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

          {alertas.total > 0 && (
            <div
              onClick={() => setShowAlertas(true)}
              style={{
                background: "rgba(76, 5, 25, 0.85)",
                border: "1.5px solid #f43f5e",
                color: "#fecdd3",
                padding: "14px 18px",
                borderRadius: 14,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ background: "#f43f5e", color: "#fff", padding: 8, borderRadius: "50%", display: "flex" }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14, color: "#fff" }}>
                  Centro de alertas: {alertas.total} caso{alertas.total === 1 ? "" : "s"} necesitan tu atención - Toca para ver
                </strong>
                <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.85 }}>
                  Seguimientos retrasados, documentos estancados y créditos en estudio sin respuesta.
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
              <MapaView records={records} onEdit={openEdit} onOpenDocs={setDocsCliente} onOpenHistorial={setHistorialCliente} onRegistrarContacto={handleRegistrarContacto} />
            </>
          )}

          {view === "form" && (
            <FormView
              initialData={editing}
              onSave={handleSave}
              onCancel={() => { setEditing(undefined); setView("todos"); }}
            />
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
                <ClientCard key={r.id} r={r} onEdit={openEdit} onArchive={handleArchive} onDelete={handleDelete} onOpenDocs={setDocsCliente} onOpenHistorial={setHistorialCliente} onRegistrarContacto={handleRegistrarContacto} canDelete={profile?.rol === "admin"} profile={profile || {}} />
              ))}
            </>
          )}

          {view === "todos" && (
            <>
              <div style={{ color: "#ffffff", marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Base de datos de créditos</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "4px 0 0 0" }}>{todos.length} registros en este filtro</p>
              </div>
              
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                <FiltroChip active={filtroActivo === "TODOS"} onClick={() => setFiltroActivo("TODOS")} label="Todos" />
                <FiltroChip active={filtroActivo === "PENDIENTES"} onClick={() => setFiltroActivo("PENDIENTES")} label="📅 Con fecha / Pendientes" />
                <FiltroChip active={filtroActivo === "NO_LOCALIZADOS"} onClick={() => setFiltroActivo("NO_LOCALIZADOS")} label="❌ No localizados" />
                <FiltroChip active={filtroActivo === "INTERESADOS"} onClick={() => setFiltroActivo("INTERESADOS")} label="⭐ Interesados / En trámite" />
                <FiltroChip active={filtroActivo === "NEGADOS"} onClick={() => setFiltroActivo("NEGADOS")} label="🚫 Negados" />
                <FiltroChip active={filtroActivo === "DOCS_FALTAN"} onClick={() => setFiltroActivo("DOCS_FALTAN")} label="🗂️ Faltan documentos" />
                <FiltroChip active={filtroActivo === "DOCS_COMPLETO"} onClick={() => setFiltroActivo("DOCS_COMPLETO")} label="✅ Expediente completo" />
                <FiltroChip active={filtroActivo === "ARCHIVADOS"} onClick={() => setFiltroActivo("ARCHIVADOS")} label="📂 Archivados" />
              </div>

              {todos.length === 0 ? (
                <EmptyState text="No hay registros en este filtro." />
              ) : (
                todos.map((r) => (
                  <div key={r.id} style={{ position: "relative", marginBottom: 12 }}>
                    <ClientCard 
                      r={r} 
                      onEdit={openEdit} 
                      onArchive={handleArchive} 
                      onDelete={handleDelete} 
                      onOpenDocs={setDocsCliente} 
                      onOpenHistorial={setHistorialCliente} 
                      onRegistrarContacto={handleRegistrarContacto} 
                      canDelete={profile?.rol === "admin"} 
                      profile={profile || {}} 
                    />
                    {/* Botón flotante para desarchivar si el cliente está archivado */}
                    {r.estado === "Archivado" && (
                      <button
                        onClick={() => handleUnarchive(r)}
                        style={{
                          position: "absolute",
                          bottom: 16,
                          right: 60,
                          background: "#059669",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          zIndex: 5
                        }}
                        title="Desarchivar cliente"
                      >
                        <ArchiveRestore size={14} /> Desarchivar
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <BottomNav view={view} setView={setView} citasHoyCount={citasHoyCount} onNew={openNew} />
      </div>

      {docsCliente && (
        <DocumentosModal
          cliente={docsCliente}
          onClose={() => setDocsCliente(null)}
          onUpdateChecklist={handleChangeChecklist}
          onUpdateEstadoCredito={handleChangeEstadoCredito}
        />
      )}

      {showAlertas && (
        <AlertasModal
          alertas={alertas}
          onClose={() => setShowAlertas(false)}
          onEdit={openEdit}
        />
      )}

      {historialCliente && (
        <HistorialClienteModal
          cliente={historialCliente}
          onClose={() => setHistorialCliente(null)}
        />
      )}

      {showMananaModal && (
        <div onClick={() => setShowMananaModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1e1035", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 600, color: "#fff", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Visitas programadas para mañana ({mananaISO})</h3>
              <button onClick={() => setShowMananaModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {citasManana.map(r => {
                const progreso = calcularProgresoCredito(r.documentos_json || {});
                return (
                  <div key={r.id || r.cedula} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: 14, borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{r.nombres} {r.apellidos}</div>
                        <div style={{ fontSize: 13, opacity: 0.8 }}>CC/NIT: {r.id || r.cedula || "No especificada"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ background: ["Cancelado", "Cancelada", "Archivado"].includes(r.estado) ? "rgba(244,63,94,0.2)" : "rgba(34,197,94,0.2)", color: ["Cancelado", "Cancelada", "Archivado"].includes(r.estado) ? "#fca5a5" : "#86efac", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {r.estado || "Pendiente"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12.5, opacity: 0.9 }}>
                      <div><strong>Profesión / Tipo:</strong> {r.tipo_negocio || r.profesion || "No especificado"}</div>
                      <div><strong>Crédito:</strong> {r.estado_credito || "— Sin definir —"} ({progreso}%)</div>
                      <div style={{ gridColumn: "span 2" }}><strong>Dirección:</strong> {r.direccion || "Sin dirección"}</div>
                      <div style={{ gridColumn: "span 2" }}><strong>Fecha Seguimiento:</strong> {r.fecha_seguimiento || "No asignada"}</div>
                    </div>

                    {r.observaciones && (
                      <div style={{ fontSize: 12, background: "rgba(0,0,0,0.25)", padding: 8, borderRadius: 8, fontStyle: "italic", opacity: 0.85 }}>
                        <strong>Nota:</strong> {r.observaciones}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
                      <button title="Llamar" onClick={() => handleRegistrarContacto(r, "llamada")} style={{ background: "#059669", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <PhoneCall size={14} /> Llamar
                      </button>
                      <button title="WhatsApp" onClick={() => handleRegistrarContacto(r, "whatsapp")} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <MessageSquareText size={14} /> WhatsApp
                      </button>
                      <button title="Documentos del Crédito" onClick={() => { setShowMananaModal(false); setDocsCliente(r); }} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <FileText size={14} /> Docs
                      </button>
                      <button title="Historial" onClick={() => { setShowMananaModal(false); setHistorialCliente(r); }} style={{ background: "#d97706", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <History size={14} /> Historial
                      </button>
                      <button title="Editar" onClick={() => { setShowMananaModal(false); openEdit(r); }} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <PencilLine size={14} /> Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.type === "archive" ? "¿Archivar cliente?" : "¿Eliminar registro permanentemente?"}
          message={confirmTarget.type === "archive" ? `El cliente ${confirmTarget.record.nombres} pasará a la papelera o archivo.` : `Esta acción no se puede deshacer. Se borrarán los datos de ${confirmTarget.record.nombres}.`}
          onConfirm={confirmAction}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}