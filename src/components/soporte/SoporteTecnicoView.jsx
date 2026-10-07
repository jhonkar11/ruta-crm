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
  UserCheck,
  Pencil,
  X,
  CalendarDays,
  Search,
  Layers,
  Check,
  Zap
} from "lucide-react";
import { C } from "../../styles/tokens";
import { isSoporteAuthorized, SOPORTE_ADMIN_EMAIL } from "../../utils/rbac";
import {
  estadoMotorIA,
  extraerDatosDeServicio,
  generarPlantillaDesdeInstitucional,
  generarPlantillaSolucion,
  MODELO_GEMINI_POR_DEFECTO,
  MODELOS_GEMINI
} from "../../services/geminiService";
import {
  getServiciosSoporte,
  guardarServicioSoporte,
  eliminarServicioSoporte,
  actualizarServicioSoporte,
  getRegistrosServicios,
  guardarRegistroServicio,
  eliminarRegistroServicio,
  depurarRegistrosServiciosPorMes,
  subirImagenTemporalSoporte,
  purgarImagenesTemporales
} from "../../services/soporteService";
import { generarExcelCuentaCobro, descargarExcelEnNavegador } from "../../services/excelService";
import { numeroALetras, formatearMonedaCOP } from "../../utils/numeroALetras";
import AutoResizeTextarea from "./AutoResizeTextarea";
import ConfigApiKeyModal from "./ConfigApiKeyModal";
import { useDictadoVoz } from "../../hooks/useDictadoVoz";

