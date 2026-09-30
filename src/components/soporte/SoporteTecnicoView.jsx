import { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import {
  Wrench,
  Sparkles,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  Copy,
  Volume2,
  Trash2,
  Key,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  RefreshCw,
  Eye,
  FileText,
  UserCheck
} from "lucide-react";
import { C } from "../../styles/tokens";
import { isSoporteAuthorized, SOPORTE_ADMIN_EMAIL } from "../../utils/rbac";
import {
  getGeminiApiKey,
  extraerDatosDeServicio,
  generarPlantillaSolucion,
  MODELOS_GEMINI
} from "../../services/geminiService";
import {
  getServiciosSoporte,
  guardarServicioSoporte,
  eliminarServicioSoporte,
  subirImagenTemporalSoporte,
  purgarImagenesTemporales
} from "../../services/soporteService";
import { generarExcelCuentaCobro, descargarExcelEnNavegador } from "../../services/excelService";
import { numeroALetras, formatearMonedaCOP } from "../../utils/numeroALetras";
import AutoResizeTextarea from "./AutoResizeTextarea";
import ConfigApiKeyModal from "./ConfigApiKeyModal";

export default function SoporteTecnicoView({ user, profile, theme = "light" }) {
  const isDark = theme === "dark";
  const [tab, setTab] = useState("ia"); // "ia" | "cuentas" | "almacenamiento"
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);

  // Estados de IA y OCR
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenBase64, setImagenBase64] = useState(null);
  const [mimeType, setMimeType] = useState("image/png");
  const [notasTecnico, setNotasTecnico] = useState("");
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState(null);
  const [showConfigKey, setShowConfigKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Formulario estructurado "Datos de servicio requerido"
  const [datosExtraidos, setDatosExtraidos] = useState({
    numero_caso: "",
    fecha_solicitud: "",
    fecha_atencion: "",
    fecha_finalizacion: "",
    mesa: "2",
    cliente: "Banco Popular",
    coordinador: "Oswaldo",
    valor_servicios: 70000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    medio: "SITIO",
    equipo: "",
    falla: "",
    causa: "",
    solucion: "",
    pruebas: "",
    horas: { inicio: "11:00 am", fin: "4:00 pm", desplazamiento: "10:00 am" }
  });

  const [plantillaTexto, setPlantillaTexto] = useState("");
  const [copiadoPlantilla, setCopiadoPlantilla] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const fileInputRef = useRef(null);

  // Validación estricta de seguridad RBAC
  const isAuthorized = isSoporteAuthorized(user, profile);

  useEffect(() => {
    setHasApiKey(!!getGeminiApiKey());
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    setLoadingServicios(true);
    try {
      const data = await getServiciosSoporte();
      setServicios(data || []);
    } catch (e) {
      console.error("Error al cargar servicios:", e);
    } finally {
      setLoadingServicios(false);
    }
  };

  // 1. Manejo y compresión de imágenes temporales
  const handleImageSelect = async (file) => {
    if (!file) return;
    try {
      // Compresión en cliente para optimizar memoria y ancho de banda
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;
        setImagenPreview(result);
        const base64Data = result.split(",")[1];
        setImagenBase64(base64Data);
        setMimeType(compressedFile.type || "image/png");
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Error comprimiendo imagen:", err);
      // Fallback si falla compresión
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
        setImagenBase64(reader.result.split(",")[1]);
        setMimeType(file.type || "image/png");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  // Carga instantánea de caso de prueba corporativo (muestra del screenshot oficial de WhatsApp)
  const cargarCasoPruebaBancoPopular = () => {
    const casoPrueba = {
      numero_caso: "RE26014844 / RF637620",
      fecha_solicitud: "23/09/2026",
      fecha_atencion: "23/09/2026",
      fecha_finalizacion: "24/09/2026",
      mesa: "Mesa IBM",
      cliente: "Banco Popular",
      coordinador: "Oswaldo",
      valor_servicios: 70000,
      valor_viaticos: 0,
      valor_materiales: 0,
      sh: "SOFTWARE - HARDWARE",
      tecnico: "Jhon Alexander Vasquez Reveló",
      medio: "SITIO",
      equipo: "W005290ADM15 MJOG6EFA",
      falla: "ACTUALIZACION SISTEMA OPERATIVO",
      causa: "Equipo desactualizado genera que se encuentre fuera de dominio, se requiere actualizar Imagen del Banco a Windows 11 Enterprise",
      solucion: "Se realiza asistencia soporte en sitio y se solicitan permisos de ingreso a la entidad se ubica al usuario para tomar acciones en el equipo, se realiza la validación de la estado de la equipo el cual se encontró fuera de el dominio, se solicita al área de soporte de redes y telecomunicaciones habilitar punto de red, ingeniero Darwin de telecomunicaciones ejecuta actualización del punto de red quedando habilitada la extensión de el teléfono y de igual forma la cpu, sistema operativo Windows inicia correctamente, se realiza configuración de equipo se valida el dominio corporativo, se reinicia equipo, se actualizan agentes de seguridad y aplicativos de usuario, se realiza ejecuta actualizaciónes de sistema operativo, soporte técnico 1.5 Jhon Aguilar accede remotamente, y realizar proceso de configuración de aplicaciones y controladores de dispositivos faltantes, se hace configuración de perfil.",
      pruebas: "usuario ingresa con sus credenciales, cargándole perfil correctamente, inicia pruebas con diferentes aplicativos y plataformas, validación por parte de usuario es exitosa equipo se deja operativo y funcional",
      horas: { inicio: "11:00 am", fin: "4:00pm", desplazamiento: "10:00 am" }
    };

    setDatosExtraidos(casoPrueba);
    const plantilla = generarPlantillaSolucion(casoPrueba);
    setPlantillaTexto(plantilla);
    setNotasTecnico("Actualización Windows 11 Enterprise en Banco Popular, equipo en sitio con soporte Darwin y Jhon Aguilar.");
  };

  // 2. Procesamiento con IA Multimodal (Gemini 2.5 / 2.0 / 1.5)
  const handleProcesarIA = async () => {
    if (!imagenBase64 && !notasTecnico.trim()) {
      alert("Por favor sube una captura de pantalla de WhatsApp o escribe/dicta notas del servicio.");
      return;
    }

    if (!hasApiKey && !getGeminiApiKey()) {
      setShowConfigKey(true);
      return;
    }

    setProcesandoIA(true);
    setErrorIA(null);

    try {
      const resultado = await extraerDatosDeServicio({
        imagenBase64,
        mimeType,
        textoNotas: notasTecnico,
        modelId: selectedModel
      });

      // Actualizar datos extraídos
      const combinados = {
        ...datosExtraidos,
        ...resultado,
        horas: {
          ...datosExtraidos.horas,
          ...(resultado.horas || {})
        }
      };

      setDatosExtraidos(combinados);

      // Generar plantilla oficial
      const plantilla = resultado.plantilla_completa || generarPlantillaSolucion(combinados);
      setPlantillaTexto(plantilla);
    } catch (err) {
      console.error("Error al procesar con Gemini:", err);
      setErrorIA(err.message || "Error procesando con Gemini. Revisa tu API Key.");
    } finally {
      setProcesandoIA(false);
    }
  };

  // 3. Confirmar y Agregar Servicio a Cuenta de Cobro
  const handleAgregarACuentaCobro = async () => {
    if (!datosExtraidos.numero_caso) {
      alert("Debes ingresar el N° de Caso o Código de Servicio.");
      return;
    }

    try {
      let fotoUrlRemota = null;
      if (imagenPreview && imagenPreview.startsWith("data:")) {
        // Subir al bucket temporal en segundo plano
        const resBlob = await (await fetch(imagenPreview)).blob();
        fotoUrlRemota = await subirImagenTemporalSoporte(resBlob);
      }

      const nuevoServicio = {
        ...datosExtraidos,
        plantilla_completa: plantillaTexto || generarPlantillaSolucion(datosExtraidos),
        foto_url: fotoUrlRemota || imagenPreview
      };

      const guardado = await guardarServicioSoporte(nuevoServicio);
      setServicios((prev) => [...prev, guardado]);
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);

      // Cambiar a la pestaña de Cuentas de Cobro para ver el impacto
      setTab("cuentas");
    } catch (err) {
      alert("No se pudo agregar a la cuenta de cobro: " + err.message);
    }
  };

  // 4. Exportar a Excel Oficial (.xlsx)
  const handleDescargarExcel = async () => {
    setExportandoExcel(true);
    try {
      const buffer = await generarExcelCuentaCobro(servicios, {
        nombre: "Jhon Alexander Vasquez Reveló",
        cedula: "10308105"
      });
      descargarExcelEnNavegador(buffer, "Formato de cuenta de cobro - Jhon Vasquez # 4.xlsx");
    } catch (err) {
      alert("Error al exportar el archivo Excel: " + err.message);
    } finally {
      setExportandoExcel(false);
    }
  };

  // 5. Eliminar servicio
  const handleEliminarServicio = async (id) => {
    if (confirm("¿Estás seguro de eliminar este servicio de la cuenta de cobro?")) {
      await eliminarServicioSoporte(id);
      setServicios((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Copiar plantilla para WhatsApp
  const handleCopiarPlantilla = () => {
    if (!plantillaTexto) return;
    navigator.clipboard.writeText(plantillaTexto);
    setCopiadoPlantilla(true);
    setTimeout(() => setCopiadoPlantilla(false), 2000);
  };

  // Cálculos de Totales de la Cuenta de Cobro
  const totalServicios = servicios.reduce((acc, s) => acc + (Number(s.valor_servicios) || 0), 0);
  const totalViaticos = servicios.reduce((acc, s) => acc + (Number(s.valor_viaticos) || 0), 0);
  const totalMateriales = servicios.reduce((acc, s) => acc + (Number(s.valor_materiales) || 0), 0);
  const granTotal = totalServicios + totalViaticos + totalMateriales;
  const textoEnLetras = numeroALetras(granTotal);

  // VISTA DENEGADA POR RBAC
  if (!isAuthorized) {
    return (
      <div
        style={{
          background: isDark ? "rgba(15, 23, 42, 0.95)" : "#FEF2F2",
          border: "1.5px solid #ef4444",
          borderRadius: 20,
          padding: 36,
          color: isDark ? "#fff" : "#991B1B",
          textAlign: "center",
          maxWidth: 600,
          margin: "40px auto",
          backdropFilter: "blur(20px)"
        }}
      >
        <div style={{ background: "rgba(239, 68, 68, 0.2)", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <AlertTriangle size={32} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px 0", color: isDark ? "#fff" : "#991B1B" }}>Acceso Restringido (RBAC Enterprise)</h2>
        <p style={{ fontSize: 14, color: isDark ? "#cbd5e1" : "#7F1D1D", lineHeight: 1.6 }}>
          El módulo de <strong>Soporte Técnico y Cuentas de Cobro</strong> está protegido y habilitado exclusivamente para el correo del administrador maestro autorizado:
        </p>
        <div style={{ background: isDark ? "rgba(0,0,0,0.4)" : "#FEE2E2", padding: "10px 16px", borderRadius: 10, display: "inline-block", fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#fca5a5" : "#B91C1C", fontSize: 14, margin: "10px 0 16px", fontWeight: 700 }}>
          {SOPORTE_ADMIN_EMAIL}
        </div>
        <p style={{ fontSize: 12.5, color: isDark ? "rgba(255,255,255,0.45)" : "#991B1B" }}>
          Tu usuario actual (<strong>{user?.email || "No autenticado"}</strong>) no posee permisos de administración de soporte en campo.
        </p>
      </div>
    );
  }

  const cardBg = isDark ? "rgba(15, 23, 42, 0.85)" : "#FFFFFF";
  const cardBorder = isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #E2E8F0";
  const cardShadow = isDark ? "0 10px 30px rgba(0, 0, 0, 0.4)" : "0 4px 16px rgba(0, 0, 0, 0.05)";
  const inputBg = isDark ? "rgba(0,0,0,0.4)" : "#F8FAFC";
  const inputBorder = isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #CBD5E1";
  const inputText = isDark ? "#fff" : "#0F172A";
  const labelColor = isDark ? "rgba(255,255,255,0.7)" : "#475569";
  const textTitle = isDark ? "#FFFFFF" : "#0F172A";
  const textSub = isDark ? "rgba(255, 255, 255, 0.7)" : "#475569";

  return (
    <div style={{ color: isDark ? "#fff" : "#0F172A", width: "100%", paddingBottom: 60 }}>
      {/* Banner Superior Corporativo */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(19, 94, 107, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: 20,
          padding: "20px 24px",
          marginBottom: 20,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(16px)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ background: C.coral, padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
                IT & FIELD OPS
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "2px 8px", borderRadius: 12, fontSize: 10.5 }}>
                <ShieldCheck size={12} /> RBAC Autorizado: {SOPORTE_ADMIN_EMAIL}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "4px 0", letterSpacing: "-0.02em" }}>
              Módulo Inteligente de Soporte Técnico
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              OCR Multimodal Gemini, generación de plantillas corporativas y liquidación automática de Cuentas de Cobro.
            </p>
          </div>

          {/* Selector de Modelos y Configuración API Key */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                outline: "none"
              }}
            >
              {MODELOS_GEMINI.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "#0f172a" }}>
                  {m.nombre} {m.recomendado ? "★" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowConfigKey(true)}
              style={{
                background: hasApiKey ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.2)",
                border: hasApiKey ? "1px solid #10b981" : "1px solid #f59e0b",
                color: hasApiKey ? "#a7f3d0" : "#fef08a",
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Key size={14} />
              <span>{hasApiKey ? "Gemini Conectado" : "Configurar API Key"}</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div style={{ display: "flex", gap: 10, marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14, flexWrap: "wrap" }}>
          <button
            onClick={() => setTab("ia")}
            style={{
              background: tab === "ia" ? "rgba(56, 189, 248, 0.35)" : "rgba(255,255,255,0.1)",
              border: tab === "ia" ? "1.5px solid #38bdf8" : "1px solid rgba(255,255,255,0.2)",
              color: tab === "ia" ? "#ffffff" : "rgba(255,255,255,0.85)",
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            <Sparkles size={16} /> 1. OCR Multimodal & Plantilla
          </button>

          <button
            onClick={() => setTab("cuentas")}
            style={{
              background: tab === "cuentas" ? "rgba(16, 185, 129, 0.35)" : "rgba(255,255,255,0.1)",
              border: tab === "cuentas" ? "1.5px solid #10b981" : "1px solid rgba(255,255,255,0.2)",
              color: tab === "cuentas" ? "#ffffff" : "rgba(255,255,255,0.85)",
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            <FileSpreadsheet size={16} /> 2. Cuenta de Cobro ({servicios.length} casos - {formatearMonedaCOP(granTotal)})
          </button>

          <button
            onClick={() => setTab("almacenamiento")}
            style={{
              background: tab === "almacenamiento" ? "rgba(168, 85, 247, 0.35)" : "rgba(255,255,255,0.1)",
              border: tab === "almacenamiento" ? "1.5px solid #c084fc" : "1px solid rgba(255,255,255,0.2)",
              color: tab === "almacenamiento" ? "#ffffff" : "rgba(255,255,255,0.85)",
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            <Clock size={16} /> 3. TTL Almacenamiento (7 Días)
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: ASISTENTE IA & OCR MULTIMODAL */}
      {tab === "ia" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Zona de Entrada: Imagen y Notas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16
            }}
          >
            {/* Tarjeta de Subida de Pantallazo */}
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                borderRadius: 16,
                padding: 18,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: textTitle, display: "flex", alignItems: "center", gap: 6 }}>
                  <UploadCloud size={16} color="#0284c7" /> Captura de WhatsApp / Reporte
                </span>
                <span style={{ fontSize: 11, background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                  TTL 7 Días
                </span>
              </div>

              {/* Zona de Drop */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDark ? "2px dashed rgba(56, 189, 248, 0.35)" : "2px dashed #93c5fd",
                  borderRadius: 12,
                  padding: 20,
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDark ? (imagenPreview ? "rgba(0,0,0,0.4)" : "rgba(15, 23, 42, 0.5)") : (imagenPreview ? "#f8fafc" : "#f8fafc"),
                  transition: "all 0.2s",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files[0])}
                />

                {imagenPreview ? (
                  <div style={{ position: "relative", width: "100%", maxHeight: 220, overflow: "hidden", borderRadius: 8 }}>
                    <img
                      src={imagenPreview}
                      alt="Captura cargada"
                      style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8 }}
                    />
                    <div style={{ fontSize: 11, color: "#0284c7", marginTop: 6, fontWeight: 600 }}>
                      Toca para cambiar imagen (comprimida automáticamente)
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={38} color="#0284c7" style={{ marginBottom: 10, opacity: 0.8 }} />
                    <strong style={{ fontSize: 13, color: textTitle }}>Arrastra una captura de pantalla aquí</strong>
                    <span style={{ fontSize: 11.5, color: textSub, marginTop: 4 }}>
                      o haz clic para explorar fotos desde tu móvil o PC
                    </span>
                  </>
                )}
              </div>

              {/* Botón de Caso de Muestra */}
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={cargarCasoPruebaBancoPopular}
                  style={{
                    background: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)",
                    border: isDark ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(2, 132, 199, 0.3)",
                    color: isDark ? "#38bdf8" : "#0284c7",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Sparkles size={13} /> Cargar Ejemplo (Banco Popular)
                </button>

                {imagenPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagenPreview(null);
                      setImagenBase64(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      fontSize: 11.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <Trash2 size={13} /> Quitar imagen
                  </button>
                )}
              </div>
            </div>

            {/* Tarjeta de Entrada de Notas y Voz */}
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                borderRadius: 16,
                padding: 18,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <AutoResizeTextarea
                value={notasTecnico}
                onChange={setNotasTecnico}
                placeholder="Escribe notas técnicas de la visita, falla detectada, horas de atención o dicta por voz..."
                minRows={5}
                label="Notas Técnicas y Dictado Multimodal"
                hint="Usa el botón de micrófono para dictar en tiempo real con Web Speech API"
                theme={theme}
              />

              {/* Botón de Ejecución del Modelo */}
              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <button
                  type="button"
                  disabled={procesandoIA}
                  onClick={handleProcesarIA}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    border: "none",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "12px 18px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: procesandoIA ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 6px 20px rgba(2, 132, 199, 0.4)",
                    transition: "all 0.2s"
                  }}
                >
                  <Sparkles size={18} className={procesandoIA ? "spin" : ""} />
                  {procesandoIA ? "Analizando con Gemini (OCR & Parsing)..." : "Procesar con IA Multimodal"}
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de Error en IA */}
          {errorIA && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                borderRadius: 12,
                padding: 14,
                color: "#fca5a5",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>{errorIA}</span>
              <button
                onClick={() => setShowConfigKey(true)}
                style={{
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Revisar API Key
              </button>
            </div>
          )}

          {/* PASO 1 Y PASO 2: DATOS ESTRUCTURADOS Y PLANTILLA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20
            }}
          >
            {/* Columna Izquierda: Formulario "Datos de servicio requerido" */}
            <div
              style={{
                background: cardBg,
                border: isDark ? "1.5px solid rgba(56, 189, 248, 0.3)" : "1.5px solid #e2e8f0",
                boxShadow: cardShadow,
                borderRadius: 18,
                padding: 20
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isDark ? "#38bdf8" : "#0284c7" }}>
                    1. Datos de servicio requerido
                  </h3>
                  <span style={{ fontSize: 11.5, color: textSub }}>
                    Campos estructurados listos para liquidación en Excel
                  </span>
                </div>
                <span style={{ background: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)", color: isDark ? "#38bdf8" : "#0284c7", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  OCR Validado
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* N° Caso */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    N° de Caso / Código de servicio:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.numero_caso}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, numero_caso: e.target.value })}
                    placeholder="ej. RE26014844 / RF637620 o 2303375"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5,
                      fontWeight: 600
                    }}
                  />
                </div>

                {/* Cliente Final */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Cliente final:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.cliente}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, cliente: e.target.value })}
                    placeholder="ej. Banco Popular, Jumbo Popayán"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                {/* Mesa */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Mesa / Tipo de soporte:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.mesa}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, mesa: e.target.value })}
                    placeholder="ej. 2, Mesa IBM"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                {/* Fechas */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Fecha solicitud:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.fecha_solicitud}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, fecha_solicitud: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Fecha atención:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.fecha_atencion}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, fecha_atencion: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                {/* Coordinador */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Coordinador(a):
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.coordinador}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, coordinador: e.target.value })}
                    placeholder="ej. Oswaldo"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                {/* Valor Servicios */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Tarifa Servicio ($ COP):
                  </label>
                  <input
                    type="number"
                    value={datosExtraidos.valor_servicios}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, valor_servicios: Number(e.target.value) })}
                    placeholder="70000"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: isDark ? "#4ade80" : "#059669",
                      fontSize: 12.5,
                      fontWeight: 700
                    }}
                  />
                </div>

                {/* Viáticos y Materiales */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Viáticos ($ COP):
                  </label>
                  <input
                    type="number"
                    value={datosExtraidos.valor_viaticos}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, valor_viaticos: Number(e.target.value) })}
                    placeholder="0"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Materiales ($ COP):
                  </label>
                  <input
                    type="number"
                    value={datosExtraidos.valor_materiales}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, valor_materiales: Number(e.target.value) })}
                    placeholder="0"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                {/* Equipo y Falla */}
                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Nombre del equipo / Serial:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.equipo}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, equipo: e.target.value })}
                    placeholder="ej. W005290ADM15"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: labelColor, display: "block", marginBottom: 4 }}>
                    Falla reportada:
                  </label>
                  <input
                    type="text"
                    value={datosExtraidos.falla}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, falla: e.target.value })}
                    placeholder="ACTUALIZACION SO"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: "Plantilla de Solución" Generada en Tiempo Real */}
            <div
              style={{
                background: cardBg,
                border: isDark ? "1.5px solid rgba(16, 185, 129, 0.3)" : "1.5px solid #e2e8f0",
                boxShadow: cardShadow,
                borderRadius: 18,
                padding: 20,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isDark ? "#6ee7b7" : "#059669" }}>
                    2. Plantilla Corporativa Oficial (WhatsApp IT)
                  </h3>
                  <span style={{ fontSize: 11.5, color: textSub }}>
                    Formato oficial de entrega y cierre para mesas de ayuda
                  </span>
                </div>

                {/* Acciones de la Plantilla */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleCopiarPlantilla}
                    style={{
                      background: copiadoPlantilla ? "#10b981" : (isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9"),
                      border: "none",
                      color: copiadoPlantilla ? "#fff" : (isDark ? "#fff" : "#334155"),
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {copiadoPlantilla ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copiadoPlantilla ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Caja de Texto de la Plantilla Editable */}
              <textarea
                value={plantillaTexto}
                onChange={(e) => setPlantillaTexto(e.target.value)}
                placeholder="La plantilla se generará automáticamente al procesar el caso..."
                style={{
                  width: "100%",
                  flex: 1,
                  minHeight: 250,
                  boxSizing: "border-box",
                  background: isDark ? "rgba(10, 20, 15, 0.7)" : "#f8fafc",
                  border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #cbd5e1",
                  borderRadius: 12,
                  padding: 12,
                  color: isDark ? "#d1fae5" : "#0f172a",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  resize: "vertical",
                  outline: "none"
                }}
              />

              {/* Botón Principal: PASO 3 AGREGAR A CUENTA DE COBRO */}
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleAgregarACuentaCobro}
                  style={{
                    width: "100%",
                    background: guardadoExitoso ? "#10b981" : C.coral,
                    border: "none",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "14px 20px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: "0 6px 20px rgba(225, 78, 42, 0.5)",
                    transition: "all 0.2s"
                  }}
                >
                  {guardadoExitoso ? <CheckCircle size={20} /> : <FileSpreadsheet size={20} />}
                  <span>{guardadoExitoso ? "¡Servicio Inyectado en Cuenta de Cobro!" : "3. Agregar servicio a cuenta de cobro"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CUENTAS DE COBRO & EXCEL OFICIAL */}
      {tab === "cuentas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tarjeta de Resumen Oficial (C.C., Nombre y Suma en Letras) */}
          <div
            style={{
              background: cardBg,
              border: isDark ? "1.5px solid rgba(19, 94, 107, 0.8)" : "1.5px solid #cbd5e1",
              borderRadius: 18,
              padding: 24,
              boxShadow: cardShadow
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.6)" : "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Formato de Cuenta de Cobro Oficial
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: textTitle, marginTop: 2 }}>
                  DEBE A: Jhon Alexander Vasquez Reveló
                </div>
                <div style={{ fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#38bdf8" : "#0284c7", marginTop: 2 }}>
                  C.C. 10308105
                </div>
              </div>

              {/* Botón Descargar Excel */}
              <button
                type="button"
                disabled={exportandoExcel || servicios.length === 0}
                onClick={handleDescargarExcel}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: exportandoExcel ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                  transition: "all 0.2s"
                }}
              >
                <Download size={18} />
                <span>{exportandoExcel ? "Generando Excel..." : "Descargar Excel Oficial (.xlsx)"}</span>
              </button>
            </div>

            {/* Cuadro de Liquidación en Letras */}
            <div
              style={{
                background: isDark ? "rgba(19, 94, 107, 0.25)" : "#f0fdf4",
                border: isDark ? "1.5px solid #135E6B" : "1.5px solid #86efac",
                borderRadius: 12,
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 14,
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>LA SUMA DE:</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#6ee7b7" : "#059669", marginTop: 2 }}>
                  {textoEnLetras})
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>SON (TOTAL):</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: textTitle, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatearMonedaCOP(granTotal)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>CONCEPTO:</div>
                <div style={{ fontSize: 12.5, color: textSub }}>
                  PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO EN SITIO
                </div>
              </div>
            </div>
          </div>

          {/* Tabla idéntica a la fila 24 del Excel oficial */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 18,
              padding: 20,
              overflowX: "auto",
              boxShadow: cardShadow
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textTitle }}>
                Detalle de Servicios Inyectados ({servicios.length} registros a partir de fila 24)
              </h3>
              <button
                type="button"
                onClick={() => setTab("ia")}
                style={{
                  background: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)",
                  border: isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(2, 132, 199, 0.3)",
                  color: isDark ? "#38bdf8" : "#0284c7",
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Plus size={14} /> Agregar otro servicio
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900, fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#135E6B", color: "#ffffff", textAlign: "center" }}>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>N° de Caso</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha solicitud</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha Atención</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha finalización</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Mesa</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Cliente</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Coordinador</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Valor servicios</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Viáticos</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Materiales</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    style={{
                      background: idx % 2 === 0 
                        ? (isDark ? "rgba(255,255,255,0.02)" : "#ffffff") 
                        : (isDark ? "rgba(255,255,255,0.06)" : "#f8fafc"),
                      color: isDark ? "#cbd5e1" : "#1e293b",
                      textAlign: "center"
                    }}
                  >
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", fontWeight: 600 }}>
                      {s.numero_caso}
                    </td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.fecha_solicitud}</td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.fecha_atencion}</td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.fecha_finalizacion}</td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.mesa}</td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.cliente}</td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.coordinador}</td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "right", color: isDark ? "#6ee7b7" : "#059669", fontWeight: 700 }}>
                      {formatearMonedaCOP(s.valor_servicios)}
                    </td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "right" }}>
                      {Number(s.valor_viaticos) > 0 ? formatearMonedaCOP(s.valor_viaticos) : "$ -"}
                    </td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "right" }}>
                      {Number(s.valor_materiales) > 0 ? formatearMonedaCOP(s.valor_materiales) : "$ -"}
                    </td>
                    <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>
                      <button
                        type="button"
                        onClick={() => handleEliminarServicio(s.id)}
                        title="Eliminar de la cuenta de cobro"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: 4
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Fila de Totales */}
                <tr style={{ background: isDark ? "rgba(19, 94, 107, 0.4)" : "#e2e8f0", color: isDark ? "#ffffff" : "#0f172a", fontWeight: 800, textAlign: "right" }}>
                  <td colSpan={7} style={{ padding: "12px 10px", border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1", textAlign: "center" }}>
                    TOTAL CUENTA DE COBRO
                  </td>
                  <td style={{ padding: "12px 10px", border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1", color: isDark ? "#a7f3d0" : "#059669", fontSize: 13.5 }}>
                    {formatearMonedaCOP(totalServicios)}
                  </td>
                  <td style={{ padding: "12px 10px", border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1" }}>
                    {totalViaticos > 0 ? formatearMonedaCOP(totalViaticos) : "$ -"}
                  </td>
                  <td style={{ padding: "12px 10px", border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1" }}>
                    {totalMateriales > 0 ? formatearMonedaCOP(totalMateriales) : "$ -"}
                  </td>
                  <td style={{ border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: ALMACENAMIENTO TEMPORAL Y TTL */}
      {tab === "almacenamiento" && (
        <div
          style={{
            background: cardBg,
            border: isDark ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid #e9d5ff",
            boxShadow: cardShadow,
            borderRadius: 18,
            padding: 24,
            maxWidth: 750,
            margin: "0 auto"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ background: isDark ? "rgba(168, 85, 247, 0.2)" : "#f3e8ff", padding: 12, borderRadius: 14, color: isDark ? "#d8b4fe" : "#9333ea" }}>
              <Clock size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: textTitle }}>Gestión Inteligente de Almacenamiento Temporal</h3>
              <p style={{ margin: 0, fontSize: 12.5, color: textSub }}>
                Optimización de costos y política de ciclo de vida (TTL 7 Días)
              </p>
            </div>
          </div>

          <div style={{ fontSize: 13.5, color: textSub, lineHeight: 1.6, marginBottom: 20 }}>
            Para garantizar que la base de datos y el bucket de almacenamiento (Supabase Storage) no se saturen con capturas de pantalla pesadas de WhatsApp o fotos de campo, el sistema aplica dos capas de optimización:
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li><strong>Compresión previa en el cliente:</strong> Cada imagen se reduce a un peso menor a 1MB antes de cualquier transferencia.</li>
              <li><strong>Almacenamiento Temporal con TTL (7 Días):</strong> Las imágenes se marcan con fecha de caducidad. Una rutina automatizada (pg_cron en Supabase) elimina los archivos que superen los 7 días de antigüedad.</li>
            </ul>
          </div>

          <div
            style={{
              background: isDark ? "rgba(0,0,0,0.3)" : "#faf5ff",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e9d5ff",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: textTitle }}>Purga manual de archivos expirados</div>
              <div style={{ fontSize: 11.5, color: textSub }}>Ejecuta la limpieza inmediata de capturas anteriores a 7 días</div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await purgarImagenesTemporales(7);
                alert("Rutina de purga ejecutada: " + (res.info || "OK"));
              }}
              style={{
                background: isDark ? "rgba(168, 85, 247, 0.2)" : "#f3e8ff",
                border: isDark ? "1px solid #a855f7" : "1px solid #c084fc",
                color: isDark ? "#e9d5ff" : "#7e22ce",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <RefreshCw size={14} /> Purgar ahora
            </button>
          </div>
        </div>
      )}

      {/* Modal de Configuración y Diagnóstico de API Key */}
      <ConfigApiKeyModal
        isOpen={showConfigKey}
        onClose={() => setShowConfigKey(false)}
        onKeySaved={(newKey) => setHasApiKey(!!newKey)}
        theme={theme}
      />
    </div>
  );
}
