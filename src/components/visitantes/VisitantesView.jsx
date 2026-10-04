import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Laptop,
  Building,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Download,
  Filter
} from "lucide-react";

const VISITANTES_STORAGE_KEY = "interred_visitantes_data_v1";

const visitantesIniciales = [
  {
    id: "vis-001",
    nombre: "Carlos Eduardo Méndez",
    documento: "1018456920",
    tipoDoc: "CC",
    empresa: "Claro Telecomunicaciones",
    telefono: "3114567890",
    sede: "Sede Principal - Bogotá",
    departamento: "Sistemas & Soporte",
    responsable: "Jhon Alexander Vásquez",
    motivo: "Mantenimiento preventivo en rack de comunicaciones",
    carnet: "CAR-042",
    equipos: "Portátil Lenovo ThinkPad (SN: MP19XZA4)",
    horaIngreso: "08:15 AM",
    fechaIngreso: "2026-10-03",
    horaSalida: null,
    estado: "En instalaciones" // "En instalaciones" | "Salida registrada"
  },
  {
    id: "vis-002",
    nombre: "María Fernanda Ospina",
    documento: "52890123",
    tipoDoc: "CC",
    empresa: "Auditorías Contables Del Valle",
    telefono: "3156789012",
    sede: "Sede Principal - Bogotá",
    departamento: "Financiero & Contable",
    responsable: "Sandra Lorena Vásquez",
    motivo: "Revisión de estados de cartera y simuladores",
    carnet: "CAR-015",
    equipos: "Portátil HP ProBook (SN: 5CD8421)",
    horaIngreso: "09:30 AM",
    fechaIngreso: "2026-10-03",
    horaSalida: null,
    estado: "En instalaciones"
  },
  {
    id: "vis-003",
    nombre: "Alejandro Restrepo Gómez",
    documento: "98765432",
    tipoDoc: "CC",
    empresa: "FibraRed Antioquia",
    telefono: "3001234567",
    sede: "Sede Regional Medellín",
    departamento: "Infraestructura & Redes",
    responsable: "Ing. Soporte Medellín",
    motivo: "Fusión de hilos de fibra óptica troncal",
    carnet: "CAR-M08",
    equipos: "Fusionadora de Fibra Fujikura 70S + OTDR",
    horaIngreso: "07:45 AM",
    fechaIngreso: "2026-10-03",
    horaSalida: "11:20 AM",
    estado: "Salida registrada"
  },
  {
    id: "vis-004",
    nombre: "Diana Marcela Ortiz",
    documento: "1032489650",
    tipoDoc: "CC",
    empresa: "Superintendencia Financiera",
    telefono: "3209876543",
    sede: "Sede Regional Cali",
    departamento: "Administración & Gerencia",
    responsable: "Coordinador Cali",
    motivo: "Inspección regulatoria y validación de tasas",
    carnet: "CAR-C02",
    equipos: "Tablet iPad Pro (SN: DMPR899L)",
    horaIngreso: "10:00 AM",
    fechaIngreso: "2026-10-03",
    horaSalida: null,
    estado: "En instalaciones"
  }
];

