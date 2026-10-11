import { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Search,
  CalendarDays,
  Building2,
  CheckCircle2,
  Clock,
  Printer
} from "lucide-react";
import { getServiciosSoporte } from "../../services/soporteService";
import { generarExcelCuentaCobro, descargarExcelEnNavegador } from "../../services/excelService";
import { numeroALetras, formatearMonedaCOP } from "../../utils/numeroALetras";

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function VistaProveedorReadOnly({ theme = "light" }) {
  const isDark = theme === "dark";

  // Parámetros de la URL
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const proveedorParam = params.get("prov") || params.get("proveedor") || "R&S Soluciones";
  const mesParam = params.get("mes"); // número o "todos"
  const anioParam = params.get("anio"); // número o "todos"
  const rawPayload = params.get("data");

  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState(
    mesParam ? (mesParam === "todos" ? "todos" : Number(mesParam)) : "todos"
  );
  const [filtroAnio, setFiltroAnio] = useState(
    anioParam ? (anioParam === "todos" ? "todos" : Number(anioParam)) : "todos"
  );
  const [exportandoExcel, setExportandoExcel] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setLoading(true);
      try {
        // Si viene snapshot comprimido en la URL
        if (rawPayload) {
          try {
            const parsed = JSON.parse(decodeURIComponent(escape(atob(rawPayload))));
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (!cancelado) {
                setServicios(parsed);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn("No se pudo decodificar snapshot en URL:", e);
          }
        }

        // Cargar desde Supabase o almacenamiento local
        const data = await getServiciosSoporte();
        if (!cancelado) {
          setServicios(data || []);
        }
      } catch (err) {
        console.error("Error cargando servicios para vista de proveedor:", err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [rawPayload]);

  // Helper de extracción de mes y año
  const extraerMesAnio = (s) => {
    const fechas = [s.fecha_atencion, s.fecha_solicitud, s.fecha_finalizacion];
    for (const f of fechas) {
      if (!f || typeof f !== "string") continue;
      const fTrim = f.trim();
      const mYMD = fTrim.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (mYMD) return { mes: parseInt(mYMD[2], 10), anio: parseInt(mYMD[1], 10) };
      const mDMY = fTrim.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (mDMY) return { mes: parseInt(mDMY[2], 10), anio: parseInt(mDMY[3], 10) };
    }
    if (s.creado_en) {
      const d = new Date(s.creado_en);
      if (!isNaN(d.getTime())) return { mes: d.getMonth() + 1, anio: d.getFullYear() };
    }
    return null;
  };

  // Filtrado estricto: solo el proveedor solicitado (o todos si no se especificó)
  const serviciosProveedor = useMemo(() => {
    return servicios.filter((s) => {
      if (proveedorParam && proveedorParam !== "todos") {
        const provServ = (s.proveedor || "").trim().toLowerCase();
        const provBuscado = proveedorParam.trim().toLowerCase();
        if (provServ !== provBuscado && !provServ.includes(provBuscado) && !provBuscado.includes(provServ)) {
          return false;
        }
      }
      return true;
    });
  }, [servicios, proveedorParam]);

  // Años disponibles en los servicios del proveedor
  const aniosDisponibles = useMemo(() => {
    const years = new Set([
      new Date().getFullYear(),
      ...serviciosProveedor.map((s) => extraerMesAnio(s)?.anio).filter(Boolean)
    ]);
    return Array.from(years).sort((a, b) => b - a);
  }, [serviciosProveedor]);

  // Filtrado final por periodo y búsqueda
  const serviciosFiltrados = useMemo(() => {
    return serviciosProveedor.filter((s) => {
      // 1. Búsqueda por número de caso
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const caso = String(s.numero_caso || "").toLowerCase();
        if (!caso.includes(q)) return false;
      }

      // 2. Filtrado por mes y año
      if (filtroMes === "todos" && filtroAnio === "todos") return true;

      const info = extraerMesAnio(s);
      if (!info) return false;

      if (filtroAnio !== "todos" && info.anio !== Number(filtroAnio)) {
        return false;
      }
      if (filtroMes !== "todos" && info.mes !== Number(filtroMes)) {
        return false;
      }

      return true;
    });
  }, [serviciosProveedor, busqueda, filtroMes, filtroAnio]);

  // Cálculos de liquidación
  const totalServicios = serviciosFiltrados.reduce((acc, s) => acc + (Number(s.valor_servicios) || 0), 0);
  const totalViaticos = serviciosFiltrados.reduce((acc, s) => acc + (Number(s.valor_viaticos) || 0), 0);
  const totalMateriales = serviciosFiltrados.reduce((acc, s) => acc + (Number(s.valor_materiales) || 0), 0);
  const granTotal = totalServicios + totalViaticos + totalMateriales;
  const textoEnLetras = numeroALetras(granTotal);

  const periodoTexto = filtroMes === "todos"
    ? (filtroAnio === "todos" ? "Consolidado Histórico" : `Año ${filtroAnio}`)
    : `${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio === "todos" ? "" : filtroAnio}`;

  const handleDescargarExcel = async () => {
    if (serviciosFiltrados.length === 0) return;
    try {
      setExportandoExcel(true);
      const buffer = await generarExcelCuentaCobro({
        servicios: serviciosFiltrados,
        mes: filtroMes === "todos" ? "Historico" : NOMBRES_MESES[filtroMes - 1],
        anio: filtroAnio === "todos" ? "Todos" : filtroAnio,
        proveedor: proveedorParam !== "todos" ? proveedorParam : "General"
      });
      const nombreArchivo = `Cuenta_de_Cobro_${proveedorParam}_${periodoTexto.replace(/\s+/g, "_")}.xlsx`;
      descargarExcelEnNavegador(buffer, nombreArchivo);
    } catch (err) {
      alert("Error al descargar Excel: " + err.message);
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#090d16" : "#f8fafc",
        color: isDark ? "#f1f5f9" : "#0f172a",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px 16px 60px"
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Barra superior de auditoría oficial */}
        <header
          style={{
            background: isDark ? "rgba(15, 23, 42, 0.85)" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0284c7", fontWeight: 700 }}>
                Portal Oficial de Liquidación · ENTER Ltda.
              </div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                Auditoría de Servicios: {proveedorParam}
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
                border: "1px solid #86efac",
                color: isDark ? "#6ee7b7" : "#166534",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              <ShieldCheck size={15} />
              <span>Vista Proveedor (Solo Lectura)</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                color: isDark ? "#f1f5f9" : "#334155",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Printer size={14} /> Imprimir / PDF
            </button>
          </div>
        </header>

        {/* Resumen Oficial de Cuenta de Cobro */}
        <section
          style={{
            background: isDark ? "#0f172a" : "#ffffff",
            border: isDark ? "1.5px solid rgba(19, 94, 107, 0.8)" : "1.5px solid #cbd5e1",
            borderRadius: 18,
            padding: 24,
            boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.5)" : "0 4px 18px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Formato de Cuenta de Cobro Oficial · {periodoTexto}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                DEBE A: Jhon Alexander Vasquez Reveló
              </div>
              <div style={{ fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", color: "#0284c7", marginTop: 2 }}>
                C.C. 10308105
              </div>
            </div>

            <button
              type="button"
              disabled={exportandoExcel || serviciosFiltrados.length === 0}
              onClick={handleDescargarExcel}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                color: "#ffffff",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: exportandoExcel || serviciosFiltrados.length === 0 ? "not-allowed" : "pointer",
                opacity: serviciosFiltrados.length === 0 ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)"
              }}
            >
              <Download size={17} />
              <span>
                {exportandoExcel ? "Generando..." : `Descargar Excel Oficial (.xlsx)`}
              </span>
            </button>
          </div>

          {/* Cuadro de Liquidación en Letras y Valores */}
          <div
            style={{
              background: isDark ? "rgba(19, 94, 107, 0.25)" : "#f0fdf4",
              border: isDark ? "1.5px solid #135E6B" : "1.5px solid #86efac",
              borderRadius: 14,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                LA SUMA DE:
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#6ee7b7" : "#059669", marginTop: 3 }}>
                {textoEnLetras})
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                SON (TOTAL {periodoTexto.toUpperCase()}):
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#ffffff" : "#0f172a" }}>
                {formatearMonedaCOP(granTotal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                CONCEPTO:
              </div>
              <div style={{ fontSize: 12.5, color: isDark ? "#cbd5e1" : "#475569" }}>
                PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO EN SITIO
              </div>
            </div>
          </div>
        </section>

        {/* Barra de Filtros y Búsqueda */}
        <section
          style={{
            background: isDark ? "#0f172a" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Selector de Año */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b" }}>Año:</span>
              <select
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                style={{
                  background: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12.5,
                  fontWeight: 600
                }}
              >
                <option value="todos">Todos los años</option>
                {aniosDisponibles.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Selector de Mes */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b" }}>Mes:</span>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                style={{
                  background: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12.5,
                  fontWeight: 600
                }}
              >
                <option value="todos">Todos los meses</option>
                {NOMBRES_MESES.map((nom, idx) => (
                  <option key={idx + 1} value={idx + 1}>{nom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buscador de Caso */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={14} style={{ position: "absolute", left: 10, color: "#94a3b8", pointerEvents: "none" }} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° de Caso..."
              style={{
                background: isDark ? "#1e293b" : "#f8fafc",
                border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                color: isDark ? "#f1f5f9" : "#0f172a",
                borderRadius: 8,
                padding: "6px 12px 6px 30px",
                fontSize: 12.5,
                outline: "none",
                width: 220
              }}
            />
          </div>
        </section>

        {/* Tabla de Servicios para Auditoría */}
        <section
          style={{
            background: isDark ? "#0f172a" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 20,
            overflowX: "auto",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 14px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Detalle de Servicios Inyectados ({serviciosFiltrados.length} registros para {proveedorParam})
            </h2>
            <span style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>
              Mostrando únicamente los servicios liquidados para auditar por la entidad.
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              Cargando servicios de liquidación...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980, fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#135E6B", color: "#ffffff", textAlign: "center" }}>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>N° de Caso</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha solicitud</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha Atención</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha finalización</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Mesa</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Proveedor / Entidad</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Cliente</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Coordinador</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Valor servicios</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Viáticos</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Materiales</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                      No hay servicios registrados para este periodo o búsqueda.
                    </td>
                  </tr>
                ) : (
                  serviciosFiltrados.map((s, idx) => {
                    const info = extraerMesAnio(s);
                    const esAnioAnterior = info && info.anio < new Date().getFullYear();

                    return (
                      <tr
                        key={s.id || idx}
                        style={{
                          background: idx % 2 === 0 ? (isDark ? "rgba(255,255,255,0.02)" : "#ffffff") : (isDark ? "rgba(255,255,255,0.04)" : "#f8fafc"),
                          textAlign: "center"
                        }}
                      >
                        <td style={{ padding: "9px 8px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.numero_caso || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.fecha_solicitud || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <span>{s.fecha_atencion || "-"}</span>
                            {esAnioAnterior && (
                              <span style={{ fontSize: 9.5, background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d", borderRadius: 4, padding: "1px 4px", fontWeight: 700 }}>
                                {info.anio}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.fecha_finalizacion || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.mesa || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", fontWeight: 600, color: "#0284c7", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.proveedor || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.cliente || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.coordinador || "-"}
                        </td>
                        <td style={{ padding: "9px 8px", fontWeight: 700, color: "#059669", fontFamily: "'IBM Plex Mono', monospace", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {formatearMonedaCOP(s.valor_servicios || 0)}
                        </td>
                        <td style={{ padding: "9px 8px", fontFamily: "'IBM Plex Mono', monospace", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.valor_viaticos ? formatearMonedaCOP(s.valor_viaticos) : "$ -"}
                        </td>
                        <td style={{ padding: "9px 8px", fontFamily: "'IBM Plex Mono', monospace", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          {s.valor_materiales ? formatearMonedaCOP(s.valor_materiales) : "$ -"}
                        </td>
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                          <span
                            style={{
                              display: "inline-block",
                              background: isDark ? "rgba(16,185,129,0.2)" : "#dcfce7",
                              color: isDark ? "#6ee7b7" : "#166534",
                              border: "1px solid #86efac",
                              borderRadius: 12,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            ✓ Auditado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: isDark ? "#1e293b" : "#f1f5f9", fontWeight: 800 }}>
                  <td colSpan={8} style={{ padding: "12px 10px", textAlign: "right", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1" }}>
                    TOTAL CUENTA DE COBRO ({periodoTexto.toUpperCase()}):
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#059669", fontFamily: "'IBM Plex Mono', monospace", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1" }}>
                    {formatearMonedaCOP(totalServicios)}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1" }}>
                    {totalViaticos ? formatearMonedaCOP(totalViaticos) : "$ -"}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1" }}>
                    {totalMateriales ? formatearMonedaCOP(totalMateriales) : "$ -"}
                  </td>
                  <td style={{ border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1" }}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* Pie de página con sello de seguridad */}
        <footer style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
          Documento generado por <strong>ENTER Ltda.</strong> para efectos de auditoría y revisión de cuentas de cobro.
          <br />Modo Solo Lectura Verificado · Prohibida la alteración de datos de liquidación.
        </footer>
      </div>
    </div>
  );
}