export default function SoporteTecnicoView({ user, profile, theme = "light" }) {
  const isDark = theme === "dark";
  const [tab, setTab] = useState("ia"); // "ia" | "cuentas" | "almacenamiento"
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);

  // ── Filtro por Mes/Año y Proveedor/Entidad ────────────────────────────────
  const ahora = new Date();
  const [filtroMes, setFiltroMes] = useState(ahora.getMonth() + 1); // 1–12
  const [filtroAnio, setFiltroAnio] = useState(ahora.getFullYear());
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState(""); // "" = todos los proveedores

  // ── Modal de Edición ──────────────────────────────────────────────────────
  const [editandoServicio, setEditandoServicio] = useState(null); // null | objeto servicio
  const [editFormData, setEditFormData] = useState({});
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // ── Módulo Independiente: Registro de Servicios & Historial de Plantillas ──
  const [registrosServicios, setRegistrosServicios] = useState([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [busquedaCaso, setBusquedaCaso] = useState("");
  const [filtroMesReg, setFiltroMesReg] = useState(ahora.getMonth() + 1);
  const [filtroAnioReg, setFiltroAnioReg] = useState(ahora.getFullYear());
  const [mostrarTodosReg, setMostrarTodosReg] = useState(false);
  const [modalVerPlantilla, setModalVerPlantilla] = useState(null); // objeto registro a visualizar
  const [depurando, setDepurando] = useState(false);
  const [copiadoRegId, setCopiadoRegId] = useState(null);

  // ── Memoria Histórica y Autocompletado para Proveedores, Clientes, Coordinadores y Mesas ──
  const PROVEEDORES_BASE = [
    "Cencosud",
    "Grupo Aval",
    "R&S Soluciones",
    "IBM Colombia",
    "Lexmark",
    "Almacenes Éxito",
    "Carvajal Tecnología",
    "Redeban Multicolor"
  ];

  const CLIENTES_BASE = [
    "Banco de Bogotá",
    "Banco Popular",
    "Jumbo Popayán",
    "Banco AV Villas",
    "Banco de Occidente",
    "Almaviva",
    "Davivienda",
    "Bancolombia",
    "Éxito Popayán",
    "R&S Soluciones"
  ];

  const COORDINADORES_BASE = [
    "Valentina Tovar",
    "Oswaldo",
    "Camilo Hurtado",
    "Jhon Alexander Vasquez Reveló"
  ];

  const MESAS_BASE = [
    "Mesa IBM / Lexmark",
    "Mesa IBM",
    "2",
    "Mesa 1",
    "Mesa 2",
    "Mesa Cajas / POS",
    "Soporte Periféricos",
    "Mesa Bancaria"
  ];

  // Listas consolidadas con memoria histórica dinámica a partir de los servicios guardados
  const historialProveedores = Array.from(
    new Set([
      ...PROVEEDORES_BASE,
      ...servicios.map((s) => s.proveedor?.trim()).filter(Boolean),
      ...registrosServicios.map((r) => r.proveedor?.trim()).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const historialClientes = Array.from(
    new Set([
      ...CLIENTES_BASE,
      ...servicios.map((s) => s.cliente?.trim()).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const historialCoordinadores = Array.from(
    new Set([
      ...COORDINADORES_BASE,
      ...servicios.map((s) => s.coordinador?.trim()).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const historialMesas = Array.from(
    new Set([
      ...MESAS_BASE,
      ...servicios.map((s) => s.mesa?.trim()).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  // Tope de la plantilla institucional. Debe coincidir con
  // MAX_PLANTILLA_INSTITUCIONAL en api/_lib/gemini.js (el servidor recorta igual).
  const MAX_PLANTILLA_INSTITUCIONAL = 24000;

  // Estados de IA y OCR
  const [selectedModel, setSelectedModel] = useState(MODELO_GEMINI_POR_DEFECTO);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenBase64, setImagenBase64] = useState(null);
  const [mimeType, setMimeType] = useState("image/png");
  const [notasTecnico, setNotasTecnico] = useState("");
  // Texto crudo de la plantilla/requerimiento institucional del banco (AV Villas,
  // Popular, Almaviva, etc.). Se envía tal cual al motor de IA para que lo mapee.
  const [plantillaInstitucional, setPlantillaInstitucional] = useState("");
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [generandoPlantilla, setGenerandoPlantilla] = useState(false);
  const [errorIA, setErrorIA] = useState(null);
  const [showConfigKey, setShowConfigKey] = useState(false);
  // La llave ya no vive en el navegador: esto refleja si el servidor la tiene.
  const [motorListo, setMotorListo] = useState(null); // null = comprobando, true/false = resultado
  const [errorDictado, setErrorDictado] = useState(null);

  // Formulario estructurado "Datos de servicio requerido"
  const [datosExtraidos, setDatosExtraidos] = useState({
    numero_caso: "",
    fecha_solicitud: "",
    fecha_atencion: "",
    fecha_finalizacion: "",
    mesa: "",
    proveedor: "",
    cliente: "",
    coordinador: "",
    valor_servicios: 0,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE - HARDWARE",
    tecnico: "",
    medio: "SITIO",
    equipo: "",
    falla: "",
    causa: "",
    solucion: "",
    pruebas: "",
    horas: { inicio: "", fin: "", desplazamiento: "" }
  });

  const [plantillaTexto, setPlantillaTexto] = useState("");
  const [copiadoPlantilla, setCopiadoPlantilla] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Detección en tiempo real de caso duplicado y autocompletado inteligente
  const [casoDuplicadoEncontrado, setCasoDuplicadoEncontrado] = useState(null);
  const [descartarAlertaDuplicado, setDescartarAlertaDuplicado] = useState(false);

  // Estado de pago por fila: Map<id, "confirmed" | "pending">
  // Persiste el estado localmente mientras la sesión esté activa.
  const [paymentStatusMap, setPaymentStatusMap] = useState({});

  const fileInputRef = useRef(null);

  // Validación estricta de seguridad RBAC
  const isAuthorized = isSoporteAuthorized(user, profile);

  useEffect(() => {
    cargarServicios();

    // Comprobar si el servidor tiene la GEMINI_API_KEY configurada
    let cancelado = false;
    (async () => {
      const r = await estadoMotorIA();
      if (!cancelado) setMotorListo(!!r?.configurado);
    })();

    // Soporte para pegar imágenes desde el portapapeles (Ctrl+V / WhatsApp Web)
    const handlePaste = (e) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleImageSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      cancelado = true;
      window.removeEventListener("paste", handlePaste);
    };
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

  const cargarRegistrosServicios = async () => {
    setLoadingRegistros(true);
    try {
      const data = await getRegistrosServicios();
      setRegistrosServicios(data || []);
    } catch (e) {
      console.error("Error al cargar registros de servicios:", e);
    } finally {
      setLoadingRegistros(false);
    }
  };

  useEffect(() => {
    cargarRegistrosServicios();
  }, []);

  // Detector en tiempo real de caso duplicado (base de datos y sesión actual)
  useEffect(() => {
    const term = (datosExtraidos.numero_caso || "").trim().toLowerCase();
    if (!term || term.length < 3) {
      setCasoDuplicadoEncontrado(null);
      return;
    }

    // Buscar coincidencias exactas o normalizadas en registros de servicios o en servicios de cuentas de cobro
    const match =
      registrosServicios.find((r) => {
        const caso = (r.numero_caso || "").trim().toLowerCase();
        return caso === term || (caso.length >= 4 && (caso.includes(term) || term.includes(caso)));
      }) ||
      servicios.find((s) => {
        const caso = (s.numero_caso || "").trim().toLowerCase();
        return caso === term || (caso.length >= 4 && (caso.includes(term) || term.includes(caso)));
      });

    setCasoDuplicadoEncontrado(match || null);
  }, [datosExtraidos.numero_caso, registrosServicios, servicios]);

  const handleAutocompletarCaso = (casoPrevio) => {
    if (!casoPrevio) return;
    setDatosExtraidos((prev) => ({
      ...prev,
      numero_caso: casoPrevio.numero_caso || prev.numero_caso,
      fecha_solicitud: casoPrevio.fecha_solicitud || prev.fecha_solicitud,
      fecha_atencion: casoPrevio.fecha_atencion || prev.fecha_atencion,
      fecha_finalizacion: casoPrevio.fecha_finalizacion || prev.fecha_finalizacion,
      mesa: casoPrevio.mesa || prev.mesa,
      proveedor: casoPrevio.proveedor || prev.proveedor,
      cliente: casoPrevio.cliente || prev.cliente,
      coordinador: casoPrevio.coordinador || prev.coordinador,
      valor_servicios: typeof casoPrevio.valor_servicios === "number" ? casoPrevio.valor_servicios : (prev.valor_servicios || 0),
      valor_viaticos: typeof casoPrevio.valor_viaticos === "number" ? casoPrevio.valor_viaticos : (prev.valor_viaticos || 0),
      valor_materiales: typeof casoPrevio.valor_materiales === "number" ? casoPrevio.valor_materiales : (prev.valor_materiales || 0),
      sh: casoPrevio.sh || prev.sh,
      tecnico: casoPrevio.tecnico || prev.tecnico,
      medio: casoPrevio.medio || prev.medio,
      equipo: casoPrevio.equipo || prev.equipo,
      falla: casoPrevio.falla || prev.falla,
      causa: casoPrevio.causa || prev.causa,
      solucion: casoPrevio.solucion || prev.solucion,
      pruebas: casoPrevio.pruebas || prev.pruebas,
      horas: casoPrevio.horas || prev.horas
    }));

    if (casoPrevio.plantilla_completa && !plantillaTexto) {
      setPlantillaTexto(casoPrevio.plantilla_completa);
    }

    setDescartarAlertaDuplicado(true);
  };

  // 1. Manejo, previsualización inmediata y compresión de imágenes
  const handleImageSelect = async (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.)");
      return;
    }

    // A. Previsualización instantánea (Optimistic UI)
    try {
      const objectUrl = URL.createObjectURL(file);
      setImagenPreview(objectUrl);
      setMimeType(file.type || "image/png");
    } catch (previewErr) {
      console.warn("No se pudo generar ObjectURL, usando FileReader directo:", previewErr);
    }

    // B. Procesamiento y compresión en segundo plano
    try {
      let fileToProcess = file;
      // Comprimir solo si excede 1MB para proteger el rendimiento en móviles
      if (file.size > 1024 * 1024) {
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: false // Evita bloqueos en navegadores móviles / WebViews
          };
          fileToProcess = await imageCompression(file, options);
        } catch (compErr) {
          console.warn("Compresión no disponible en este dispositivo, usando archivo original:", compErr);
          fileToProcess = file;
        }
      }

      // Convertir a Base64 para consumo por Gemini API
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          // Si el objectURL falló o para unificar preview persistente
          setImagenPreview(result);
          const base64Data = result.split(",")[1];
          setImagenBase64(base64Data);
          setMimeType(fileToProcess.type || file.type || "image/png");
        }
      };
      reader.readAsDataURL(fileToProcess);
    } catch (err) {
      console.error("Error procesando imagen:", err);
      // Fallback directo sin compresión
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImagenPreview(reader.result);
          setImagenBase64(reader.result.split(",")[1]);
          setMimeType(file.type || "image/png");
        }
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

  // 2. Procesamiento con IA Multimodal (Gemini vía /api/gemini)
  /**
 * ESTADO CONSOLIDADO DESPUÉS DEL PROCESO UNIFICADO
 * 
 * Este objeto representa el estado final después de hacer clic en "Procesar Servicio con IA":
 * - Datos extraídos de la imagen OCR (o vacíos si no hubo imagen)
 * - Datos manuales escritos por el técnico (notas)
 * - Plantilla institucional del banco (puede ser bruta o ya mapeada por IA)
 * - Plantilla corporativa generada lista para usar
 * - Datos listos para integrar con módulo de cuentas de cobro
 */

const handleProcesarIA = async () => {
  // 1. Validar que haya alguna entrada
  const hayEntrada = !!imagenBase64 || !!notasTecnico.trim() || !!plantillaInstitucional.trim();
  if (!hayEntrada) {
    alert(
      "Por favor sube una captura de WhatsApp, escribe el requerimiento o pega la plantilla institucional del banco."
    );
    return;
  }

  // 2. Verificar que el motor de IA esté listo
  if (motorListo === false) {
    setShowConfigKey(true);
    return;
  }

  setProcesandoIA(true);
  setErrorIA(null);

  try {
    // 3. PASO A: Extracción OCR multimodal + procesamiento de texto
    //    El servicio Gemini recibe: imagen, notas técnicas, plantilla institucional
    //    y devuelve datos estructurados + plantilla completa
    const resultado = await extraerDatosDeServicio({
      imagenBase64,
      mimeType,
      textoNotas: notasTecnico,
      plantillaInstitucional,
      modelId: selectedModel
    });

    // 4. Consolidar datos: fusionar lo extraído por IA con lo que el técnico escribió
    //    - Valores vacíos del IA se descartan (no sobrescriben captura manual)
    // - Lo manual del técnico se preserva como prioridad
    const limpios = {};
    for (const [clave, valor] of Object.entries(resultado)) {
      if (valor === null || valor === undefined || valor === "") continue;
      limpios[clave] = valor;
    }

    // Combinar datosExtraidos (manuales) con limpios (de IA)
    // La lógica prioriza lo que el técnico escribió, pero llena huecos con la IA
    const combinados = {
      ...datosExtraidos,
      ...limpios,
      horas: {
        ...datosExtraidos.horas,
        ...(resultado.horas || {})
      }
    };

    // 5. Actualizar estado global de datos extraídos
    setDatosExtraidos(combinados);

    // 6. PASO B: Generar plantilla corporativa oficial
    //    Comportamiento dinámico tipo espejo: se toma la plantilla institucional
    //    de entrada exactamente como molde y se autocompleta con contexto.
    //    Sin plantillas fijas, estáticas ni quemadas.
    const tienePlantillaInstitucional = !!plantillaInstitucional.trim();
    let plantillaFinal = "";

    if (tienePlantillaInstitucional) {
      if (resultado.plantilla_completa && resultado.plantilla_completa.trim()) {
        plantillaFinal = resultado.plantilla_completa;
      } else {
        try {
          plantillaFinal = await generarPlantillaDesdeInstitucional({
            plantillaInstitucional,
            textoNotas: notasTecnico,
            datos: combinados,
            modelId: selectedModel
          });
        } catch (errP) {
          console.warn("Fallo mapeo dedicado de plantilla:", errP);
        }
      }

      if (!plantillaFinal) {
        plantillaFinal = generarPlantillaSolucion(combinados, plantillaInstitucional);
      }
    } else {
      plantillaFinal = "";
    }

    setPlantillaTexto(plantillaFinal);

    // 7. PASO C: Intentar integrar con módulo de cuentas de cobro
    //    Llamar al handler que actualiza el contexto global sin alterar cálculos existentes
    try {
      // Importar dinámicamente para evitar dependencias circulares en render
      // y asegurar que la lógica de cálculo de cuentas permanezca intacta
      const { actualizarServicioEnCuentasCobro } = await import(
        "../../services/cuentaCobroService"
      );
      if (combinados.numero_caso) {
        actualizarServicioEnCuentasCobro({
          ...combinados,
          plantilla_corporativa: plantillaFinal,
          fuente: "soporte_tecnico_unificado"
        });
        // Nota: Esta función solo actualiza el state global; los cálculos
        // de formato de moneda, número a letras y generación de Excel
        // permanecen completamente intactos en sus módulos respectivos.
      }
    } catch (e) {
      // Si el servicio de integración no está disponible o falla,
      // el proceso continúa y el usuario puede agregar manualmente después
      console.log("Integración con cuentas de cobro no disponible o ya configurada");
    }

    // 8. Éxito: indicar al usuario qué sucedió
    setProcesandoIA(false);
    // Pequeña retroalimentación visual - el botón ya muestra el estado
    // y los datos se reflejan inmediatamente en los campos relacionados

  } catch (err) {
    console.error("Error al procesar con Gemini:", err);
    setErrorIA(
      err.message || "Error procesando con Gemini. Revisa tu API Key o conexión."
    );
  } finally {
    setProcesandoIA(false);
  }
};

  // 2b. Regenerar sólo la Plantilla Corporativa Oficial desde el texto institucional,
  // sin reprocesar la captura. Útil tras editar el requerimiento del banco.
  const handleGenerarPlantilla = async () => {
    if (!plantillaInstitucional.trim()) {
      alert("Por favor pega la plantilla institucional en el cuadro superior para usarla como molde espejo.");
      return;
    }
    if (motorListo === false) {
      setShowConfigKey(true);
      return;
    }

    setGenerandoPlantilla(true);
    setErrorIA(null);

    try {
      // Si hubo un proceso unificado previo, datosExtraidos ya contendrá los datos
      // consolidados. Si no, usaremos los valores por defecto.
      const datosAProcesar = { ...datosExtraidos };

      const plantilla = await generarPlantillaDesdeInstitucional({
        plantillaInstitucional,
        textoNotas: notasTecnico,
        datos: datosAProcesar,
        modelId: selectedModel
      });
      if (plantilla) {
        setPlantillaTexto(plantilla);
      } else {
        const fallback = generarPlantillaSolucion(datosAProcesar, plantillaInstitucional);
        setPlantillaTexto(fallback);
      }
    } catch (err) {
      console.error("Error al generar la plantilla con Gemini:", err);
      const fallback = generarPlantillaSolucion(datosExtraidos, plantillaInstitucional);
      if (fallback) {
        setPlantillaTexto(fallback);
      }
      setErrorIA(err.message || "Error generando la plantilla corporativa.");
    } finally {
      setGenerandoPlantilla(false);
    }
  };

  // 3. Confirmar y Agregar Servicio (Separación Dual: Cuentas de Cobro vs. Registro de Servicios)
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

      const plantillaFinal = plantillaTexto || generarPlantillaSolucion(datosExtraidos, plantillaInstitucional);

      // A. Guardar en Cuenta de Cobro (datos financieros y liquidación)
      const nuevoServicio = {
        ...datosExtraidos,
        plantilla_completa: plantillaFinal,
        foto_url: fotoUrlRemota || imagenPreview
      };

      const guardado = await guardarServicioSoporte(nuevoServicio);
      setServicios((prev) => [...prev, guardado]);

      // B. Guardar de forma independiente en Registro de Servicios e Historial de Plantillas IT
      const nuevoRegistro = {
        numero_caso: datosExtraidos.numero_caso,
        fecha_solicitud: datosExtraidos.fecha_solicitud,
        fecha_atencion: datosExtraidos.fecha_atencion,
        fecha_finalizacion: datosExtraidos.fecha_finalizacion,
        mesa: datosExtraidos.mesa,
        proveedor: datosExtraidos.proveedor,
        cliente: datosExtraidos.cliente,
        coordinador: datosExtraidos.coordinador,
        equipo: datosExtraidos.equipo,
        falla: datosExtraidos.falla,
        causa: datosExtraidos.causa,
        solucion: datosExtraidos.solucion,
        pruebas: datosExtraidos.pruebas,
        horas: datosExtraidos.horas,
        sh: datosExtraidos.sh,
        tecnico: datosExtraidos.tecnico,
        medio: datosExtraidos.medio,
        plantilla_completa: plantillaFinal,
        foto_url: fotoUrlRemota || imagenPreview
      };

      const guardadoReg = await guardarRegistroServicio(nuevoRegistro);
      setRegistrosServicios((prev) => [guardadoReg, ...prev.filter((r) => r.id !== guardadoReg.id)]);

      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);

      // Limpieza total automática de todos los campos e inputs del formulario
      resetFormulario();

      // Cambiar a la pestaña de Cuentas de Cobro para ver el impacto
      setTab("cuentas");
    } catch (err) {
      alert("No se pudo agregar a la cuenta de cobro: " + err.message);
    }
  };

  // 3b. Handlers para el Módulo Independiente de Registro de Servicios
  const handleEliminarRegistroServicio = async (id) => {
    if (confirm("¿Estás seguro de eliminar este registro del historial de plantillas? La cuenta de cobro financiera permanecerá intacta.")) {
      await eliminarRegistroServicio(id);
      setRegistrosServicios((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleCopiarPlantillaRegistro = (plantilla) => {
    if (!plantilla) return;
    navigator.clipboard.writeText(plantilla);
  };

  const handleDepurarMesRegistros = async () => {
    if (mostrarTodosReg) {
      alert("Por favor selecciona un mes específico para ejecutar la depuración mensual.");
      return;
    }
    const nombreMes = NOMBRES_MESES[filtroMesReg - 1];
    const confirmacion = confirm(
      `⚠️ ¿CONFIRMAS LA DEPURACIÓN MENSUAL DE PLANTILLAS?\n\n` +
      `Periodo a depurar: ${nombreMes} ${filtroAnioReg}\n\n` +
      `✓ Se eliminarán ÚNICAMENTE los registros y plantillas de este mes en el REGISTRO DE SERVICIOS.\n` +
      `✓ Tus cuentas de cobro y registros financieros NO se alterarán ni se borrarán.`
    );
    if (!confirmacion) return;

    setDepurando(true);
    try {
      const { depurados, restantes } = await depurarRegistrosServiciosPorMes(filtroMesReg, filtroAnioReg);
      setRegistrosServicios(restantes);
      alert(`Depuración exitosa: Se eliminaron ${depurados} registro(s) de plantillas de ${nombreMes} ${filtroAnioReg}. Las cuentas de cobro siguen intactas.`);
    } catch (e) {
      alert("Error al depurar registros: " + e.message);
    } finally {
      setDepurando(false);
    }
  };

  // 4. Exportar a Excel Oficial (.xlsx) Segmentado por Periodo y Proveedor
  const handleDescargarExcel = async () => {
    if (serviciosFiltrados.length === 0) {
      alert("No hay servicios para exportar con los filtros seleccionados (Mes: " + 
        (mostrarTodos ? "Histórico" : `${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio}`) +
        (filtroProveedor ? `, Proveedor: ${filtroProveedor}` : "") + ").");
      return;
    }
    const listaAExportar = serviciosFiltrados;
    setExportandoExcel(true);
    try {
      const buffer = await generarExcelCuentaCobro(listaAExportar, {
        nombre: "Jhon Alexander Vasquez Reveló",
        cedula: "10308105",
        empresa: filtroProveedor || "R&S Soluciones"
      });
      const proveedorNombre = filtroProveedor ? filtroProveedor.replace(/[\/\\:*?"<>|]/g, "_") : "R&S Soluciones";
      const periodoTexto = mostrarTodos
        ? "Consolidado_Historico"
        : `${NOMBRES_MESES[filtroMes - 1]}_${filtroAnio}`;
      descargarExcelEnNavegador(
        buffer,
        `Cuenta de Cobro - ${proveedorNombre} (${periodoTexto} - ${listaAExportar.length} casos).xlsx`
      );
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

  // Alternar estado de pago de una fila: 'confirmed' ↔ 'pending'
  const handleTogglePaymentStatus = async (id) => {
    const servActual = servicios.find((s) => s.id === id);
    const estadoActual = paymentStatusMap[id] || servActual?.payment_status || "confirmed";
    const nuevoEstado = estadoActual === "confirmed" ? "pending" : "confirmed";

    // Actualización optimista en mapa local y lista reactiva
    setPaymentStatusMap((prev) => ({ ...prev, [id]: nuevoEstado }));
    setServicios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, payment_status: nuevoEstado } : s))
    );

    // Persistencia en Supabase / LocalStorage
    if (servActual) {
      try {
        await actualizarServicioSoporte({
          ...servActual,
          payment_status: nuevoEstado
        });
      } catch (err) {
        console.warn("Error persistiendo estado de pago:", err);
      }
    }
  };

  // Dictado por Voz (Web Speech API nativa) - refactorizado: sólo se acumulan
  // bloques con isFinal === true, eliminando la repetición infinita de palabras.
  const { isDictando: isDictating, toggle: toggleDictado, detener: detenerDictado } = useDictadoVoz({
    lang: "es-CO",
    onTexto: (texto) => setNotasTecnico(texto.slice(0, 5000)),
    onError: (mensaje) => setErrorDictado(mensaje)
  });

  // `notasTecnico` dentro de este handler es siempre el valor del último render,
  // por lo que el texto previo del técnico se conserva como base del dictado.
  const handleVoiceDictation = () => {
    setErrorDictado(null);
    toggleDictado(() => notasTecnico);
  };

  // Resetear formulario después de guardar
  const resetFormulario = () => {
    detenerDictado();
    setErrorDictado(null);
    setImagenPreview(null);
    setImagenBase64(null);
    setNotasTecnico("");
    setPlantillaInstitucional("");
    setPlantillaTexto("");
    setCasoDuplicadoEncontrado(null);
    setDescartarAlertaDuplicado(false);
    setDatosExtraidos({
      numero_caso: "", fecha_solicitud: "", fecha_atencion: "", fecha_finalizacion: "",
      mesa: "", proveedor: "", cliente: "", coordinador: "", valor_servicios: 0, valor_viaticos: 0,
      valor_materiales: 0, sh: "SOFTWARE - HARDWARE", tecnico: "", medio: "SITIO",
      equipo: "", falla: "", causa: "", solucion: "", pruebas: "",
      horas: { inicio: "", fin: "", desplazamiento: "" }
    });
  };

  // Nombres de meses en español para filtrado
  const NOMBRES_MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Helper para extraer mes y año de cualquier formato de fecha del servicio
  const extraerMesAnio = (s) => {
    const fechas = [s.fecha_atencion, s.fecha_solicitud, s.fecha_finalizacion];
    for (const f of fechas) {
      if (!f || typeof f !== "string") continue;
      const fTrim = f.trim();
      const mDMY = fTrim.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (mDMY) {
        return { mes: parseInt(mDMY[2], 10), anio: parseInt(mDMY[3], 10) };
      }
      const mYMD = fTrim.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (mYMD) {
        return { mes: parseInt(mYMD[2], 10), anio: parseInt(mYMD[1], 10) };
      }
    }
    if (s.creado_en) {
      const d = new Date(s.creado_en);
      if (!isNaN(d.getTime())) {
        return { mes: d.getMonth() + 1, anio: d.getFullYear() };
      }
    }
    return null;
  };

  // Identificar los años presentes en los servicios (más el año actual)
  const aniosDisponibles = Array.from(
    new Set([
      ahora.getFullYear(),
      ...servicios.map((s) => extraerMesAnio(s)?.anio).filter(Boolean)
    ])
  ).sort((a, b) => b - a);

  // Servicios filtrados según el periodo activo (mes y año o todos) y proveedor seleccionado
  const serviciosFiltrados = servicios.filter((s) => {
    // 1. Filtrado por Proveedor / Entidad
    if (filtroProveedor && (s.proveedor || "").trim().toLowerCase() !== filtroProveedor.trim().toLowerCase()) {
      return false;
    }

    // 2. Filtrado por Periodo (Mes y Año)
    if (mostrarTodos) return true;
    const info = extraerMesAnio(s);
    if (!info) return false;
    return info.mes === Number(filtroMes) && info.anio === Number(filtroAnio);
  });

  // Años disponibles para el Registro de Servicios
  const aniosDisponiblesReg = Array.from(
    new Set([
      ahora.getFullYear(),
      ...registrosServicios.map((r) => extraerMesAnio(r)?.anio).filter(Boolean)
    ])
  ).sort((a, b) => b - a);

  // Registros de Servicios e Historial de Plantillas filtrados (búsqueda por N° Caso + Mes y Año)
  const registrosServiciosFiltrados = registrosServicios.filter((r) => {
    // A. Búsqueda rápida por N° de Caso, Cliente o Falla
    if (busquedaCaso.trim()) {
      const q = busquedaCaso.trim().toLowerCase();
      const coincideCaso = r.numero_caso?.toLowerCase().includes(q);
      const coincideCliente = r.cliente?.toLowerCase().includes(q);
      const coincideEquipo = r.equipo?.toLowerCase().includes(q);
      const coincideFalla = r.falla?.toLowerCase().includes(q);
      if (!coincideCaso && !coincideCliente && !coincideEquipo && !coincideFalla) {
        return false;
      }
    }

    // B. Filtrado por Mes y Año
    if (mostrarTodosReg) return true;
    const info = extraerMesAnio(r);
    if (!info) return false;
    return info.mes === Number(filtroMesReg) && info.anio === Number(filtroAnioReg);
  });

  // Cálculos de Totales de la Cuenta de Cobro (dinámicos según el periodo y proveedor seleccionado)
  const totalServicios = serviciosFiltrados.reduce((acc, s) => acc + (Number(s.valor_servicios) || 0), 0);
  const totalViaticos = serviciosFiltrados.reduce((acc, s) => acc + (Number(s.valor_viaticos) || 0), 0);
  const totalMateriales = serviciosFiltrados.reduce((acc, s) => acc + (Number(s.valor_materiales) || 0), 0);
  const granTotal = totalServicios + totalViaticos + totalMateriales;
  const textoEnLetras = numeroALetras(granTotal);

  // Handler para iniciar la edición de un registro
  const handleAbrirEditarServicio = (servicio) => {
    setEditandoServicio(servicio);
    setEditFormData({
      id: servicio.id,
      numero_caso: servicio.numero_caso || "",
      fecha_solicitud: servicio.fecha_solicitud || "",
      fecha_atencion: servicio.fecha_atencion || "",
      fecha_finalizacion: servicio.fecha_finalizacion || "",
      mesa: servicio.mesa || "2",
      proveedor: servicio.proveedor || "",
      cliente: servicio.cliente || "",
      coordinador: servicio.coordinador || "",
      valor_servicios: servicio.valor_servicios ?? 0,
      valor_viaticos: servicio.valor_viaticos ?? 0,
      valor_materiales: servicio.valor_materiales ?? 0,
      sh: servicio.sh || "SOFTWARE - HARDWARE",
      tecnico: servicio.tecnico || "Jhon Alexander Vasquez Reveló",
      medio: servicio.medio || "SITIO",
      equipo: servicio.equipo || "",
      falla: servicio.falla || "",
      causa: servicio.causa || "",
      solucion: servicio.solucion || "",
      pruebas: servicio.pruebas || "",
      horas: servicio.horas || {},
      plantilla_completa: servicio.plantilla_completa || "",
      foto_url: servicio.foto_url || "",
      creado_en: servicio.creado_en
    });
  };

  // Handler para guardar los cambios de edición en Supabase y refrescar el estado
  const handleGuardarEdicion = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editFormData.numero_caso?.trim()) {
      alert("El N° de Caso es obligatorio.");
      return;
    }
    setGuardandoEdicion(true);
    try {
      const actualizado = await actualizarServicioSoporte(editFormData);
      setServicios((prev) =>
        prev.map((s) => (s.id === actualizado.id ? { ...s, ...actualizado } : s))
      );
      setEditandoServicio(null);
    } catch (err) {
      alert("Error al actualizar servicio: " + err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

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
  const labelColor = isDark ? "#E2E8F0" : "#334155";
  const textTitle = isDark ? "#FFFFFF" : "#0F172A";
  const textSub = isDark ? "#CBD5E1" : "#475569";

  return (
    <div style={{ color: isDark ? "#fff" : "#0F172A", width: "100%", paddingBottom: 60 }}>
      {/* ── Encabezado Principal Corporativo (tema adaptativo) ── */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(135deg, #0f2944 0%, #0c1a35 100%)"
            : "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
          border: isDark ? "1px solid rgba(56,189,248,0.2)" : "1px solid #BFDBFE",
          borderRadius: 20,
          padding: "20px 24px",
          marginBottom: 20,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.45)"
            : "0 4px 20px rgba(59,130,246,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                background: C.coral,
                color: "#fff",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em"
              }}>
                IT & FIELD OPS
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)",
                color: isDark ? "#6ee7b7" : "#059669",
                border: isDark ? "1px solid rgba(16,185,129,0.4)" : "1px solid #6EE7B7",
                padding: "2px 8px", borderRadius: 12, fontSize: 10.5
              }}>
                <ShieldCheck size={12} /> RBAC: {SOPORTE_ADMIN_EMAIL}
              </span>
            </div>
            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: "4px 0 4px",
              letterSpacing: "-0.02em",
              color: isDark ? "#F8FAFC" : "#0F172A"
            }}>
              Módulo Inteligente de Soporte Técnico
            </h1>
            <p style={{ fontSize: 13, margin: 0, color: isDark ? "rgba(255,255,255,0.65)" : "#475569" }}>
              OCR Multimodal Gemini · Plantillas corporativas · Cuentas de cobro automáticas
            </p>
          </div>

          {/* Selector de Modelos y API Key */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                background: isDark ? "rgba(15,23,42,0.9)" : "#fff",
                border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #CBD5E1",
                color: isDark ? "#fff" : "#0F172A",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              {MODELOS_GEMINI.map((m) => (
                <option key={m.id} value={m.id} style={{ background: isDark ? "#0f172a" : "#fff" }}>
                  {m.nombre}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowConfigKey(true)}
              title="Diagnosticar la conexión segura con Google Gemini"
              style={{
                background: motorListo === false
                  ? (isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.12)")
                  : (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)"),
                border: motorListo === false
                  ? (isDark ? "1px solid #f59e0b" : "1px solid #FCD34D")
                  : (isDark ? "1px solid #10b981" : "1px solid #6EE7B7"),
                color: motorListo === false
                  ? (isDark ? "#fef08a" : "#92400E")
                  : (isDark ? "#a7f3d0" : "#059669"),
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
              {motorListo === false ? <Key size={14} /> : <ShieldCheck size={14} />}
              <span>
                {motorListo === null
                  ? "Comprobando Gemini..."
                  : motorListo
                    ? "✓ Gemini Conectado"
                    : "Configurar Gemini"}
              </span>
            </button>

            {/* ── Botón Limpiar / Nuevo (F5) ── */}
            <button
              type="button"
              onClick={() => {
                resetFormulario();
                setTab("ia");
              }}
              title="Limpiar todo el formulario y comenzar un nuevo registro desde cero (F5)"
              style={{
                background: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)",
                border: isDark ? "1px solid rgba(245,158,11,0.4)" : "1px solid #FCD34D",
                color: isDark ? "#FCD34D" : "#92400E",
                padding: "8px 13px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s"
              }}
            >
              <RefreshCw size={14} />
              <span>Limpiar / Nuevo</span>
              <span style={{
                background: isDark ? "rgba(0,0,0,0.3)" : "rgba(146,64,14,0.12)",
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em"
              }}>F5</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div style={{
          display: "flex", gap: 8, marginTop: 18,
          borderTop: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #BFDBFE",
          paddingTop: 14, flexWrap: "wrap"
        }}>
          <button
            onClick={() => setTab("ia")}
            style={{
              background: tab === "ia"
                ? (isDark ? "rgba(56,189,248,0.25)" : "rgba(59,130,246,0.12)")
                : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"),
              border: tab === "ia"
                ? (isDark ? "1.5px solid #38bdf8" : "1.5px solid #3B82F6")
                : (isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1"),
              color: tab === "ia"
                ? (isDark ? "#ffffff" : "#1D4ED8")
                : (isDark ? "rgba(255,255,255,0.7)" : "#475569"),
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
            }}
          >
            <Sparkles size={16} /> 1. OCR Multimodal & Plantilla
          </button>

          <button
            onClick={() => setTab("cuentas")}
            style={{
              background: tab === "cuentas"
                ? (isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.12)")
                : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"),
              border: tab === "cuentas"
                ? (isDark ? "1.5px solid #10b981" : "1.5px solid #10B981")
                : (isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1"),
              color: tab === "cuentas"
                ? (isDark ? "#ffffff" : "#065F46")
                : (isDark ? "rgba(255,255,255,0.7)" : "#475569"),
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
            }}
          >
            <FileSpreadsheet size={16} /> 2. Cuenta de Cobro ({serviciosFiltrados.length} casos — {formatearMonedaCOP(granTotal)})
          </button>

          <button
            onClick={() => setTab("registro")}
            style={{
              background: tab === "registro"
                ? (isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.12)")
                : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"),
              border: tab === "registro"
                ? (isDark ? "1.5px solid #f59e0b" : "1.5px solid #D97706")
                : (isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1"),
              color: tab === "registro"
                ? (isDark ? "#ffffff" : "#B45309")
                : (isDark ? "rgba(255,255,255,0.7)" : "#475569"),
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
            }}
          >
            <Layers size={16} /> 3. Registro de Servicios ({registrosServiciosFiltrados.length} plantillas IT)
          </button>

          <button
            onClick={() => setTab("almacenamiento")}
            style={{
              background: tab === "almacenamiento"
                ? (isDark ? "rgba(168,85,247,0.25)" : "rgba(168,85,247,0.10)")
                : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"),
              border: tab === "almacenamiento"
                ? (isDark ? "1.5px solid #c084fc" : "1.5px solid #A855F7")
                : (isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1"),
              color: tab === "almacenamiento"
                ? (isDark ? "#ffffff" : "#6B21A8")
                : (isDark ? "rgba(255,255,255,0.7)" : "#475569"),
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
            }}
          >
            <Clock size={16} /> 4. TTL Almacenamiento (7 Días)
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: ASISTENTE IA & OCR MULTIMODAL */}
      {tab === "ia" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Zona de Entrada: Imagen, Plantilla Institucional y Detalle del Servicio */}
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
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageSelect(e.target.files[0]);
                    }
                    e.target.value = "";
                  }}
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

              {/* Acciones zona de imagen */}
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: textSub, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13 }}>💡</span> También puedes pegar con <strong>Ctrl+V</strong>
                  </span>
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

                {/* Botón principal: Extraer Datos de Imagen */}
                {imagenBase64 && (
                  <button
                    type="button"
                    disabled={procesandoIA}
                    onClick={handleProcesarIA}
                    style={{
                      width: "100%",
                      background: procesandoIA
                        ? (isDark ? "rgba(100,116,139,0.5)" : "#E2E8F0")
                        : "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      border: "none",
                      color: procesandoIA ? (isDark ? "#94A3B8" : "#475569") : "#fff",
                      borderRadius: 10,
                      padding: "11px 16px",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: procesandoIA ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: procesandoIA ? "none" : "0 4px 14px rgba(2,132,199,0.4)",
                      transition: "all 0.2s"
                    }}
                  >
                    <Eye size={16} />
                    {procesandoIA ? "Extrayendo datos con OCR..." : "Extraer Datos de Imagen"}
                  </button>
                )}
              </div>
            </div>

            {/* Tarjeta de Entrada de Notas / Requerimiento */}
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                borderRadius: 16,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              {/* Encabezado con botón de voz */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textTitle, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <FileText size={15} color="#0284c7" /> Detalle del Servicio
                  </div>
                  <div style={{ fontSize: 11.5, color: textSub }}>
                    Complementa la plantilla institucional con notas, dictadas o escritas por el técnico.
                  </div>
                </div>
                {/* Botón Dictado por Voz */}
                <button
                  type="button"
                  onClick={handleVoiceDictation}
                  title={isDictating ? "Detener dictado" : "Iniciar dictado por voz (es-CO)"}
                  style={{
                    flexShrink: 0,
                    background: isDictating
                      ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                      : (isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9"),
                    border: isDictating
                      ? "none"
                      : (isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #CBD5E1"),
                    color: isDictating ? "#fff" : (isDark ? "#94A3B8" : "#475569"),
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                    boxShadow: isDictating ? "0 0 0 3px rgba(239,68,68,0.3)" : "none",
                    animation: isDictating ? "pulse 1.5s ease infinite" : "none"
                  }}
                >
                  <Volume2 size={14} />
                  {isDictating ? "■ Detener" : "🎙 Dictar"}
                </button>
              </div>

              {/* Campo Requerimiento */}
              <textarea
                value={notasTecnico}
                onChange={(e) => setNotasTecnico(e.target.value)}
                maxLength={5000}
                placeholder={isDictating
                  ? "🎙 Escuchando... habla ahora en español..."
                  : "Pega aquí el mensaje de WhatsApp, descripción de la falla, horas de atención, equipo afectado o cualquier detalle del servicio prestado..."
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: 140,
                  background: isDictating
                    ? (isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.04)")
                    : (isDark ? "rgba(0,0,0,0.35)" : "#F8FAFC"),
                  border: isDictating
                    ? "1.5px solid rgba(239,68,68,0.5)"
                    : (isDark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #CBD5E1"),
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: isDark ? "#F1F5F9" : "#0F172A",
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => { if (!isDictating) e.target.style.borderColor = "#0284c7"; }}
                onBlur={(e) => { if (!isDictating) e.target.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1"; }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {isDictating && (
                  <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "pulse 1s ease infinite" }} />
                    Escuchando en español...
                  </span>
                )}
                <span style={{ fontSize: 11, color: textSub, marginLeft: "auto" }}>
                  {notasTecnico.length} / 5000 caracteres
                </span>
              </div>

              {errorDictado && (
                <div
                  role="alert"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    background: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.45)",
                    color: isDark ? "#FCA5A5" : "#B91C1C",
                    borderRadius: 10, padding: "8px 10px", fontSize: 11.5, fontWeight: 600
                  }}
                >
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{errorDictado}</span>
                </div>
              )}

              {/* CTA Procesar Servicio con IA */}
              <button
                type="button"
                disabled={procesandoIA}
                onClick={handleProcesarIA}
                style={{
                  width: "100%",
                  background: procesandoIA
                    ? (isDark ? "rgba(100,116,139,0.5)" : "#E2E8F0")
                    : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  border: "none",
                  color: procesandoIA ? (isDark ? "#94A3B8" : "#64748B") : "#fff",
                  borderRadius: 12,
                  padding: "13px 18px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: procesandoIA ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: procesandoIA ? "none" : "0 6px 20px rgba(2,132,199,0.35)",
                  transition: "all 0.2s",
                  letterSpacing: "0.01em"
                }}
              >
                <Sparkles size={17} />
                {procesandoIA ? "Analizando con Gemini AI..." : "Procesar Servicio con IA"}
              </button>
            </div>
          </div>

          {/* ══ ENTRADA DE PLANTILLA INSTITUCIONAL DEL BANCO ══ */}
          <div
            style={{
              background: cardBg,
              border: isDark ? "1.5px solid rgba(168, 85, 247, 0.35)" : "1.5px solid #e9d5ff",
              boxShadow: cardShadow,
              borderRadius: 18,
              padding: 20
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 14
              }}
            >
              <div style={{ flex: 1, minWidth: 260 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: isDark ? "#d8b4fe" : "#7e22ce"
                  }}
                >
                  <FileSpreadsheet size={17} /> Plantilla Institucional del Banco
                </h3>
                <span style={{ fontSize: 11.5, color: textSub, display: "block", marginTop: 3 }}>
                  Pega aquí el requerimiento o la plantilla oficial tal como la entrega la entidad
                  (AV&nbsp;Villas, Popular, Almaviva, Davivienda…). El texto se envía en bruto y la IA
                  mapea cada campo en la <strong>Plantilla Corporativa Oficial</strong>, sin importar
                  su extensión o formato.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    background: isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.1)",
                    color: isDark ? "#d8b4fe" : "#7e22ce",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontWeight: 700,
                    whiteSpace: "nowrap"
                  }}
                >
                  hasta {MAX_PLANTILLA_INSTITUCIONAL.toLocaleString("es-CO")} caracteres
                </span>
                {plantillaInstitucional && (
                  <button
                    type="button"
                    onClick={() => setPlantillaInstitucional("")}
                    title="Limpiar la plantilla institucional"
                    style={{
                      background: "none",
                      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #FECACA",
                      color: isDark ? "#94A3B8" : "#B91C1C",
                      padding: "5px 10px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap"
                    }}
                  >
                    <Trash2 size={13} /> Limpiar
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={plantillaInstitucional}
              onChange={(e) =>
                setPlantillaInstitucional(e.target.value.slice(0, MAX_PLANTILLA_INSTITUCIONAL))
              }
              maxLength={MAX_PLANTILLA_INSTITUCIONAL}
              placeholder={
                "Pega aquí la plantilla o requerimiento del banco tal como llega, por ejemplo:\n\n" +
                "BANCO POPULAR — FORMATO DE SOLICITUD DE SOPORTE TÉCNICO\n" +
                "=================================================\n" +
                "N° de Caso: RE26014844 / RF637620\n" +
                "Fecha de solicitud: 23/09/2026\n" +
                "Mesa de soporte: 2\n" +
                "Cliente final: Jumbo Popayán\n" +
                "Coordinador: Oswaldo\n" +
                "Equipo / Serial: W005290ADM15 - MJOG6EFA\n" +
                "Tipo de medio: SITIO\n" +
                "SH / HW: Software - Hardware\n" +
                "Falla reportada: ACTUALIZACIÓN SISTEMA OPERATIVO\n" +
                "Detalle: se solicita actualización de SO a Windows 11 Enterprise, configuración\n" +
                "de dominio y habilitación de punto de red en sucursal.\n" +
                "Horario de atención: 11:00 am a 4:00 pm (desplazamiento 10:00 am)"
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                minHeight: 220,
                background: isDark ? "rgba(0,0,0,0.4)" : "#F8FAFC",
                border: isDark ? "1.5px solid rgba(168, 85, 247, 0.28)" : "1.5px solid #CBD5E1",
                borderRadius: 12,
                padding: "12px 14px",
                color: inputText,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12.5,
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                whiteSpace: "pre",
                overflowWrap: "normal",
                overflowX: "auto",
                transition: "all 0.2s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#A855F7";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark ? "rgba(168, 85, 247, 0.28)" : "#CBD5E1";
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 10
              }}
            >
              <span style={{ fontSize: 11, color: textSub }}>
                Se procesa con el botón <strong>Procesar Servicio con IA</strong> de abajo.
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    plantillaInstitucional.length > MAX_PLANTILLA_INSTITUCIONAL * 0.95
                      ? isDark
                        ? "#fcd34d"
                        : "#B45309"
                      : textSub
                }}
              >
                {plantillaInstitucional.length.toLocaleString("es-CO")} /{" "}
                {MAX_PLANTILLA_INSTITUCIONAL.toLocaleString("es-CO")} caracteres ·{" "}
                {plantillaInstitucional.trim()
                  ? plantillaInstitucional.trim().split(/\s+/).filter(Boolean).length
                  : 0}{" "}
                palabras
              </span>
            </div>
          </div>

          {/* ── Alerta de Error IA (alto contraste) ── */}
          {errorIA && (
            <div
              style={{
                background: isDark ? "#450A0A" : "#FEF2F2",
                border: isDark ? "1.5px solid #EF4444" : "none",
                borderLeft: "4px solid #DC2626",
                borderRadius: isDark ? 12 : "0 12px 12px 0",
                padding: "14px 18px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FCA5A5" : "#991B1B", marginBottom: 3 }}>
                    Error en el procesamiento con Gemini AI
                  </div>
                  <div style={{ fontSize: 12.5, color: isDark ? "#FCA5A5" : "#B91C1C", lineHeight: 1.5 }}>
                    {errorIA}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setShowConfigKey(true)}
                  style={{
                    background: "#DC2626",
                    border: "none",
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Revisar API Key
                </button>
                <button
                  onClick={() => setErrorIA(null)}
                  style={{
                    background: "none",
                    border: isDark ? "1px solid rgba(239,68,68,0.4)" : "1px solid #FECACA",
                    color: isDark ? "#FCA5A5" : "#B91C1C",
                    padding: "6px 10px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
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
                {/* N° Caso con Detección en Tiempo Real */}
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: labelColor, display: "block" }}>
                      N° de Caso / Código de servicio:
                    </label>
                    {casoDuplicadoEncontrado && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#F59E0B",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <AlertTriangle size={12} /> Caso ya registrado
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={datosExtraidos.numero_caso}
                    onChange={(e) => {
                      setDatosExtraidos({ ...datosExtraidos, numero_caso: e.target.value });
                      setDescartarAlertaDuplicado(false);
                    }}
                    placeholder="ej. RE26014844 / RF637620 o 2303375"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: casoDuplicadoEncontrado && !descartarAlertaDuplicado
                        ? "1.5px solid #F59E0B"
                        : inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5,
                      fontWeight: 600,
                      outline: "none"
                    }}
                  />

                  {/* Banner / Alerta Limpia y Amigable de Caso Duplicado */}
                  {casoDuplicadoEncontrado && !descartarAlertaDuplicado && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: isDark
                          ? "rgba(245, 158, 11, 0.12)"
                          : "#FFFBEB",
                        border: isDark
                          ? "1px solid rgba(245, 158, 11, 0.35)"
                          : "1px solid #FDE68A",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        animation: "fadeIn 0.2s ease-in-out"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <AlertTriangle
                            size={16}
                            style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: isDark ? "#FCD34D" : "#B45309"
                              }}
                            >
                              Este caso ya existe en el sistema
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: isDark ? "#E2E8F0" : "#78350F",
                                marginTop: 2,
                                lineHeight: 1.4
                              }}
                            >
                              Registrado previamente como <strong>"{casoDuplicadoEncontrado.numero_caso}"</strong>
                              {casoDuplicadoEncontrado.cliente ? ` para ${casoDuplicadoEncontrado.cliente}` : ""}
                              {casoDuplicadoEncontrado.fecha_solicitud || casoDuplicadoEncontrado.fecha_atencion
                                ? ` (${casoDuplicadoEncontrado.fecha_solicitud || casoDuplicadoEncontrado.fecha_atencion})`
                                : ""}.
                              <br />
                              ¿Desea autocompletar el formulario con los datos de este caso anterior?
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDescartarAlertaDuplicado(true)}
                          title="Cerrar aviso"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isDark ? "#94A3B8" : "#92400E",
                            cursor: "pointer",
                            padding: 2,
                            borderRadius: 4,
                            lineHeight: 1
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <button
                          type="button"
                          onClick={() => handleAutocompletarCaso(casoDuplicadoEncontrado)}
                          style={{
                            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 7,
                            padding: "6px 12px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            boxShadow: "0 2px 6px rgba(217, 119, 6, 0.3)"
                          }}
                        >
                          <Zap size={13} /> Sí, autocompletar formulario
                        </button>

                        <button
                          type="button"
                          onClick={() => setDescartarAlertaDuplicado(true)}
                          style={{
                            background: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
                            color: isDark ? "#CBD5E1" : "#6B7280",
                            border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #D1D5DB",
                            borderRadius: 7,
                            padding: "6px 10px",
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          No, continuar vacío
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Proveedor / Entidad con Memoria Histórica */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: labelColor }}>
                      Proveedor / Entidad:
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialProveedores.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-proveedores"
                    value={datosExtraidos.proveedor}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, proveedor: e.target.value })}
                    placeholder="ej. Cencosud, Grupo Aval, R&S..."
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

                {/* Cliente Final con Memoria Histórica */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: labelColor }}>
                      Cliente final:
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialClientes.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-clientes"
                    value={datosExtraidos.cliente}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, cliente: e.target.value })}
                    placeholder="ej. Banco de Bogotá, Banco Popular..."
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

                {/* Mesa con Memoria Histórica */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: labelColor }}>
                      Mesa / Tipo de soporte:
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialMesas.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-mesas"
                    value={datosExtraidos.mesa}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, mesa: e.target.value })}
                    placeholder="ej. Mesa IBM / Lexmark, 2..."
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

                {/* Coordinador con Memoria Histórica */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: labelColor }}>
                      Coordinador(a):
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialCoordinadores.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-coordinadores"
                    value={datosExtraidos.coordinador}
                    onChange={(e) => setDatosExtraidos({ ...datosExtraidos, coordinador: e.target.value })}
                    placeholder="ej. Valentina Tovar, Oswaldo..."
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
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={generandoPlantilla}
                  onClick={handleGenerarPlantilla}
                  title="Volver a mapear la plantilla institucional del banco"
                  style={{
                    background: isDark ? "rgba(16,185,129,0.15)" : "rgba(5,150,105,0.1)",
                    border: isDark ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(5,150,105,0.3)",
                    color: isDark ? "#6ee7b7" : "#047857",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: generandoPlantilla ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    opacity: generandoPlantilla ? 0.6 : 1
                  }}
                >
                  {generandoPlantilla ? <RefreshCw size={14} /> : <Wrench size={14} />}
                  {generandoPlantilla ? "Generando..." : "Regenerar"}
                </button>
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
                maxLength={20000}
                placeholder="Pega la plantilla institucional en el cuadro superior para que la IA la tome como espejo y la autocomplete aquí automáticamente..."
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: textSub }}>
                  Permite reportes extensos y detallados sin truncamiento
                </span>
                <span style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500 }}>
                  {plantillaTexto.length} / 5000+ caracteres permitidos
                </span>
              </div>

              {/* Botón Principal: Guardar Servicio en Inventario */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={async () => {
                    await handleAgregarACuentaCobro();
                  }}
                  style={{
                    width: "100%",
                    background: guardadoExitoso
                      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                    border: "none",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "15px 20px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: guardadoExitoso
                      ? "0 6px 20px rgba(16,185,129,0.5)"
                      : "0 6px 20px rgba(22,163,74,0.4)",
                    transition: "all 0.2s",
                    letterSpacing: "0.01em"
                  }}
                >
                  {guardadoExitoso ? <CheckCircle size={20} /> : <FileSpreadsheet size={20} />}
                  <span>
                    {guardadoExitoso
                      ? "✓ ¡Guardado en Inventario y Cuenta de Cobro!"
                      : "Guardar Servicio en Inventario"}
                  </span>
                </button>

                {guardadoExitoso && (
                  <button
                    type="button"
                    onClick={resetFormulario}
                    style={{
                      width: "100%",
                      background: "none",
                      border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #CBD5E1",
                      color: isDark ? "#94A3B8" : "#475569",
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    <RefreshCw size={14} /> Registrar nuevo servicio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CUENTAS DE COBRO & EXCEL OFICIAL */}
      {tab === "cuentas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ── BARRA DE AGRUPACIÓN Y FILTRADO POR MES Y AÑO ── */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 18,
              padding: "16px 20px",
              boxShadow: cardShadow,
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    background: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 132, 199, 0.12)",
                    color: isDark ? "#38bdf8" : "#0284c7",
                    padding: 8,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: textTitle }}>
                    Filtrado y Agrupación por Periodo y Proveedor
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: textSub }}>
                    {mostrarTodos
                      ? `Visualizando consolidado histórico ${filtroProveedor ? `filtrado por "${filtroProveedor}"` : "de todos los proveedores"}`
                      : `Liquidación activa: ${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio}${filtroProveedor ? ` · Entidad: ${filtroProveedor}` : " · Todos los proveedores"}`}
                  </p>
                </div>
              </div>

              {/* Controles de Selección Año, Mes, Proveedor y Modo */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Selector de Proveedor / Entidad */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: labelColor, fontWeight: 600 }}>Proveedor / Entidad:</span>
                  <select
                    value={filtroProveedor}
                    onChange={(e) => setFiltroProveedor(e.target.value)}
                    style={{
                      background: inputBg,
                      border: filtroProveedor
                        ? (isDark ? "1.5px solid #38bdf8" : "1.5px solid #0284c7")
                        : inputBorder,
                      color: filtroProveedor
                        ? (isDark ? "#38bdf8" : "#0284c7")
                        : inputText,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="" style={{ background: isDark ? "#0f172a" : "#fff" }}>
                      Todos los proveedores (Sin filtro)
                    </option>
                    {historialProveedores.map((prov) => (
                      <option key={prov} value={prov} style={{ background: isDark ? "#0f172a" : "#fff" }}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  {filtroProveedor && (
                    <button
                      type="button"
                      onClick={() => setFiltroProveedor("")}
                      title="Quitar filtro de proveedor"
                      style={{
                        background: isDark ? "rgba(239,68,68,0.2)" : "#fee2e2",
                        border: "none",
                        color: "#ef4444",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3
                      }}
                    >
                      <X size={12} /> Limpiar
                    </button>
                  )}
                </div>

                {/* Selector de Año */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: labelColor, fontWeight: 600 }}>Año:</span>
                  <select
                    value={filtroAnio}
                    onChange={(e) => {
                      setFiltroAnio(Number(e.target.value));
                      setMostrarTodos(false);
                    }}
                    style={{
                      background: inputBg,
                      border: inputBorder,
                      color: inputText,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    {aniosDisponibles.map((a) => (
                      <option key={a} value={a} style={{ background: isDark ? "#0f172a" : "#fff" }}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector Desplegable de Mes */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: labelColor, fontWeight: 600 }}>Mes:</span>
                  <select
                    value={mostrarTodos ? "todos" : filtroMes}
                    onChange={(e) => {
                      if (e.target.value === "todos") {
                        setMostrarTodos(true);
                      } else {
                        setFiltroMes(Number(e.target.value));
                        setMostrarTodos(false);
                      }
                    }}
                    style={{
                      background: inputBg,
                      border: inputBorder,
                      color: inputText,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="todos" style={{ background: isDark ? "#0f172a" : "#fff" }}>
                      Todos los periodos (Histórico)
                    </option>
                    {NOMBRES_MESES.map((nom, idx) => (
                      <option key={idx + 1} value={idx + 1} style={{ background: isDark ? "#0f172a" : "#fff" }}>
                        {nom} {filtroAnio}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón Ver Todo */}
                <button
                  type="button"
                  onClick={() => setMostrarTodos(!mostrarTodos)}
                  style={{
                    background: mostrarTodos
                      ? (isDark ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.15)")
                      : (isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9"),
                    border: mostrarTodos
                      ? "1px solid #10b981"
                      : (isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1"),
                    color: mostrarTodos ? (isDark ? "#6ee7b7" : "#065f46") : textSub,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {mostrarTodos ? "✓ Histórico Completo" : "Ver Todos los Meses"}
                </button>
              </div>
            </div>

            {/* Pestañas horizontales de los 12 Meses */}
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                paddingBottom: 4,
                borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #f1f5f9",
                paddingTop: 10
              }}
            >
              {NOMBRES_MESES.map((nomMes, idx) => {
                const numMes = idx + 1;
                const esActivo = !mostrarTodos && filtroMes === numMes;
                const conteo = servicios.filter((s) => {
                  if (filtroProveedor && (s.proveedor || "").trim().toLowerCase() !== filtroProveedor.trim().toLowerCase()) {
                    return false;
                  }
                  const info = extraerMesAnio(s);
                  return info && info.mes === numMes && info.anio === filtroAnio;
                }).length;

                return (
                  <button
                    key={numMes}
                    type="button"
                    onClick={() => {
                      setFiltroMes(numMes);
                      setMostrarTodos(false);
                    }}
                    style={{
                      flexShrink: 0,
                      background: esActivo
                        ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                        : conteo > 0
                          ? (isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.08)")
                          : (isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)"),
                      border: esActivo
                        ? "1.5px solid #0284c7"
                        : conteo > 0
                          ? (isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid #bae6fd")
                          : (isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0"),
                      color: esActivo
                        ? "#ffffff"
                        : conteo > 0
                          ? (isDark ? "#38bdf8" : "#0284c7")
                          : textSub,
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: esActivo ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s"
                    }}
                  >
                    <span>{nomMes}</span>
                    {conteo > 0 && (
                      <span
                        style={{
                          background: esActivo ? "rgba(255, 255, 255, 0.25)" : (isDark ? "rgba(56, 189, 248, 0.25)" : "#e0f2fe"),
                          color: esActivo ? "#fff" : (isDark ? "#7dd3fc" : "#0369a1"),
                          borderRadius: 10,
                          padding: "1px 6px",
                          fontSize: 10.5,
                          fontWeight: 700
                        }}
                      >
                        {conteo}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

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
                  Formato de Cuenta de Cobro Oficial · {mostrarTodos ? "Consolidado Histórico" : `${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio}`}
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
                disabled={exportandoExcel || serviciosFiltrados.length === 0}
                onClick={handleDescargarExcel}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: exportandoExcel || serviciosFiltrados.length === 0 ? "not-allowed" : "pointer",
                  opacity: serviciosFiltrados.length === 0 ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                  transition: "all 0.2s"
                }}
              >
                <Download size={18} />
                <span>
                  {exportandoExcel
                    ? "Generando Excel..."
                    : `Descargar Excel ${filtroProveedor ? `${filtroProveedor} - ` : ""}${mostrarTodos ? "Histórico" : NOMBRES_MESES[filtroMes - 1]} (.xlsx)`}
                </span>
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
                <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                  SON (TOTAL {filtroProveedor ? `[${filtroProveedor.toUpperCase()}] ` : ""}{mostrarTodos ? "GENERAL" : NOMBRES_MESES[filtroMes - 1].toUpperCase()}):
                </div>
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
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textTitle }}>
                  Detalle de Servicios Inyectados ({serviciosFiltrados.length} registros {filtroProveedor ? `para "${filtroProveedor}" ` : ""}{mostrarTodos ? "totales" : `en ${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio}`} a partir de fila 24)
                </h3>
                <span style={{ fontSize: 11.5, color: textSub }}>
                  {mostrarTodos
                    ? `Listando todos los registros sin filtrado de fecha${filtroProveedor ? ` para ${filtroProveedor}` : ""}`
                    : `Mostrando exclusivamente los servicios de ${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio}${filtroProveedor ? ` para la entidad "${filtroProveedor}"` : ""}`}
                </span>
              </div>
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

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1040, fontSize: 12.5 }}>
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
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      style={{
                        padding: "32px 16px",
                        textAlign: "center",
                        color: textSub,
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <CalendarDays size={32} style={{ opacity: 0.4 }} />
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          No hay servicios registrados {filtroProveedor ? `para la entidad "${filtroProveedor}" ` : ""}en {mostrarTodos ? "el consolidado histórico" : `${NOMBRES_MESES[filtroMes - 1]} ${filtroAnio}`}
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {filtroProveedor 
                            ? "Prueba cambiando de proveedor o limpiando el filtro de proveedor." 
                            : "Selecciona otro mes con registros o haz clic en \"Ver Todos los Meses\"."}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          {filtroProveedor && (
                            <button
                              type="button"
                              onClick={() => setFiltroProveedor("")}
                              style={{
                                background: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                                border: "1px solid #ef4444",
                                color: "#ef4444",
                                padding: "6px 14px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Limpiar Filtro Proveedor
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setMostrarTodos(true)}
                            style={{
                              background: isDark ? "rgba(56, 189, 248, 0.15)" : "#e0f2fe",
                              border: "1px solid #0284c7",
                              color: isDark ? "#38bdf8" : "#0284c7",
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Ver Histórico Completo
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  serviciosFiltrados.map((s, idx) => {
                    const status = paymentStatusMap[s.id] || s.payment_status || "confirmed";
                    const isPending = status === "pending";

                    return (
                      <tr
                        key={s.id || idx}
                        style={{
                          background: isPending
                            ? (isDark ? "rgba(234, 88, 12, 0.16)" : "#fff7ed")
                            : (idx % 2 === 0
                              ? (isDark ? "rgba(255,255,255,0.02)" : "#ffffff")
                              : (isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")),
                          color: isDark ? "#cbd5e1" : "#1e293b",
                          textAlign: "center",
                          borderLeft: isPending ? "4px solid #f97316" : "4px solid transparent",
                          transition: "background 0.2s, border-left 0.2s"
                        }}
                      >
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", fontWeight: 600 }}>
                          {s.numero_caso}
                        </td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.fecha_solicitud}</td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.fecha_atencion}</td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.fecha_finalizacion}</td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.mesa}</td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", fontWeight: 600, color: isDark ? "#38bdf8" : "#0284c7" }}>
                          {s.proveedor || "-"}
                        </td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.cliente}</td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>{s.coordinador}</td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "right", color: isPending ? "#ea580c" : (isDark ? "#6ee7b7" : "#059669"), fontWeight: 700 }}>
                          {formatearMonedaCOP(s.valor_servicios)}
                        </td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "right" }}>
                          {Number(s.valor_viaticos) > 0 ? formatearMonedaCOP(s.valor_viaticos) : "$ -"}
                        </td>
                        <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "right" }}>
                          {Number(s.valor_materiales) > 0 ? formatearMonedaCOP(s.valor_materiales) : "$ -"}
                        </td>

                        {/* Columna de Estado Financiero Interactivo */}
                        <td style={{ padding: "8px 6px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentStatus(s.id)}
                            title={isPending ? "Clic para marcar como Pagado / Confirmado" : "Clic para marcar como Pendiente por Confirmar"}
                            style={{
                              background: isPending
                                ? (isDark ? "rgba(249, 115, 22, 0.22)" : "#ffedd5")
                                : (isDark ? "rgba(16, 185, 129, 0.18)" : "#dcfce7"),
                              border: isPending
                                ? (isDark ? "1px solid #f97316" : "1px solid #fdba74")
                                : (isDark ? "1px solid #10b981" : "1px solid #86efac"),
                              color: isPending
                                ? (isDark ? "#fb923c" : "#c2410c")
                                : (isDark ? "#6ee7b7" : "#15803d"),
                              padding: "4px 8px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              boxShadow: isPending ? "0 0 10px rgba(249, 115, 22, 0.35)" : "none",
                              transition: "all 0.15s"
                            }}
                          >
                            {isPending ? (
                              <>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#f97316",
                                    boxShadow: "0 0 6px #f97316"
                                  }}
                                />
                                <AlertTriangle size={12} />
                                <span>Pendiente</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={12} />
                                <span>Confirmado</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td style={{ padding: "8px 6px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {/* Botón de Edición (Lápiz) */}
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarServicio(s)}
                              title="Editar datos de este servicio"
                              style={{
                                background: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)",
                                border: isDark ? "1px solid rgba(56, 189, 248, 0.35)" : "1px solid rgba(2, 132, 199, 0.3)",
                                color: isDark ? "#38bdf8" : "#0284c7",
                                cursor: "pointer",
                                padding: "5px 7px",
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                transition: "all 0.15s"
                              }}
                            >
                              <Pencil size={13} />
                              <span>Editar</span>
                            </button>

                            {/* Botón de Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleEliminarServicio(s.id)}
                              title="Eliminar de la cuenta de cobro"
                              style={{
                                background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
                                border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(239, 68, 68, 0.25)",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "5px 7px",
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                transition: "all 0.15s"
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Fila de Totales */}
                <tr style={{ background: isDark ? "rgba(19, 94, 107, 0.4)" : "#e2e8f0", color: isDark ? "#ffffff" : "#0f172a", fontWeight: 800, textAlign: "right" }}>
                  <td colSpan={8} style={{ padding: "12px 10px", border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1", textAlign: "center" }}>
                    TOTAL CUENTA DE COBRO {filtroProveedor ? `[${filtroProveedor.toUpperCase()}] ` : ""}{mostrarTodos ? "HISTÓRICO" : `(${NOMBRES_MESES[filtroMes - 1].toUpperCase()} ${filtroAnio})`}
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
                  <td style={{ border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: MÓDULO INDEPENDIENTE DE REGISTRO DE SERVICIOS E HISTORIAL DE PLANTILLAS */}
      {tab === "registro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tarjeta de Encabezado y Barra de Búsqueda / Depuración */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 18,
              padding: "20px 24px",
              boxShadow: cardShadow,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    background: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)",
                    color: isDark ? "#fef08a" : "#d97706",
                    padding: 10,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: textTitle }}>
                    Registro de Servicios e Historial de Plantillas IT
                  </h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12.5, color: textSub }}>
                    Repositorio documental independiente de reportes técnicos oficiales (no afecta cuentas de cobro)
                  </p>
                </div>
              </div>

              {/* Botón Depurar por Mes */}
              <button
                type="button"
                disabled={depurando || registrosServiciosFiltrados.length === 0}
                onClick={handleDepurarMesRegistros}
                title={`Eliminar exclusivamente las plantillas de ${mostrarTodosReg ? "todos los meses" : NOMBRES_MESES[filtroMesReg - 1]} en el Registro de Servicios`}
                style={{
                  background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                  border: isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid #fca5a5",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: depurando || registrosServiciosFiltrados.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: registrosServiciosFiltrados.length === 0 ? 0.6 : 1,
                  transition: "all 0.2s"
                }}
              >
                <Trash2 size={15} />
                <span>
                  {depurando
                    ? "Depurando mes..."
                    : `Depurar ${mostrarTodosReg ? "Histórico" : NOMBRES_MESES[filtroMesReg - 1]}`}
                </span>
              </button>
            </div>

            {/* Barra de Filtros: Buscador por N° Caso + Selector Mes/Año */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
                background: isDark ? "rgba(0,0,0,0.25)" : "#f8fafc",
                padding: 14,
                borderRadius: 12,
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0"
              }}
            >
              {/* Buscador reactivo por N° Caso o Texto */}
              <div style={{ position: "relative", minWidth: 240 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: textSub,
                    pointerEvents: "none"
                  }}
                />
                <input
                  type="text"
                  value={busquedaCaso}
                  onChange={(e) => setBusquedaCaso(e.target.value)}
                  placeholder="Buscar por N° de Caso, cliente o falla..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: inputBg,
                    border: inputBorder,
                    borderRadius: 8,
                    padding: "8px 10px 8px 36px",
                    color: inputText,
                    fontSize: 12.5,
                    outline: "none"
                  }}
                />
                {busquedaCaso && (
                  <button
                    type="button"
                    onClick={() => setBusquedaCaso("")}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: textSub,
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Selector de Año y Mes */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: labelColor, fontWeight: 600 }}>Año:</span>
                  <select
                    value={filtroAnioReg}
                    onChange={(e) => {
                      setFiltroAnioReg(Number(e.target.value));
                      setMostrarTodosReg(false);
                    }}
                    style={{
                      background: inputBg,
                      border: inputBorder,
                      color: inputText,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    {aniosDisponiblesReg.map((a) => (
                      <option key={a} value={a} style={{ background: isDark ? "#0f172a" : "#fff" }}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: labelColor, fontWeight: 600 }}>Mes:</span>
                  <select
                    value={mostrarTodosReg ? "todos" : filtroMesReg}
                    onChange={(e) => {
                      if (e.target.value === "todos") {
                        setMostrarTodosReg(true);
                      } else {
                        setFiltroMesReg(Number(e.target.value));
                        setMostrarTodosReg(false);
                      }
                    }}
                    style={{
                      background: inputBg,
                      border: inputBorder,
                      color: inputText,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="todos" style={{ background: isDark ? "#0f172a" : "#fff" }}>
                      Todos los meses
                    </option>
                    {NOMBRES_MESES.map((nom, idx) => (
                      <option key={idx + 1} value={idx + 1} style={{ background: isDark ? "#0f172a" : "#fff" }}>
                        {nom} {filtroAnioReg}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarTodosReg(!mostrarTodosReg)}
                  style={{
                    background: mostrarTodosReg
                      ? (isDark ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.15)")
                      : (isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9"),
                    border: mostrarTodosReg
                      ? "1px solid #f59e0b"
                      : (isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1"),
                    color: mostrarTodosReg ? (isDark ? "#fef08a" : "#b45309") : textSub,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {mostrarTodosReg ? "✓ Ver Todos" : "Ver Todos"}
                </button>
              </div>
            </div>

            {/* Pestañas de meses para el Registro de Servicios */}
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                paddingBottom: 4,
                borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #f1f5f9",
                paddingTop: 10
              }}
            >
              {NOMBRES_MESES.map((nomMes, idx) => {
                const numMes = idx + 1;
                const esActivo = !mostrarTodosReg && filtroMesReg === numMes;
                const conteo = registrosServicios.filter((r) => {
                  const info = extraerMesAnio(r);
                  return info && info.mes === numMes && info.anio === filtroAnioReg;
                }).length;

                return (
                  <button
                    key={numMes}
                    type="button"
                    onClick={() => {
                      setFiltroMesReg(numMes);
                      setMostrarTodosReg(false);
                    }}
                    style={{
                      flexShrink: 0,
                      background: esActivo
                        ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                        : conteo > 0
                          ? (isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)")
                          : (isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)"),
                      border: esActivo
                        ? "1.5px solid #d97706"
                        : conteo > 0
                          ? (isDark ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid #fde68a")
                          : (isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0"),
                      color: esActivo
                        ? "#ffffff"
                        : conteo > 0
                          ? (isDark ? "#fef08a" : "#b45309")
                          : textSub,
                      borderRadius: 8,
                      padding: "5px 11px",
                      fontSize: 11.5,
                      fontWeight: esActivo ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s"
                    }}
                  >
                    <span>{nomMes}</span>
                    {conteo > 0 && (
                      <span
                        style={{
                          background: esActivo ? "rgba(255, 255, 255, 0.25)" : (isDark ? "rgba(245, 158, 11, 0.3)" : "#fef3c7"),
                          color: esActivo ? "#fff" : (isDark ? "#fde68a" : "#92400e"),
                          borderRadius: 10,
                          padding: "1px 6px",
                          fontSize: 10,
                          fontWeight: 700
                        }}
                      >
                        {conteo}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Registros de Servicios e Historial de Plantillas */}
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
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textTitle }}>
                  Plantillas Corporativas Guardadas ({registrosServiciosFiltrados.length} registros)
                </h3>
                <span style={{ fontSize: 11.5, color: textSub }}>
                  {busquedaCaso
                    ? `Filtrado por término "${busquedaCaso}"`
                    : mostrarTodosReg
                      ? "Listado completo de plantillas históricas"
                      : `Plantillas del periodo ${NOMBRES_MESES[filtroMesReg - 1]} ${filtroAnioReg}`}
                </span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960, fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#0F766E", color: "#ffffff", textAlign: "center" }}>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>N° de Caso</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Fecha</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Cliente</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Mesa</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Coordinador</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Equipo / Serial</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Falla Reportada</th>
                  <th style={{ padding: "10px 8px", border: "1px solid rgba(255,255,255,0.2)" }}>Acciones de Plantilla</th>
                </tr>
              </thead>
              <tbody>
                {registrosServiciosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "36px 16px",
                        textAlign: "center",
                        color: textSub,
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Layers size={32} style={{ opacity: 0.4 }} />
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          No se encontraron plantillas corporativas con los filtros actuales
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {busquedaCaso
                            ? `No hay coincidencias para "${busquedaCaso}". Intenta con otro N° de caso o limpia el buscador.`
                            : `No hay registros en ${NOMBRES_MESES[filtroMesReg - 1]} ${filtroAnioReg}.`}
                        </div>
                        {(busquedaCaso || !mostrarTodosReg) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusquedaCaso("");
                              setMostrarTodosReg(true);
                            }}
                            style={{
                              marginTop: 6,
                              background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7",
                              border: "1px solid #d97706",
                              color: isDark ? "#fef08a" : "#b45309",
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Ver Todo el Histórico
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  registrosServiciosFiltrados.map((r, idx) => (
                    <tr
                      key={r.id || idx}
                      style={{
                        background: idx % 2 === 0
                          ? (isDark ? "rgba(255,255,255,0.02)" : "#ffffff")
                          : (isDark ? "rgba(255,255,255,0.06)" : "#f8fafc"),
                        color: isDark ? "#cbd5e1" : "#1e293b",
                        textAlign: "center"
                      }}
                    >
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#38bdf8" : "#0284c7" }}>
                        {r.numero_caso}
                      </td>
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>
                        {r.fecha_atencion || r.fecha_solicitud || "-"}
                      </td>
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", fontWeight: 600 }}>
                        {r.cliente || "-"}
                      </td>
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>
                        {r.mesa || "-"}
                      </td>
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>
                        {r.coordinador || "-"}
                      </td>
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", fontSize: 12 }}>
                        {r.equipo || "-"}
                      </td>
                      <td style={{ padding: "10px 8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", textAlign: "left", fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.falla}>
                        {r.falla || "-"}
                      </td>
                      <td style={{ padding: "8px 6px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          {/* Botón Ver Plantilla */}
                          <button
                            type="button"
                            onClick={() => setModalVerPlantilla(r)}
                            title="Ver plantilla corporativa completa"
                            style={{
                              background: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)",
                              border: isDark ? "1px solid rgba(56, 189, 248, 0.35)" : "1px solid rgba(2, 132, 199, 0.3)",
                              color: isDark ? "#38bdf8" : "#0284c7",
                              cursor: "pointer",
                              padding: "5px 8px",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            <Eye size={13} />
                            <span>Ver</span>
                          </button>

                          {/* Botón Copiar Plantilla */}
                          <button
                            type="button"
                            onClick={() => {
                              handleCopiarPlantillaRegistro(r.plantilla_completa);
                              setCopiadoRegId(r.id);
                              setTimeout(() => setCopiadoRegId(null), 2000);
                            }}
                            title="Copiar plantilla para WhatsApp"
                            style={{
                              background: copiadoRegId === r.id
                                ? "#10b981"
                                : (isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)"),
                              border: copiadoRegId === r.id
                                ? "1px solid #10b981"
                                : (isDark ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(16, 185, 129, 0.3)"),
                              color: copiadoRegId === r.id ? "#fff" : (isDark ? "#6ee7b7" : "#059669"),
                              cursor: "pointer",
                              padding: "5px 8px",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              transition: "all 0.2s"
                            }}
                          >
                            {copiadoRegId === r.id ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiadoRegId === r.id ? "¡Copiada!" : "Copiar"}</span>
                          </button>

                          {/* Botón Eliminar de Registro */}
                          <button
                            type="button"
                            onClick={() => handleEliminarRegistroServicio(r.id)}
                            title="Eliminar del historial de plantillas"
                            style={{
                              background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
                              border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "5px 7px",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              fontSize: 11
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: ALMACENAMIENTO TEMPORAL Y TTL */}
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

      {/* Modal de edición de registro de soporte / servicio inyectado */}
      {editandoServicio && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              background: isDark ? "#0f172a" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #e2e8f0",
              borderRadius: 18,
              width: "100%",
              maxWidth: 720,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              overflow: "hidden"
            }}
          >
            {/* Header del Modal */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: isDark ? "rgba(30, 41, 59, 0.7)" : "#f8fafc"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    background: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 132, 199, 0.12)",
                    color: isDark ? "#38bdf8" : "#0284c7",
                    padding: 7,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textTitle }}>
                    Editar Servicio Inyectado
                  </h3>
                  <span style={{ fontSize: 12, color: textSub }}>
                    Caso: <strong>{editFormData.numero_caso || "Sin número"}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditandoServicio(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: textSub,
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario con Scroll */}
            <form
              onSubmit={handleGuardarEdicion}
              style={{
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 12
                }}
              >
                {/* N° Caso */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    N° de Caso / Código de Servicio:
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.numero_caso || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, numero_caso: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  />
                </div>

                {/* Fechas */}
                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Fecha Solicitud:
                  </label>
                  <input
                    type="text"
                    value={editFormData.fecha_solicitud || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_solicitud: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Fecha Atención:
                  </label>
                  <input
                    type="text"
                    value={editFormData.fecha_atencion || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_atencion: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Fecha Finalización:
                  </label>
                  <input
                    type="text"
                    value={editFormData.fecha_finalizacion || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_finalizacion: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                {/* Mesa */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, color: labelColor, fontWeight: 600 }}>
                      Mesa / Tipo Soporte:
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialMesas.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-mesas"
                    value={editFormData.mesa || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, mesa: e.target.value })}
                    placeholder="ej. Mesa IBM / Lexmark, 2..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                {/* Proveedor / Entidad */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, color: labelColor, fontWeight: 600 }}>
                      Proveedor / Entidad:
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialProveedores.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-proveedores"
                    value={editFormData.proveedor || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, proveedor: e.target.value })}
                    placeholder="ej. Cencosud, Grupo Aval, R&S..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                {/* Cliente */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, color: labelColor, fontWeight: 600 }}>
                      Cliente Final:
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialClientes.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-clientes"
                    value={editFormData.cliente || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, cliente: e.target.value })}
                    placeholder="ej. Banco de Bogotá, Banco Popular..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                {/* Coordinador */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, color: labelColor, fontWeight: 600 }}>
                      Coordinador(a):
                    </label>
                    <span style={{ fontSize: 10, color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600 }}>
                      ▾ Sugerencias ({historialCoordinadores.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    list="datalist-coordinadores"
                    value={editFormData.coordinador || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, coordinador: e.target.value })}
                    placeholder="ej. Valentina Tovar, Oswaldo..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                {/* Valores Monetarios */}
                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Valor Servicios ($ COP):
                  </label>
                  <input
                    type="number"
                    value={editFormData.valor_servicios ?? 0}
                    onChange={(e) => setEditFormData({ ...editFormData, valor_servicios: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: isDark ? "#4ade80" : "#059669",
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Viáticos ($ COP):
                  </label>
                  <input
                    type="number"
                    value={editFormData.valor_viaticos ?? 0}
                    onChange={(e) => setEditFormData({ ...editFormData, valor_viaticos: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Materiales ($ COP):
                  </label>
                  <input
                    type="number"
                    value={editFormData.valor_materiales ?? 0}
                    onChange={(e) => setEditFormData({ ...editFormData, valor_materiales: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                {/* Equipo y Falla */}
                <div>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Equipo / Serial:
                  </label>
                  <input
                    type="text"
                    value={editFormData.equipo || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, equipo: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: labelColor, display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Falla Reportada:
                  </label>
                  <input
                    type="text"
                    value={editFormData.falla || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, falla: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: inputText,
                      fontSize: 12.5
                    }}
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 10,
                  paddingTop: 12,
                  borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0"
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditandoServicio(null)}
                  style={{
                    background: "none",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                    color: textSub,
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  style={{
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "9px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: guardandoEdicion ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
                  }}
                >
                  <CheckCircle size={15} />
                  {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Visualizar y Copiar la Plantilla Corporativa Completa */}
      {modalVerPlantilla && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              background: isDark ? "#0f172a" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #e2e8f0",
              borderRadius: 18,
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: isDark ? "rgba(30, 41, 59, 0.7)" : "#f8fafc"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    background: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)",
                    color: isDark ? "#fef08a" : "#d97706",
                    padding: 7,
                    borderRadius: 8
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textTitle }}>
                    Plantilla Oficial: Caso {modalVerPlantilla.numero_caso}
                  </h3>
                  <span style={{ fontSize: 12, color: textSub }}>
                    {modalVerPlantilla.cliente} · {modalVerPlantilla.fecha_atencion || modalVerPlantilla.fecha_solicitud || "Sin fecha"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalVerPlantilla(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: textSub,
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: 6
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido de la plantilla */}
            <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: textSub, fontWeight: 600 }}>
                  Texto oficial generado para WhatsApp / Mesa de ayuda:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleCopiarPlantillaRegistro(modalVerPlantilla.plantilla_completa);
                    setCopiadoRegId(modalVerPlantilla.id);
                    setTimeout(() => setCopiadoRegId(null), 2000);
                  }}
                  style={{
                    background: copiadoRegId === modalVerPlantilla.id ? "#10b981" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    border: "none",
                    color: "#fff",
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
                  {copiadoRegId === modalVerPlantilla.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiadoRegId === modalVerPlantilla.id ? "¡Copiada al portapapeles!" : "Copiar Plantilla"}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={modalVerPlantilla.plantilla_completa || "No hay texto de plantilla registrado para este caso."}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: 260,
                  background: isDark ? "rgba(0,0,0,0.4)" : "#f8fafc",
                  border: inputBorder,
                  borderRadius: 10,
                  padding: 14,
                  color: inputText,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none"
                }}
              />

              {/* Metadatos adicionales */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  fontSize: 11.5,
                  color: textSub,
                  background: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
                  padding: 10,
                  borderRadius: 8
                }}
              >
                <div><strong>Mesa:</strong> {modalVerPlantilla.mesa || "-"}</div>
                <div><strong>Coordinador:</strong> {modalVerPlantilla.coordinador || "-"}</div>
                <div><strong>Equipo:</strong> {modalVerPlantilla.equipo || "-"}</div>
                <div><strong>Falla:</strong> {modalVerPlantilla.falla || "-"}</div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end"
              }}
            >
              <button
                type="button"
                onClick={() => setModalVerPlantilla(null)}
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
                  border: "none",
                  color: textTitle,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de diagnóstico del motor de IA (la llave vive en el servidor) */}
      <ConfigApiKeyModal
        isOpen={showConfigKey}
        onClose={() => setShowConfigKey(false)}
        onEstadoVerificado={(r) => setMotorListo(!!r?.configurado)}
        theme={theme}
      />

      {/* Datalists globales para memoria histórica y autocompletado interactivo */}
      <datalist id="datalist-proveedores">
        {historialProveedores.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <datalist id="datalist-clientes">
        {historialClientes.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <datalist id="datalist-coordinadores">
        {historialCoordinadores.map((coord) => (
          <option key={coord} value={coord} />
        ))}
      </datalist>

      <datalist id="datalist-mesas">
        {historialMesas.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}