export default function VisitantesView({ theme = "light" }) {
  const isDark = theme === "dark";

  const [visitantes, setVisitantes] = useState(() => {
    try {
      const guardado = localStorage.getItem(VISITANTES_STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : visitantesIniciales;
    } catch {
      return visitantesIniciales;
    }
  });

  const [filtroSede, setFiltroSede] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [showModalRegistro, setShowModalRegistro] = useState(false);

  // Formulario de nuevo ingreso
  const [nuevo, setNuevo] = useState({
    nombre: "",
    documento: "",
    tipoDoc: "CC",
    empresa: "",
    telefono: "",
    sede: "Sede Principal - Bogotá",
    departamento: "Sistemas & Soporte",
    responsable: "",
    motivo: "",
    carnet: "",
    equipos: ""
  });

  useEffect(() => {
    try {
      localStorage.setItem(VISITANTES_STORAGE_KEY, JSON.stringify(visitantes));
    } catch (e) {
      console.warn("Error guardando visitantes:", e);
    }
  }, [visitantes]);

  // Contadores
  const enInstalacionesCount = visitantes.filter(v => v.estado === "En instalaciones").length;
  const salidasHoyCount = visitantes.filter(v => v.estado === "Salida registrada").length;
  const totalHoyCount = visitantes.length;

  const visitantesFiltrados = visitantes.filter(v => {
    const coincideSede = filtroSede === "TODAS" || v.sede.includes(filtroSede);
    const coincideEstado = filtroEstado === "TODOS" || v.estado === filtroEstado;
    const q = busqueda.toLowerCase().trim();
    const coincideBusqueda = !q || (
      v.nombre.toLowerCase().includes(q) ||
      v.documento.includes(q) ||
      v.empresa.toLowerCase().includes(q) ||
      (v.carnet && v.carnet.toLowerCase().includes(q))
    );
    return coincideSede && coincideEstado && coincideBusqueda;
  });

  const registrarSalida = (id) => {
    const ahora = new Date();
    const horaSalida = ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });

    setVisitantes(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          estado: "Salida registrada",
          horaSalida
        };
      }
      return v;
    }));
  };

  const handleCrearVisitante = (e) => {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.documento || !nuevo.empresa) {
      alert("Por favor completa los datos obligatorios del visitante");
      return;
    }

    const ahora = new Date();
    const horaIngreso = ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
    const fechaIngreso = ahora.toISOString().split("T")[0];

    const item = {
      id: `vis-${Date.now()}`,
      ...nuevo,
      carnet: nuevo.carnet || `CAR-${Math.floor(10 + Math.random() * 90)}`,
      horaIngreso,
      fechaIngreso,
      horaSalida: null,
      estado: "En instalaciones"
    };

    setVisitantes([item, ...visitantes]);
    setNuevo({
      nombre: "",
      documento: "",
      tipoDoc: "CC",
      empresa: "",
      telefono: "",
      sede: "Sede Principal - Bogotá",
      departamento: "Sistemas & Soporte",
      responsable: "",
      motivo: "",
      carnet: "",
      equipos: ""
    });
    setShowModalRegistro(false);
  };

  const exportarReporte = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Nombre,Documento,Empresa,Sede,Departamento,Responsable,Carnet,Equipos,Ingreso,Salida,Estado"]
      .concat(visitantes.map(v => 
        `"${v.id}","${v.nombre}","${v.tipoDoc} ${v.documento}","${v.empresa}","${v.sede}","${v.departamento}","${v.responsable}","${v.carnet}","${v.equipos || 'Sin equipos'}","${v.horaIngreso}","${v.horaSalida || 'Pendiente'}","${v.estado}"`
      )).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Visitantes_Interred_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-12">
      {/* CABECERA CON GLASSMORFISM */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-2xl ${
        isDark ? "bg-slate-900/70 border-white/10 text-white" : "bg-white/80 border-slate-200 text-slate-900 shadow-slate-200/50"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
              <Users size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Seguridad Física & Accesos
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  RECEPCIÓN ACTIVA
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
                Control de Visitantes & Accesos · Interred Ltda.
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Registro y trazabilidad de ingresos en las sedes corporativas, asignación de carné y control de activos portátiles (SENA GA6-220501106-AA1).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={exportarReporte}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200" : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
              }`}
            >
              <Download size={15} />
              <span>Exportar Bitácora</span>
            </button>

            <button
              onClick={() => setShowModalRegistro(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-500/25"
            >
              <Plus size={16} />
              <span>Registrar Visitante</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICAS DE RESUMEN (Estilo SaaS Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: En instalaciones — Emerald */}
        <div className="relative p-5 rounded-2xl border backdrop-blur-xl transition-all overflow-hidden bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-emerald-900/30 border-emerald-500/40 shadow-lg shadow-emerald-900/20 text-white">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400/80">Actualmente en Sedes</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-300 drop-shadow-sm">{enInstalacionesCount}</div>
          <div className="text-xs text-emerald-400/70 mt-1 font-medium">Visitantes con permanencia activa</div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        </div>

        {/* KPI 2: Salidas registradas — Blue */}
        <div className="relative p-5 rounded-2xl border backdrop-blur-xl transition-all overflow-hidden bg-gradient-to-br from-blue-950/60 via-slate-900/90 to-blue-900/30 border-blue-500/40 shadow-lg shadow-blue-900/20 text-white">
          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-blue-400/80">Salidas Completadas</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <LogOut size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-300 drop-shadow-sm">{salidasHoyCount}</div>
          <div className="text-xs text-blue-400/70 mt-1 font-medium">Con carné y equipos devueltos</div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        </div>

        {/* KPI 3: Total del día — Purple */}
        <div className="relative p-5 rounded-2xl border backdrop-blur-xl transition-all overflow-hidden bg-gradient-to-br from-purple-950/60 via-slate-900/90 to-purple-900/30 border-purple-500/40 shadow-lg shadow-purple-900/20 text-white">
          <div className="absolute inset-0 bg-purple-500/5 rounded-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-purple-400/80">Flujo Total Registrado</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-300 drop-shadow-sm">{totalHoyCount}</div>
          <div className="text-xs text-purple-400/70 mt-1 font-medium">Ingresos monitoreados por seguridad</div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className={`p-5 rounded-2xl border backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 ${
        isDark ? "bg-slate-900/60 border-white/10" : "bg-white/80 border-slate-200"
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-2">
            <Filter size={14} />
            <span>Sede:</span>
          </div>
          {["TODAS", "Bogotá", "Medellín", "Cali"].map((s) => (
            <button
              key={s}
              onClick={() => setFiltroSede(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroSede === s
                  ? "bg-orange-500 text-white shadow-sm"
                  : isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {s === "TODAS" ? "Todas las Sedes" : s}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-500/20 mx-2 hidden sm:block" />

          {["TODOS", "En instalaciones", "Salida registrada"].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroEstado === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula o nombre…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border outline-none transition ${
              isDark 
                ? "bg-slate-950/60 border-white/10 text-white focus:border-orange-500" 
                : "bg-slate-50 border-slate-300 text-slate-800 focus:border-orange-500"
            }`}
          />
        </div>
      </div>

      {/* LISTADO DE TARJETAS DE VISITANTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visitantesFiltrados.length === 0 ? (
          <div className={`col-span-2 p-12 text-center rounded-2xl border ${
            isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-500"
          }`}>
            <UserX size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No se encontraron visitantes con los filtros actuales.</p>
          </div>
        ) : (
          visitantesFiltrados.map((v) => (
            <div
              key={v.id}
              className={`p-5 rounded-2xl border backdrop-blur-xl transition-all shadow-md flex flex-col justify-between ${
                isDark 
                  ? "bg-slate-900/60 border-white/10 hover:border-white/20 text-white" 
                  : "bg-white/90 border-slate-200 hover:border-slate-300 text-slate-900"
              }`}
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{v.nombre}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-500/10 font-mono text-slate-400">
                        {v.tipoDoc} {v.documento}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-orange-400 mt-0.5">
                      {v.empresa}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                    v.estado === "En instalaciones"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.estado === "En instalaciones" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                    {v.estado}
                  </span>
                </div>

                {/* Detalles en Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-500/10 mb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sede & Área</span>
                    <span className="font-medium truncate block">{v.sede.split(" - ")[1] || v.sede} · {v.departamento}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsable / Anfitrión</span>
                    <span className="font-medium truncate block">{v.responsable}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hora Ingreso</span>
                    <span className="font-mono font-semibold text-emerald-400">{v.horaIngreso} ({v.fechaIngreso})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Carné Asignado</span>
                    <span className="font-mono font-bold text-purple-400">{v.carnet}</span>
                  </div>
                </div>

                {/* Motivo y Equipos */}
                <div className="space-y-1.5 text-xs mb-4">
                  <div className="text-slate-400">
                    <strong className={isDark ? "text-slate-300" : "text-slate-700"}>Motivo:</strong> {v.motivo}
                  </div>
                  {v.equipos && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                      <Laptop size={14} className="shrink-0" />
                      <span className="truncate"><strong>Activos portátiles:</strong> {v.equipos}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de acción */}
              <div className="pt-2 border-t border-slate-500/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {v.horaSalida ? `Salida registrada: ${v.horaSalida}` : "Permanencia autorizada"}
                </span>

                {v.estado === "En instalaciones" && (
                  <button
                    onClick={() => registrarSalida(v.id)}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <LogOut size={13} />
                    <span>Registrar Salida</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE REGISTRO DE NUEVO VISITANTE */}
      {showModalRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? "bg-slate-900 border-white/20 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between border-b border-slate-500/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-400" />
                <h3 className="font-bold text-base">Registrar Nuevo Visitante · Interred Ltda.</h3>
              </div>
              <button
                onClick={() => setShowModalRegistro(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearVisitante} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Tipo Doc</label>
                  <select
                    value={nuevo.tipoDoc}
                    onChange={(e) => setNuevo({ ...nuevo, tipoDoc: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="CC">C.C.</option>
                    <option value="CE">C.E.</option>
                    <option value="PAS">Pasaporte</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Número de Identificación</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1018456920"
                    value={nuevo.documento}
                    onChange={(e) => setNuevo({ ...nuevo, documento: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Sofía Mendoza Gómez"
                  value={nuevo.nombre}
                  onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Empresa / Entidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cisco Systems Colombia"
                    value={nuevo.empresa}
                    onChange={(e) => setNuevo({ ...nuevo, empresa: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Teléfono Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: 3105557788"
                    value={nuevo.telefono}
                    onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Sede Destino</label>
                  <select
                    value={nuevo.sede}
                    onChange={(e) => setNuevo({ ...nuevo, sede: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="Sede Principal - Bogotá">Sede Principal - Bogotá</option>
                    <option value="Sede Regional Medellín">Sede Regional Medellín</option>
                    <option value="Sede Regional Cali">Sede Regional Cali</option>
                    <option value="Sede Caribe - Barranquilla">Sede Caribe - Barranquilla</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Departamento a Visitar</label>
                  <select
                    value={nuevo.departamento}
                    onChange={(e) => setNuevo({ ...nuevo, departamento: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="Sistemas & Soporte">Sistemas & Soporte</option>
                    <option value="Infraestructura & Redes">Infraestructura & Redes</option>
                    <option value="Financiero & Contable">Financiero & Contable</option>
                    <option value="Administración & Gerencia">Administración & Gerencia</option>
                    <option value="Comercial & Clientes">Comercial & Clientes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Funcionario Anfitrión</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ing. Sandra Lorena Vásquez"
                    value={nuevo.responsable}
                    onChange={(e) => setNuevo({ ...nuevo, responsable: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Carné Asignado (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Autogenerado o ej: CAR-088"
                    value={nuevo.carnet}
                    onChange={(e) => setNuevo({ ...nuevo, carnet: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">Motivo de la Visita</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantenimiento de servidores / Auditoría contable"
                  value={nuevo.motivo}
                  onChange={(e) => setNuevo({ ...nuevo, motivo: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">
                  Equipos Tecnológicos Portátiles (Marca y Serial)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Dell Latitude 5420 (SN: 9K7W213)"
                  value={nuevo.equipos}
                  onChange={(e) => setNuevo({ ...nuevo, equipos: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModalRegistro(false)}
                  className="px-4 py-2 rounded-xl border border-slate-500/20 hover:bg-white/5 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md"
                >
                  Guardar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
