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
  Printer,
  Eye,
  X,
  Copy,
  Check,
  Image as ImageIcon,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from "lucide-react";
import { getServiciosSoporte, normalizarServicioUnificado } from "../../services/soporteService";
import { supabase } from "../../services/supabaseClient";
import { generarExcelCuentaCobro, descargarExcelEnNavegador } from "../../services/excelService";
import { numeroALetras, formatearMonedaCOP } from "../../utils/numeroALetras";

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function VistaProveedorReadOnly({ theme = "light" }) {
  // FORZAR TEMA CLARO INSTITUCIONAL (FONDO BLANCO):
  // Elimina cualquier herencia de modo oscuro en la vista compartida.
  // Garantiza que la página pública siempre se visualice con fondo blanco y texto oscuro en cualquier dispositivo o móvil.
  const isDark = false;

  // ── Parámetros de la URL ─────────────────────────────────────────────────────
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const _provRaw = params.get("prov") || params.get("proveedor") || "";

  // Mapa de slugs conocidos a nombres canónicos
  const SLUG_MAP = {
    "rs-soluciones": "R&S Soluciones",
    "r-s-soluciones": "R&S Soluciones",
    "rssoluciones": "R&S Soluciones",
    "rys-soluciones": "R&S Soluciones",
    "cencosud": "Cencosud",
    "grupo-aval": "Grupo Aval",
    "ibm-colombia": "IBM Colombia",
    "lexmark": "Lexmark",
    "almacenes-exito": "Almacenes Éxito"
  };

  const proveedorParam = useMemo(() => {
    let raw = "";
    try {
      raw = decodeURIComponent(_provRaw).trim();
    } catch {
      raw = _provRaw.trim();
    }
    if (!raw) return "R&S Soluciones";
    const lower = raw.toLowerCase();
    if (SLUG_MAP[lower]) return SLUG_MAP[lower];
    return raw;
  }, [_provRaw]);

  const mesParam = params.get("mes");   // número o "todos"
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
  const [visorModal, setVisorModal] = useState(null); // Servicio seleccionado para ver plantilla e imagen
  const [copiadoPlantilla, setCopiadoPlantilla] = useState(false);
  const [imagenZoomModal, setImagenZoomModal] = useState(null); // { url, titulo }
  const [zoomNivel, setZoomNivel] = useState(1);

  const tokenParam = params.get("token");
  const [esSnapshotToken, setEsSnapshotToken] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargarTiempoReal() {
      setLoading(true);
      try {
        // 1. Consulta directa en tiempo real a Supabase a la tabla injected_services
        let registros = null;
        try {
          let queryOficial = supabase
            .from("injected_services")
            .select("*");

          // Si el proveedor solicitado es R&S Soluciones, usar ilike flexible
          if (esBusquedaRS) {
            queryOficial = queryOficial.ilike("provider_entity", "%R%S%");
          }

          const { data: dbOficial, error: errOficial } = await queryOficial.order("created_at", { ascending: true });

          if (!errOficial && dbOficial && dbOficial.length > 0) {
            registros = dbOficial.map(normalizarServicioUnificado);
          }
        } catch (queryErr) {
          console.warn("Consulta en tiempo real a injected_services:", queryErr);
        }

        // 2. Fallback a soporte_servicios (legacy) si injected_services no tiene datos
        if (!registros || registros.length === 0) {
          try {
            let queryLegacy = supabase
              .from("soporte_servicios")
              .select("*");

            if (esBusquedaRS) {
              queryLegacy = queryLegacy.ilike("proveedor", "%R%S%");
            }

            const { data: dbLegacy, error: dbLegacyErr } = await queryLegacy.order("creado_en", { ascending: true });

            if (!dbLegacyErr && dbLegacy && dbLegacy.length > 0) {
              registros = dbLegacy.map(normalizarServicioUnificado);
            }
          } catch (legacyErr) {
            console.warn("Consulta legacy a soporte_servicios:", legacyErr);
          }
        }

        // 3. Fallback a soporteService / localStorage garantizado
        if (!registros || registros.length === 0) {
          registros = await getServiciosSoporte({ proveedor: proveedorParam });
        }

        if (!cancelado) {
          setServicios(registros || []);
        }
      } catch (err) {
        console.error("Error cargando servicios en tiempo real:", err);
        const fallback = await getServiciosSoporte({ proveedor: proveedorParam });
        if (!cancelado) setServicios(fallback || []);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarTiempoReal();

    // 4. SUSCRIPCIÓN EN TIEMPO REAL CON SUPABASE CHANNELS
    // Si el administrador agrega, edita o elimina servicios en el CRM, el proveedor ve la actualización al 100% al instante
    const canalRealtime = supabase
      .channel("injected_services_realtime_shared")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "injected_services" },
        () => {
          cargarTiempoReal();
        }
      )
      .subscribe();

    return () => {
      cancelado = true;
      try {
        supabase.removeChannel(canalRealtime);
      } catch (_) {}
    };
  }, [proveedorParam, esBusquedaRS]);

  // Helper infalible de extracción de mes y año (DD/MM/YYYY, YYYY-MM-DD, etc.)
  const extraerMesAnio = (s) => {
    if (!s) return null;
    const fechas = [
      s.service_date,
      s.fecha_atencion,
      s.request_date,
      s.fecha_solicitud,
      s.end_date,
      s.fecha_finalizacion
    ];

    for (const f of fechas) {
      if (!f) continue;
      const str = String(f).trim();
      if (!str || str === "-") continue;

      // 1. Formato DD/MM/YYYY o DD-MM-YYYY (ej. "08/09/2026")
      const mDMY = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (mDMY) {
        const mes = parseInt(mDMY[2], 10);
        const anio = parseInt(mDMY[3], 10);
        if (mes >= 1 && mes <= 12 && anio > 1990) {
          return { mes, anio };
        }
      }

      // 2. Formato YYYY/MM/DD o YYYY-MM-DD (ej. "2026-09-08")
      const mYMD = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (mYMD) {
        const mes = parseInt(mYMD[2], 10);
        const anio = parseInt(mYMD[1], 10);
        if (mes >= 1 && mes <= 12 && anio > 1990) {
          return { mes, anio };
        }
      }

      // 3. Formato DD/MM/YY (ej. 15/09/26 -> 2026)
      const mDM2Y = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
      if (mDM2Y) {
        const mes = parseInt(mDM2Y[2], 10);
        const yy = parseInt(mDM2Y[3], 10);
        const anio = yy < 50 ? 2000 + yy : 1900 + yy;
        if (mes >= 1 && mes <= 12) {
          return { mes, anio };
        }
      }
    }

    const creado = s.created_at || s.creado_en;
    if (creado) {
      const d = new Date(creado);
      if (!isNaN(d.getTime())) {
        return { mes: d.getMonth() + 1, anio: d.getFullYear() };
      }
    }
    return null;
  };

  // ── NORMALIZACIÓN Y FILTRADO FLEXIBLE DEL LADO DEL CLIENTE ──────────────────
  // Limpia espacios, acentos, caracteres especiales y normaliza 'y'/'&'
  const normalizarTexto = (str) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "y")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const provNorm = normalizarTexto(proveedorParam);
  const rawNorm = normalizarTexto(_provRaw);

  // Determinar si el proveedor buscado es R&S Soluciones o similar
  const esBusquedaRS =
    provNorm.includes("rs") ||
    provNorm.includes("soluciones") ||
    rawNorm.includes("rs") ||
    rawNorm.includes("soluciones");

  // REGLA DE INTEGRIDAD Y FILTRADO FLEXIBLE:
  // - Si los servicios vienen directamente del snapshot por token (shared_audits),
  //   se utilizan exactamente esos registros garantizando 100% de coincidencia inmutable.
  // - De lo contrario, se aplica la normalización flexible sobre el catálogo general.
  const serviciosProveedor = useMemo(() => {
    if (!proveedorParam || proveedorParam === "todos") {
      return servicios.filter((s) => {
        const p = (s.proveedor || "").trim();
        return p && p !== "-";
      });
    }

    return servicios.filter((s) => {
      const p = (s.proveedor || "").trim();
      if (!p || p === "-") return false;

      const normP = normalizarTexto(p);

      // 1. Coincidencia exacta normalizada
      if (normP === provNorm || normP === rawNorm) return true;

      // 2. Coincidencia flexible para R&S Soluciones
      if (esBusquedaRS) {
        const pUpper = p.toUpperCase();
        const coincideRS =
          pUpper.includes("R&S") ||
          pUpper.includes("R & S") ||
          normP.includes("rs") ||
          (normP.includes("r") && normP.includes("soluciones"));

        // Asegurar que no sea de otra entidad distinta
        const esOtraEntidad =
          normP.includes("cencosud") ||
          normP.includes("aval") ||
          normP.includes("ibm") ||
          normP.includes("lexmark");

        if (coincideRS && !esOtraEntidad) {
          return true;
        }
      }

      // 3. Coincidencia por subcadena para otros proveedores
      if (normP.includes(provNorm) || provNorm.includes(normP)) {
        return true;
      }

      return false;
    });
  }, [servicios, proveedorParam, provNorm, rawNorm, esBusquedaRS]);

  // Años disponibles en los servicios del proveedor
  const aniosDisponibles = useMemo(() => {
    const years = new Set([
      new Date().getFullYear(),
      ...serviciosProveedor.map((s) => extraerMesAnio(s)?.anio).filter(Boolean)
    ]);
    return Array.from(years).sort((a, b) => b - a);
  }, [serviciosProveedor]);

  // Filtrado final en tiempo real por periodo (mes y año) y búsqueda
  const serviciosFiltrados = useMemo(() => {
    return serviciosProveedor.filter((s) => {
      // 1. Búsqueda por número de caso
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const caso = String(s.numero_caso || "").toLowerCase();
        if (!caso.includes(q)) return false;
      }

      // 2. Filtrado estricto por mes y año
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
      className="bg-white text-gray-900 min-h-screen"
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#0f172a",
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
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Plantilla & Evidencia</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                          No hay servicios registrados para la entidad "{proveedorParam}" en este periodo.
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Puedes cambiar el mes, quitar el filtro de búsqueda o activar el modo de respaldo general.
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setBusqueda("");
                              setEsSnapshotToken(false);
                            }}
                            style={{
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Mostrar Todos los Servicios del Mes (Sin filtro estricto)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFiltroMes("todos");
                              setFiltroAnio("todos");
                            }}
                            style={{
                              background: "#e0f2fe",
                              border: "1px solid #0284c7",
                              color: "#0284c7",
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Ver Todo el Histórico
                          </button>
                        </div>
                      </div>
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
                        <td style={{ padding: "9px 8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            onClick={() => setVisorModal(s)}
                            style={{
                              background: isDark ? "rgba(56, 189, 248, 0.15)" : "#e0f2fe",
                              border: isDark ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid #bae6fd",
                              color: isDark ? "#38bdf8" : "#0284c7",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <Eye size={13} />
                            <span>Ver Plantilla</span>
                          </button>
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

      {/* VISOR MODAL: AUDITORÍA DE PLANTILLA CORPORATIVA Y EVIDENCIA FOTOGRÁFICA */}
      {visorModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              background: isDark ? "#0f172a" : "#ffffff",
              border: isDark ? "1.5px solid rgba(56, 189, 248, 0.4)" : "1.5px solid #38bdf8",
              borderRadius: 18,
              width: "100%",
              maxWidth: 760,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              overflow: "hidden"
            }}
          >
            {/* Header del Visor */}
            <div
              style={{
                padding: "16px 20px",
                background: isDark ? "rgba(30, 41, 59, 0.8)" : "#f0f9ff",
                borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #bae6fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    borderRadius: 10,
                    padding: 7,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                    Plantilla de Servicio · Caso: {visorModal.numero_caso}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>
                    {visorModal.cliente} · {visorModal.fecha_atencion || visorModal.fecha_solicitud} · {visorModal.proveedor || proveedorParam}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVisorModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: isDark ? "#94a3b8" : "#64748b",
                  cursor: "pointer",
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Visor: Plantilla Corporativa Oficial + Imagen de Evidencia */}
            <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Plantilla Corporativa */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#94a3b8" : "#475569" }}>
                    Texto Oficial de la Plantilla Corporativa:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(visorModal.plantilla_completa || "No hay texto registrado.");
                      setCopiadoPlantilla(true);
                      setTimeout(() => setCopiadoPlantilla(false), 2000);
                    }}
                    style={{
                      background: copiadoPlantilla ? "#10b981" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      border: "none",
                      color: "#fff",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    {copiadoPlantilla ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiadoPlantilla ? "¡Copiada!" : "Copiar Plantilla"}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  value={
                    visorModal.plantilla_completa ||
                    `*REPORTE DE SOPORTE TÉCNICO EN SITIO*\nN° Caso: ${visorModal.numero_caso}\nFecha: ${visorModal.fecha_atencion || visorModal.fecha_solicitud}\nCliente: ${visorModal.cliente}\nEquipo: ${visorModal.equipo || "N/A"}\nFalla: ${visorModal.falla || "N/A"}\nSolución: ${visorModal.solucion || "N/A"}\nEstado: CERRADO Y AUDITADO\nTécnico: Jhon Alexander Vasquez Reveló`
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: 180,
                    background: isDark ? "rgba(0,0,0,0.3)" : "#f8fafc",
                    border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    lineHeight: 1.6,
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Evidencia Fotográfica Vinculada */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#94a3b8" : "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                  <ImageIcon size={15} /> Evidencia Fotográfica / Soporte Adjunto:
                </span>

                {visorModal.foto_url ? (
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e2e8f0",
                      background: "#000",
                      display: "flex",
                      justifyContent: "center",
                      maxHeight: 320
                    }}
                  >
                    <img
                      src={visorModal.foto_url}
                      alt={`Evidencia del caso ${visorModal.numero_caso}`}
                      style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain" }}
                    />
                    <button
                      type="button"
                      onClick={() => { setZoomNivel(1); setImagenZoomModal({ url: visorModal.foto_url, titulo: `Evidencia Caso ${visorModal.numero_caso}` }); }}
                      style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: 8, padding: "5px 9px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                    >
                      <Maximize2 size={14} /> Zoom / Pantalla Completa
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
                      border: isDark ? "1px dashed rgba(255,255,255,0.15)" : "1px dashed #cbd5e1",
                      borderRadius: 10,
                      padding: "24px 16px",
                      textAlign: "center",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontSize: 12
                    }}
                  >
                    No se adjuntó imagen fotográfica para este caso o fue purgada por política de retención mensual (TTL).
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Visor */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                background: isDark ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                display: "flex",
                justifyContent: "flex-end"
              }}
            >
              <button
                type="button"
                onClick={() => setVisorModal(null)}
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
                  border: "none",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE EVIDENCIA FOTOGRÁFICA */}
      {imagenZoomModal && (
        <div
          onClick={() => setImagenZoomModal(null)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.92)", zIndex: 999999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); setZoomNivel((z) => Math.min(z + 0.5, 4)); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <ZoomIn size={16} /> +Zoom
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setZoomNivel((z) => Math.max(z - 0.5, 0.5)); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <ZoomOut size={16} /> -Zoom
            </button>
            <button type="button" onClick={() => setImagenZoomModal(null)} style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <X size={16} /> Cerrar
            </button>
          </div>
          {imagenZoomModal.titulo && (
            <div style={{ position: "absolute", top: 16, left: 16, color: "#94a3b8", fontSize: 12 }}>{imagenZoomModal.titulo}</div>
          )}
          <div onClick={(e) => e.stopPropagation()} style={{ overflow: "auto", maxWidth: "95vw", maxHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={imagenZoomModal.url}
              alt={imagenZoomModal.titulo || "Evidencia"}
              style={{ transform: `scale(${zoomNivel})`, transformOrigin: "center", transition: "transform 0.2s", maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 4 }}
            />
          </div>
          <div style={{ position: "absolute", bottom: 14, color: "#64748b", fontSize: 11 }}>
            Clic fuera de la imagen para cerrar · Zoom: {Math.round(zoomNivel * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
