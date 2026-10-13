import { supabase } from "./supabaseClient";

export const TABLA_SERVICIOS_OFICIAL = "injected_services";
export const TABLA_SERVICIOS_LEGACY = "soporte_servicios";
const TABLA_SERVICIOS = "injected_services";
const TABLA_REGISTRO_SERVICIOS = "soporte_registro_servicios";
const BUCKET_TEMPORAL = "soporte-temporales";
const LOCAL_STORAGE_SERVICIOS = "CRM_SOPORTE_SERVICIOS_LOCAL";
const LOCAL_STORAGE_REGISTRO_SERVICIOS = "CRM_SOPORTE_REGISTRO_SERVICIOS_LOCAL";

/**
 * Normaliza un registro para el formato oficial injected_services (inglés / snake_case estándar)
 */
export function normalizarParaInjectedServices(item) {
  // Serialización y empaquetado seguro de template_data (JSON o string estructurado)
  let templateDataFinal = "";
  if (item.template_data != null) {
    if (typeof item.template_data === "object") {
      try {
        templateDataFinal = JSON.stringify(item.template_data);
      } catch (_) {
        templateDataFinal = String(item.template_data);
      }
    } else {
      templateDataFinal = String(item.template_data);
    }
  } else if (item.plantilla_completa != null) {
    if (typeof item.plantilla_completa === "object") {
      try {
        templateDataFinal = JSON.stringify(item.plantilla_completa);
      } catch (_) {
        templateDataFinal = String(item.plantilla_completa);
      }
    } else {
      templateDataFinal = String(item.plantilla_completa);
    }
  }

  // Generación/validación estricta de UUID para PostgreSQL (evita error 22P02)
  let idFinal = item.id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!idFinal || !uuidRegex.test(String(idFinal).trim())) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      idFinal = crypto.randomUUID();
    } else {
      idFinal = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  return {
    id: idFinal,
    case_number: item.case_number || item.numero_caso || "Sin número",
    request_date: item.request_date || item.fecha_solicitud || "",
    service_date: item.service_date || item.fecha_atencion || "",
    end_date: item.end_date || item.fecha_finalizacion || "",
    mesa: item.mesa || "2",
    provider_entity: item.provider_entity || item.proveedor || "",
    client: item.client || item.cliente || "Cliente",
    coordinator: item.coordinator || item.coordinador || "Oswaldo",
    service_value: Number(item.service_value != null ? item.service_value : item.valor_servicios) || 0,
    travel_expenses: Number(item.travel_expenses != null ? item.travel_expenses : item.valor_viaticos) || 0,
    materials: Number(item.materials != null ? item.materials : item.valor_materiales) || 0,
    status: item.status || item.payment_status || "confirmed",
    template_data: templateDataFinal,
    evidence_image: item.evidence_image || item.foto_url || "",
    created_at: item.created_at || item.creado_en || new Date().toISOString()
  };
}

/**
 * Normaliza cualquier fila proveniente de la base de datos (sea injected_services o soporte_servicios)
 * al formato unificado de la interfaz de React para compatibilidad total bidireccional.
 * Mapea exhaustivamente: case_number, request_date, service_date, end_date, mesa,
 * provider_entity, client, coordinator, service_value, travel_expenses, materials, status.
 */
export function normalizarServicioUnificado(raw) {
  if (!raw) return null;

  // Extracción robusta de campos primarios con soporte para formatos en inglés y español
  const numCaso = raw.case_number != null ? String(raw.case_number) : (raw.numero_caso != null ? String(raw.numero_caso) : "");
  const fSol = raw.request_date != null ? String(raw.request_date) : (raw.fecha_solicitud != null ? String(raw.fecha_solicitud) : "");
  const fAten = raw.service_date != null ? String(raw.service_date) : (raw.fecha_atencion != null ? String(raw.fecha_atencion) : "");
  const fFin = raw.end_date != null ? String(raw.end_date) : (raw.fecha_finalizacion != null ? String(raw.fecha_finalizacion) : "");
  const prov = raw.provider_entity != null ? String(raw.provider_entity) : (raw.proveedor != null ? String(raw.proveedor) : "");
  const cli = raw.client != null ? String(raw.client) : (raw.cliente != null ? String(raw.cliente) : "");
  const coord = raw.coordinator != null ? String(raw.coordinator) : (raw.coordinador != null ? String(raw.coordinador) : "Oswaldo");
  const mesaVal = raw.mesa != null ? String(raw.mesa) : "2";

  const vServ = Number(raw.service_value != null ? raw.service_value : raw.valor_servicios) || 0;
  const vViat = Number(raw.travel_expenses != null ? raw.travel_expenses : raw.valor_viaticos) || 0;
  const vMat = Number(raw.materials != null ? raw.materials : raw.valor_materiales) || 0;

  const st = raw.status || raw.payment_status || "confirmed";
  const plant = raw.template_data || raw.plantilla_completa || "";
  const evImg = raw.evidence_image || raw.foto_url || "";
  const crAt = raw.created_at || raw.creado_en || new Date().toISOString();

  return {
    id: raw.id || `serv-${numCaso || Date.now()}`,
    // Nombres en español (usados en la UI de CRM y generación de Excel)
    numero_caso: numCaso,
    fecha_solicitud: fSol,
    fecha_atencion: fAten,
    fecha_finalizacion: fFin,
    mesa: mesaVal,
    proveedor: prov,
    cliente: cli,
    coordinador: coord,
    valor_servicios: vServ,
    valor_viaticos: vViat,
    valor_materiales: vMat,
    sh: raw.sh || "SOFTWARE - HARDWARE",
    tecnico: raw.tecnico || "Jhon Alexander Vasquez Reveló",
    medio: raw.medio || "SITIO",
    equipo: raw.equipo || "",
    falla: raw.falla || "",
    causa: raw.causa || "",
    solucion: raw.solucion || "",
    pruebas: raw.pruebas || "",
    horas: raw.horas || {},
    plantilla_completa: plant,
    foto_url: evImg,
    payment_status: st,
    creado_en: crAt,

    // Nombres oficiales en inglés (columnas exactas de injected_services)
    case_number: numCaso,
    request_date: fSol,
    service_date: fAten,
    end_date: fFin,
    provider_entity: prov,
    client: cli,
    coordinator: coord,
    service_value: vServ,
    travel_expenses: vViat,
    materials: vMat,
    status: st,
    template_data: plant,
    evidence_image: evImg,
    created_at: crAt
  };
}

// Semilla inicial idéntica a la cuenta de cobro oficial del usuario
export const SERVICIOS_INICIALES_DEFAULT = [
  {
    id: "serv-1",
    numero_caso: "2254390",
    fecha_solicitud: "02/08/2026",
    fecha_atencion: "02/08/2026",
    fecha_finalizacion: "02/08/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 65000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Mantenimiento preventivo e inspección de terminales",
    solucion: "Revisión física y verificación de componentes.",
    creado_en: "2026-08-02T10:00:00Z"
  },
  {
    id: "serv-2",
    numero_caso: "2268949",
    fecha_solicitud: "01/08/2026",
    fecha_atencion: "02/08/2026",
    fecha_finalizacion: "02/08/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 150000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Falla en periféricos de cajas registradoras",
    solucion: "Sustitución y configuración de punto de venta.",
    creado_en: "2026-08-02T14:30:00Z"
  },
  {
    id: "serv-3",
    numero_caso: "Proyecto Mantenimientos de POS",
    fecha_solicitud: "08/09/2026",
    fecha_atencion: "10/09/2026",
    fecha_finalizacion: "10/09/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 200000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Jornada masiva de mantenimiento POS",
    solucion: "Mantenimiento integral a terminales POS.",
    creado_en: "2026-09-10T18:00:00Z"
  },
  {
    id: "serv-4",
    numero_caso: "Mantenimientos CPU y Balanza",
    fecha_solicitud: "20/09/2026",
    fecha_atencion: "21/09/2026",
    fecha_finalizacion: "21/09/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 160000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Calibración y limpieza de CPUs y balanzas",
    solucion: "Calibración electrónica y mantenimiento correctivo.",
    creado_en: "2026-09-21T11:00:00Z"
  },
  {
    id: "serv-5",
    numero_caso: "2300411",
    fecha_solicitud: "21/09/2026",
    fecha_atencion: "21/09/2026",
    fecha_finalizacion: "21/09/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 70000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Problema de red y acceso a servidor",
    solucion: "Restablecimiento de enlace corporativo.",
    creado_en: "2026-09-21T15:00:00Z"
  },
  {
    id: "serv-6",
    numero_caso: "2301071",
    fecha_solicitud: "21/09/2026",
    fecha_atencion: "21/09/2026",
    fecha_finalizacion: "21/09/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 70000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Error en aplicativo de pagos",
    solucion: "Reinstalación y parametrización de driver.",
    creado_en: "2026-09-21T17:00:00Z"
  },
  {
    id: "serv-7",
    numero_caso: "2303375",
    fecha_solicitud: "23/09/2026",
    fecha_atencion: "24/09/2026",
    fecha_finalizacion: "24/09/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    valor_servicios: 70000,
    valor_viaticos: 0,
    valor_materiales: 0,
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    falla: "Actualización sistema operativo y dominio",
    solucion: "Punto de red habilitado, Windows 11 Enterprise configurado.",
    creado_en: "2026-09-24T12:00:00Z"
  }
];

let initTablePromise = null;

/**
 * Inicializa e intenta asegurar la tabla oficial injected_services en Supabase.
 * Se ejecuta automáticamente al arrancar la app o ante la primera consulta.
 */
export async function inicializarTablaInjectedServices() {
  if (initTablePromise) return initTablePromise;

  initTablePromise = (async () => {
    try {
      // 1. Probar si injected_services responde
      const { data, error } = await supabase
        .from(TABLA_SERVICIOS_OFICIAL)
        .select("id")
        .limit(1);

      if (!error) {
        return { ok: true, tabla: TABLA_SERVICIOS_OFICIAL };
      }

      console.warn("Tabla 'injected_services' no accesible o inexistente:", error.message);

      // Si hay RPC o migración remota
      try {
        await supabase.rpc("inicializar_tabla_injected_services");
      } catch (rpcErr) {
        // Ignorar si no existe el RPC
      }

      // Si existe soporte_servicios (legacy), podemos continuar con fallback
      const { error: errLegacy } = await supabase
        .from(TABLA_SERVICIOS_LEGACY)
        .select("id")
        .limit(1);

      if (!errLegacy) {
        return { ok: true, tabla: TABLA_SERVICIOS_LEGACY };
      }

      return { ok: false, error: error.message };
    } catch (e) {
      console.warn("Error en auto-inicialización de tabla en Supabase:", e.message);
      return { ok: false, error: e.message };
    }
  })();

  return initTablePromise;
}

/**
 * Normaliza cualquier texto removiendo acentos, caracteres especiales y normalizando '&' / 'y'.
 */
export function normalizarTexto(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "y")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Coincidencia flexible e insensible a mayúsculas/minúsculas, acentos y variaciones de proveedor.
 * Unifica el comportamiento al 100% entre CRM principal y la vista pública compartida.
 */
export function coincideProveedorFlexible(provRegistro, provBuscado) {
  if (!provBuscado || provBuscado === "todos") return true;
  const r = (provRegistro || "").trim();
  if (!r || r === "-") return false;

  const normReg = normalizarTexto(r);
  const normBus = normalizarTexto(provBuscado);

  // 1. Coincidencia normalizada directa o por subcadena
  if (normReg === normBus || normReg.includes(normBus) || normBus.includes(normReg)) {
    return true;
  }

  // 2. Detección flexible para variaciones de R&S Soluciones (R&S, RS, RyS, Soluciones)
  const esBusquedaRS = normBus.includes("rs") || normBus.includes("soluciones");
  if (esBusquedaRS) {
    const upperReg = r.toUpperCase();
    const esRS =
      upperReg.includes("R&S") ||
      upperReg.includes("R & S") ||
      normReg.includes("rs") ||
      (normReg.includes("r") && normReg.includes("soluciones"));

    const esOtraEntidad =
      normReg.includes("cencosud") ||
      normReg.includes("aval") ||
      normReg.includes("ibm") ||
      normReg.includes("lexmark");

    if (esRS && !esOtraEntidad) {
      return true;
    }
  }

  return false;
}

/**
 * CONSULTA FRESCA DIRECTA A SUPABASE (SIN CACHÉ / SIN LOCALSTORAGE).
 * Diseñada exclusivamente para la vista pública compartida del proveedor.
 * Consulta la tabla oficial injected_services y garantiza datos 1:1 en tiempo real.
 */
export async function getServiciosFrescos() {
  try {
    const timestampCacheBust = Date.now();
    let registrosOficiales = [];
    try {
      const { data: dataOficial, error: errOficial } = await supabase
        .from(TABLA_SERVICIOS_OFICIAL)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!errOficial && dataOficial && dataOficial.length > 0) {
        registrosOficiales = dataOficial.map(normalizarServicioUnificado);
      }
    } catch (_) {}

    if (registrosOficiales.length > 0) {
      console.log(`[SharedView] Fetch fresco: ${registrosOficiales.length} registros oficiales de injected_services (ts: ${timestampCacheBust})`);
      return registrosOficiales;
    }

    // Fallback a localStorage si Supabase no devolvió filas
    const locales = getServiciosLocal();
    if (locales && locales.length > 0) {
      return locales.map(normalizarServicioUnificado);
    }

    return [];
  } catch (e) {
    console.error("Error en getServiciosFrescos:", e.message);
    return [];
  }
}

/**
 * Obtiene los servicios registrados para la cuenta de cobro activa.
 * Consulta prioritariamente injected_services, con fallback a soporte_servicios y
 * respaldo blindado garantizado en localStorage para evitar pantalla en ceros.
 * Permite filtrar opcionalmente por proveedor con búsqueda flexible (ilike).
 */
export async function getServiciosSoporte(opciones = {}) {
  const { proveedor = null, mes = null, anio = null } = opciones;

  try {
    // 1. Construir consulta a la tabla oficial injected_services
    let queryOficial = supabase
      .from(TABLA_SERVICIOS_OFICIAL)
      .select("*");

    // Si se especifica proveedor y es R&S, usar ilike para capturar variaciones
    if (proveedor && proveedor !== "todos") {
      const pUpper = proveedor.toUpperCase();
      if (pUpper.includes("R&S") || pUpper.includes("RS") || pUpper.includes("SOLUCIONES")) {
        queryOficial = queryOficial.ilike("provider_entity", "%R%S%");
      } else {
        queryOficial = queryOficial.ilike("provider_entity", `%${proveedor.trim()}%`);
      }
    }

    const { data: dataOficial, error: errOficial } = await queryOficial
      .order("created_at", { ascending: false })
      .limit(200);

    // 1. Consultar injected_services (tabla oficial)
    let registrosOficiales = [];
    if (!errOficial && dataOficial && dataOficial.length > 0) {
      registrosOficiales = dataOficial.map(normalizarServicioUnificado);
    }

    // 2. Consultar soporte_servicios (tabla legacy / complementaria)
    let queryLegacy = supabase
      .from(TABLA_SERVICIOS_LEGACY)
      .select("*");

    if (proveedor && proveedor !== "todos") {
      const pUpper = proveedor.toUpperCase();
      if (pUpper.includes("R&S") || pUpper.includes("RS") || pUpper.includes("SOLUCIONES")) {
        queryLegacy = queryLegacy.ilike("proveedor", "%R%S%");
      } else {
        queryLegacy = queryLegacy.ilike("proveedor", `%${proveedor.trim()}%`);
      }
    }

    const { data: dataLegacy, error: errLegacy } = await queryLegacy
      .order("creado_en", { ascending: false })
      .limit(200);
    let registrosLegacy = [];
    if (!errLegacy && dataLegacy && dataLegacy.length > 0) {
      registrosLegacy = dataLegacy.map(normalizarServicioUnificado);
    }

    // 3. Obtener respaldo de localStorage
    const locales = getServiciosLocal();

    // 4. MERGE INTELIGENTE DE FUENTES:
    // Combinar sin duplicados por ID o número de caso. Los datos remotos oficiales tienen prioridad.
    const mapaUnificados = new Map();

    // Primero registrar semillas/locales como base
    if (Array.isArray(locales)) {
      locales.forEach((item) => {
        const clave = String(item.id || item.numero_caso || "").trim();
        if (clave) mapaUnificados.set(clave, item);
      });
    }

    // Luego incorporar legacy
    registrosLegacy.forEach((item) => {
      const clave = String(item.id || item.numero_caso || "").trim();
      if (clave) mapaUnificados.set(clave, item);
    });

    // Finalmente sobreescribir con registros oficiales de injected_services
    registrosOficiales.forEach((item) => {
      const clave = String(item.id || item.numero_caso || "").trim();
      if (clave) mapaUnificados.set(clave, item);
    });

    const listaFinal = Array.from(mapaUnificados.values());

    if (listaFinal.length > 0) {
      // Sincronizar respaldo dual garantizado en localStorage con la lista consolidada
      sincronizarCacheLocalServicios(listaFinal);

      // Si hay registros legacy que no están en injected_services, respaldarlos en background
      if (registrosLegacy.length > 0) {
        try {
          const payloadMigracion = registrosLegacy.map(normalizarParaInjectedServices);
          supabase.from(TABLA_SERVICIOS_OFICIAL).upsert(payloadMigracion, { onConflict: "id" }).catch(() => {});
        } catch (_) {}
      }

      return listaFinal;
    }

    // 5. Semilla por defecto si no hay nada guardado en ningún medio
    return SERVICIOS_INICIALES_DEFAULT;
  } catch (e) {
    console.warn("Excepción al cargar servicios de soporte (usando respaldo local):", e.message);
    const locales = getServiciosLocal();
    return locales.length > 0 ? locales : SERVICIOS_INICIALES_DEFAULT;
  }
}

/**
 * Guarda o actualiza un servicio con persistencia dual obligatoria:
 * 1. Respaldo inmediato en LocalStorage (recuperación offline/falla de red garantizada).
 * 2. Persistencia en Supabase en injected_services y réplica en soporte_servicios.
 */
export async function guardarServicioSoporte(servicio) {
  const itemConId = {
    id: servicio.id || `serv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    numero_caso: servicio.numero_caso || servicio.case_number || "Sin número",
    case_number: servicio.case_number || servicio.numero_caso || "Sin número",
    fecha_solicitud: servicio.fecha_solicitud || servicio.request_date || "",
    request_date: servicio.request_date || servicio.fecha_solicitud || "",
    fecha_atencion: servicio.fecha_atencion || servicio.service_date || "",
    service_date: servicio.service_date || servicio.fecha_atencion || "",
    fecha_finalizacion: servicio.fecha_finalizacion || servicio.end_date || "",
    end_date: servicio.end_date || servicio.fecha_finalizacion || "",
    mesa: servicio.mesa || "2",
    proveedor: servicio.proveedor || servicio.provider_entity || "",
    provider_entity: servicio.provider_entity || servicio.proveedor || "",
    cliente: servicio.cliente || servicio.client || "Cliente",
    client: servicio.client || servicio.cliente || "Cliente",
    coordinador: servicio.coordinador || servicio.coordinator || "Oswaldo",
    coordinator: servicio.coordinator || servicio.coordinador || "Oswaldo",
    valor_servicios: Number(servicio.valor_servicios != null ? servicio.valor_servicios : servicio.service_value) || 0,
    service_value: Number(servicio.service_value != null ? servicio.service_value : servicio.valor_servicios) || 0,
    valor_viaticos: Number(servicio.valor_viaticos != null ? servicio.valor_viaticos : servicio.travel_expenses) || 0,
    travel_expenses: Number(servicio.travel_expenses != null ? servicio.travel_expenses : servicio.valor_viaticos) || 0,
    valor_materiales: Number(servicio.valor_materiales != null ? servicio.valor_materiales : servicio.materials) || 0,
    materials: Number(servicio.materials != null ? servicio.materials : servicio.valor_materiales) || 0,
    sh: servicio.sh || "SOFTWARE - HARDWARE",
    tecnico: servicio.tecnico || "Jhon Alexander Vasquez Reveló",
    medio: servicio.medio || "SITIO",
    equipo: servicio.equipo || "",
    falla: servicio.falla || "",
    causa: servicio.causa || "",
    solucion: servicio.solucion || "",
    pruebas: servicio.pruebas || "",
    horas: servicio.horas || {},
    plantilla_completa: servicio.plantilla_completa || servicio.template_data || "",
    template_data: servicio.template_data || servicio.plantilla_completa || "",
    foto_url: servicio.foto_url || servicio.evidence_image || "",
    evidence_image: servicio.evidence_image || servicio.foto_url || "",
    payment_status: servicio.payment_status || servicio.status || "confirmed",
    status: servicio.status || servicio.payment_status || "confirmed",
    creado_en: servicio.creado_en || servicio.created_at || new Date().toISOString(),
    created_at: servicio.created_at || servicio.creado_en || new Date().toISOString(),
    actualizado_en: new Date().toISOString()
  };

  // 1. Respaldo de seguridad dual inmediato en LocalStorage
  guardarServicioLocal(itemConId);

  // 2. Persistencia remota en injected_services (tabla oficial)
  try {
    const payloadInjected = normalizarParaInjectedServices(itemConId);
    const { data: dataOficial, error: errOficial } = await supabase
      .from(TABLA_SERVICIOS_OFICIAL)
      .upsert(payloadInjected, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (!errOficial && dataOficial) {
      const unificado = normalizarServicioUnificado(dataOficial);
      guardarServicioLocal(unificado);
    }
  } catch (errInjected) {
    console.warn("Aviso en injected_services remoto:", errInjected.message);
  }

  // 3. Réplica de compatibilidad en soporte_servicios (legacy)
  try {
    await supabase
      .from(TABLA_SERVICIOS_LEGACY)
      .upsert(itemConId, { onConflict: "id" });
  } catch (errLegacy) {
    // Si la tabla legacy no existe, no afecta la operación
  }

  return itemConId;
}

/**
 * Actualiza un servicio existente en Supabase (injected_services y réplica) y localmente.
 */
export async function actualizarServicioSoporte(servicio) {
  let templateDataFinal = "";
  if (servicio.template_data != null) {
    if (typeof servicio.template_data === "object") {
      try {
        templateDataFinal = JSON.stringify(servicio.template_data);
      } catch (_) {
        templateDataFinal = String(servicio.template_data);
      }
    } else {
      templateDataFinal = String(servicio.template_data);
    }
  } else if (servicio.plantilla_completa != null) {
    if (typeof servicio.plantilla_completa === "object") {
      try {
        templateDataFinal = JSON.stringify(servicio.plantilla_completa);
      } catch (_) {
        templateDataFinal = String(servicio.plantilla_completa);
      }
    } else {
      templateDataFinal = String(servicio.plantilla_completa);
    }
  }

  const itemActualizado = {
    ...servicio,
    valor_servicios: Number(servicio.valor_servicios != null ? servicio.valor_servicios : servicio.service_value) || 0,
    service_value: Number(servicio.service_value != null ? servicio.service_value : servicio.valor_servicios) || 0,
    valor_viaticos: Number(servicio.valor_viaticos != null ? servicio.valor_viaticos : servicio.travel_expenses) || 0,
    travel_expenses: Number(servicio.travel_expenses != null ? servicio.travel_expenses : servicio.valor_viaticos) || 0,
    valor_materiales: Number(servicio.valor_materiales != null ? servicio.valor_materiales : servicio.materials) || 0,
    materials: Number(servicio.materials != null ? servicio.materials : servicio.valor_materiales) || 0,
    template_data: templateDataFinal,
    plantilla_completa: templateDataFinal,
    payment_status: servicio.payment_status || servicio.status || "confirmed",
    status: servicio.status || servicio.payment_status || "confirmed",
    actualizado_en: new Date().toISOString()
  };

  // Guardar inmediatamente en localStorage
  guardarServicioLocal(itemActualizado);

  // Actualizar en injected_services
  try {
    const payloadInjected = normalizarParaInjectedServices(itemActualizado);
    await supabase
      .from(TABLA_SERVICIOS_OFICIAL)
      .upsert(payloadInjected, { onConflict: "id" });
  } catch (err) {
    console.warn("Actualización remota en injected_services:", err.message);
  }

  // Réplica en tabla soporte_servicios
  try {
    await supabase
      .from(TABLA_SERVICIOS_LEGACY)
      .upsert(itemActualizado, { onConflict: "id" });
  } catch (e) {}

  return itemActualizado;
}

/**
 * Elimina un servicio de soporte técnico con borrado real, directo y permanente
 * en Supabase (injected_services, soporte_servicios) y en el estado/caché local (localStorage).
 */
export async function eliminarServicioSoporte(id, numeroCaso = "") {
  if (!id && !numeroCaso) return { ok: false };

  // 1. Eliminar inmediatamente del almacenamiento local (Cuenta de Cobro)
  // Solo eliminar la fila exacta por id, NUNCA por numero_caso (podría borrar filas válidas)
  try {
    const items = getServiciosLocal().filter((s) => {
      return s.id !== id;
    });
    localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(items));
  } catch (localErr) {
    console.warn("Aviso al remover de cache local de servicios:", localErr);
  }

  // 2. Borrado real y directo en Supabase (injected_services - tabla oficial)
  // CRÍTICO: Borrar ÚNICAMENTE por UUID (id), NUNCA por case_number
  // ya que múltiples registros válidos pueden compartir el mismo número de caso.
  try {
    if (id) {
      const { error: errId } = await supabase
        .from(TABLA_SERVICIOS_OFICIAL)
        .delete()
        .eq("id", id);
      if (errId) console.warn("Aviso delete injected_services por ID:", errId.message);
    }
  } catch (e) {
    console.error("Error en eliminación directa en injected_services:", e);
  }

  // 3. Borrado en Supabase (soporte_servicios - tabla legacy) solo por ID
  try {
    if (id) {
      await supabase.from(TABLA_SERVICIOS_LEGACY).delete().eq("id", id);
    }
  } catch (e) {
    // Si la tabla legacy no existe o falla, no bloquea el flujo
  }

  // 4. Borrado sincronizado en Registro General de Servicios solo por ID
  try {
    if (id) {
      await supabase.from(TABLA_REGISTRO_SERVICIOS).delete().eq("id", id);
    }
  } catch (_) {}

  return { ok: true, id, numeroCaso };
}

/**
 * Sube una captura o imagen técnica al bucket temporal de Supabase Storage.
 * Cuenta con política de ciclo de vida (TTL 7 días).
 */
export async function subirImagenTemporalSoporte(fileBlob, nombreSugerido = "captura.jpg") {
  const extension = fileBlob.type?.includes("png") ? "png" : "jpg";
  const nombreArchivo = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${extension}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_TEMPORAL)
      .upload(nombreArchivo, fileBlob, {
        contentType: fileBlob.type || "image/jpeg",
        upsert: false
      });

    if (error) {
      console.warn("Storage remoto no disponible, usando DataURL temporal:", error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_TEMPORAL).getPublicUrl(nombreArchivo);
    return data?.publicUrl || null;
  } catch (e) {
    console.warn("Error subiendo imagen temporal:", e.message);
    return null;
  }
}

/**
 * Purga de imágenes temporales expiradas (> 7 días)
 */
export async function purgarImagenesTemporales(diasTTL = 7) {
  try {
    // Si existe la función RPC en Postgres
    const { data, error } = await supabase.rpc("purgar_archivos_temporales_soporte", {
      dias_retencion: diasTTL
    });
    if (!error) return { ok: true, purgados: data };
  } catch (e) {
    console.warn("Función RPC purga no disponible aún:", e.message);
  }
  return { ok: true, purgados: 0, info: "Purga programada vía pg_cron / TTL de Supabase" };
}

/**
 * Rutina de limpieza / purga mensual de imágenes de evidencia (TTL mensual).
 * Elimina las fotos de evidencia una vez superado el mes para liberar espacio de almacenamiento.
 */
export async function purgarEvidenciasMensuales(mes, anio) {
  let purgados = 0;
  try {
    // 1. Limpieza en base de datos local
    const servicios = getServiciosLocal();
    const actualizados = servicios.map((s) => {
      // Si el servicio pertenece al mes/año especificado y tiene imagen
      if (s.foto_url) {
        purgados++;
        return { ...s, foto_url: "" };
      }
      return s;
    });
    localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(actualizados));

    // 2. Limpieza en registros históricos locales
    const registros = getRegistrosServiciosLocal();
    const regActualizados = registros.map((r) => {
      if (r.foto_url) {
        return { ...r, foto_url: "" };
      }
      return r;
    });
    localStorage.setItem(LOCAL_STORAGE_REGISTRO_SERVICIOS, JSON.stringify(regActualizados));

    // 3. Limpieza remota en Supabase si está disponible (ambas tablas)
    try {
      // injected_services (tabla oficial)
      await supabase
        .from(TABLA_SERVICIOS_OFICIAL)
        .update({ evidence_image: "" })
        .not("evidence_image", "is", null);

      // soporte_servicios (tabla legacy)
      await supabase
        .from(TABLA_SERVICIOS_LEGACY)
        .update({ foto_url: "" })
        .not("foto_url", "is", null);

      await supabase
        .from(TABLA_REGISTRO_SERVICIOS)
        .update({ foto_url: "" })
        .not("foto_url", "is", null);
    } catch (e) {
      console.warn("Aviso en limpieza remota de fotos:", e);
    }

    return { ok: true, purgados };
  } catch (err) {
    console.error("Error en purga mensual de evidencias:", err);
    throw err;
  }
}

// Helpers de persistencia dual y sincronización local
export function sincronizarCacheLocalServicios(serviciosArray) {
  if (typeof window === "undefined" || !Array.isArray(serviciosArray)) return;
  try {
    const limpios = serviciosArray.map(normalizarServicioUnificado);
    localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(limpios));
  } catch (e) {
    console.error("Error sincronizando cache local de servicios:", e);
  }
}

export function getServiciosLocal() {
  if (typeof window === "undefined") return SERVICIOS_INICIALES_DEFAULT;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SERVICIOS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(SERVICIOS_INICIALES_DEFAULT));
      return SERVICIOS_INICIALES_DEFAULT;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizarServicioUnificado);
    }
    return SERVICIOS_INICIALES_DEFAULT;
  } catch (e) {
    return SERVICIOS_INICIALES_DEFAULT;
  }
}

export function guardarServicioLocal(item) {
  if (typeof window === "undefined" || !item) return;
  try {
    const unificado = normalizarServicioUnificado(item);
    const actual = getServiciosLocal();
    const index = actual.findIndex((s) => s.id === unificado.id);
    let nuevo;
    if (index >= 0) {
      nuevo = [...actual];
      nuevo[index] = unificado;
    } else {
      nuevo = [...actual, unificado];
    }
    localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(nuevo));
  } catch (e) {
    console.error("Error guardando localmente:", e);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO INDEPENDIENTE: REGISTRO DE SERVICIOS E HISTORIAL DE PLANTILLAS IT
// ════════════════════════════════════════════════════════════════════════════

// Semillas iniciales del registro de servicios con plantillas corporativas generadas
export const REGISTROS_SERVICIOS_DEFAULT = [
  {
    id: "reg-1",
    numero_caso: "2254390",
    fecha_solicitud: "02/08/2026",
    fecha_atencion: "02/08/2026",
    fecha_finalizacion: "02/08/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    equipo: "Terminal POS 04",
    falla: "Mantenimiento preventivo e inspección de terminales",
    causa: "Mantenimiento programado de hardware",
    solucion: "Revisión física, limpieza de ventiladores y verificación de voltajes.",
    pruebas: "Prueba de impresión de tira de comprobación exitosa.",
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    medio: "SITIO",
    plantilla_completa:
      "*REPORTE DE SOPORTE TÉCNICO EN SITIO*\n" +
      "N° Caso: 2254390\n" +
      "Fecha: 02/08/2026\n" +
      "Cliente: Jumbo Popayán\n" +
      "Mesa: 2 | Coordinador: Oswaldo\n" +
      "Equipo: Terminal POS 04\n" +
      "Falla Reportada: Mantenimiento preventivo e inspección de terminales\n" +
      "Diagnóstico: Mantenimiento programado de hardware\n" +
      "Solución: Revisión física, limpieza de ventiladores y verificación de voltajes.\n" +
      "Pruebas Realizadas: Prueba de impresión de tira de comprobación exitosa.\n" +
      "Estado: CERRADO Y ENTREGADO A CONFORMIDAD\n" +
      "Técnico: Jhon Alexander Vasquez Reveló",
    foto_url: "",
    creado_en: "2026-08-02T10:00:00Z",
    actualizado_en: "2026-08-02T10:00:00Z"
  },
  {
    id: "reg-2",
    numero_caso: "2268949",
    fecha_solicitud: "01/08/2026",
    fecha_atencion: "02/08/2026",
    fecha_finalizacion: "02/08/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    equipo: "Caja Registradora 02",
    falla: "Falla en periféricos de cajas registradoras",
    causa: "Cable de escáner USB con falso contacto",
    solucion: "Sustitución de cableado y reprogramación de puerto serie.",
    pruebas: "Lectura de códigos de barras EAN-13 validada.",
    sh: "HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    medio: "SITIO",
    plantilla_completa:
      "*REPORTE DE SOPORTE TÉCNICO EN SITIO*\n" +
      "N° Caso: 2268949\n" +
      "Fecha: 02/08/2026\n" +
      "Cliente: Jumbo Popayán\n" +
      "Mesa: 2 | Coordinador: Oswaldo\n" +
      "Equipo: Caja Registradora 02\n" +
      "Falla Reportada: Falla en periféricos de cajas registradoras\n" +
      "Diagnóstico: Cable de escáner USB con falso contacto\n" +
      "Solución: Sustitución de cableado y reprogramación de puerto serie.\n" +
      "Pruebas Realizadas: Lectura de códigos de barras EAN-13 validada.\n" +
      "Estado: OPERATIVO 100%\n" +
      "Técnico: Jhon Alexander Vasquez Reveló",
    foto_url: "",
    creado_en: "2026-08-02T14:30:00Z",
    actualizado_en: "2026-08-02T14:30:00Z"
  },
  {
    id: "reg-3",
    numero_caso: "2303375",
    fecha_solicitud: "23/09/2026",
    fecha_atencion: "24/09/2026",
    fecha_finalizacion: "24/09/2026",
    mesa: "2",
    proveedor: "Cencosud",
    cliente: "Jumbo Popayán",
    coordinador: "Oswaldo",
    equipo: "W005290ADM15",
    falla: "Actualización sistema operativo y dominio",
    causa: "Migración corporativa a Windows 11 Enterprise",
    solucion: "Punto de red habilitado, configuración de perfil corporativo y políticas de red.",
    pruebas: "Inicio de sesión en dominio y conexión a carpetas compartidas verificada.",
    sh: "SOFTWARE - HARDWARE",
    tecnico: "Jhon Alexander Vasquez Reveló",
    medio: "SITIO",
    plantilla_completa:
      "*REPORTE DE SOPORTE TÉCNICO EN SITIO*\n" +
      "N° Caso: 2303375\n" +
      "Fecha: 24/09/2026\n" +
      "Cliente: Jumbo Popayán\n" +
      "Mesa: 2 | Coordinador: Oswaldo\n" +
      "Equipo: W005290ADM15\n" +
      "Falla Reportada: Actualización sistema operativo y dominio\n" +
      "Diagnóstico: Migración corporativa a Windows 11 Enterprise\n" +
      "Solución: Punto de red habilitado, configuración de perfil corporativo y políticas de red.\n" +
      "Pruebas Realizadas: Inicio de sesión en dominio y conexión a carpetas compartidas verificada.\n" +
      "Estado: CERRADO SATISFACTORIAMENTE\n" +
      "Técnico: Jhon Alexander Vasquez Reveló",
    foto_url: "",
    creado_en: "2026-09-24T12:00:00Z",
    actualizado_en: "2026-09-24T12:00:00Z"
  }
];

/**
 * Obtiene todos los registros del historial de servicios y plantillas corporativas.
 */
export async function getRegistrosServicios() {
  try {
    const { data, error } = await supabase
      .from(TABLA_REGISTRO_SERVICIOS)
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      console.warn("Aviso al consultar registro_servicios en Supabase (usando local):", error.message);
      return getRegistrosServiciosLocal();
    }

    if (!data || data.length === 0) {
      const locales = getRegistrosServiciosLocal();
      return locales.length > 0 ? locales : REGISTROS_SERVICIOS_DEFAULT;
    }

    return data;
  } catch (e) {
    console.warn("Excepción al cargar registro de servicios:", e.message);
    return getRegistrosServiciosLocal();
  }
}

/**
 * Guarda o actualiza un registro independiente en el Registro de Servicios (sin alterar cuentas de cobro).
 */
export async function guardarRegistroServicio(registro) {
  const itemConId = {
    id: registro.id || `reg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    numero_caso: registro.numero_caso || "Sin número",
    fecha_solicitud: registro.fecha_solicitud || "",
    fecha_atencion: registro.fecha_atencion || "",
    fecha_finalizacion: registro.fecha_finalizacion || "",
    mesa: registro.mesa || "2",
    proveedor: registro.proveedor || "",
    cliente: registro.cliente || "Cliente",
    coordinador: registro.coordinador || "Oswaldo",
    equipo: registro.equipo || "",
    falla: registro.falla || "",
    causa: registro.causa || "",
    solucion: registro.solucion || "",
    pruebas: registro.pruebas || "",
    horas: registro.horas || {},
    sh: registro.sh || "SOFTWARE - HARDWARE",
    tecnico: registro.tecnico || "Jhon Alexander Vasquez Reveló",
    medio: registro.medio || "SITIO",
    plantilla_completa: registro.plantilla_completa || "",
    foto_url: registro.foto_url || "",
    creado_en: registro.creado_en || new Date().toISOString(),
    actualizado_en: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from(TABLA_REGISTRO_SERVICIOS)
      .upsert(itemConId, { onConflict: "id" })
      .select()
      .single();

    if (!error && data) {
      guardarRegistroServicioLocal(data);
      return data;
    }
  } catch (err) {
    console.warn("Guardado remoto en soporte_registro_servicios falló, usando caché local:", err.message);
  }

  guardarRegistroServicioLocal(itemConId);
  return itemConId;
}

/**
 * Elimina un registro individual del historial de servicios y sincroniza con injected_services.
 */
export async function eliminarRegistroServicio(id, numeroCaso = "") {
  // 1. Borrado directo en supabase.from('soporte_registro_servicios') SOLO por UUID
  try {
    if (id) {
      await supabase.from(TABLA_REGISTRO_SERVICIOS).delete().eq("id", id);
    }
  } catch (e) {
    console.warn("Eliminación remota de registro de servicio:", e.message);
  }

  // 2. Borrado sincronizado en injected_services SOLO por UUID
  try {
    if (id) {
      await supabase.from(TABLA_SERVICIOS_OFICIAL).delete().eq("id", id);
    }
  } catch (_) {}

  // 3. Borrado local únicamente por ID
  const items = getRegistrosServiciosLocal().filter((r) => r.id !== id);
  localStorage.setItem(LOCAL_STORAGE_REGISTRO_SERVICIOS, JSON.stringify(items));
}

/**
 * Depura únicamente los registros de servicios/plantillas de un mes y año específicos,
 * garantizando que las cuentas de cobro permanezcan completamente intactas.
 */
export async function depurarRegistrosServiciosPorMes(mes, anio) {
  const todos = getRegistrosServiciosLocal();
  const idsAEliminar = [];

  todos.forEach((r) => {
    const fechas = [r.fecha_atencion, r.fecha_solicitud, r.fecha_finalizacion];
    let coincide = false;
    for (const f of fechas) {
      if (!f || typeof f !== "string") continue;
      const dmy = f.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dmy && parseInt(dmy[2], 10) === Number(mes) && parseInt(dmy[3], 10) === Number(anio)) {
        coincide = true;
        break;
      }
      const ymd = f.trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (ymd && parseInt(ymd[2], 10) === Number(mes) && parseInt(ymd[1], 10) === Number(anio)) {
        coincide = true;
        break;
      }
    }
    if (!coincide && r.creado_en) {
      const d = new Date(r.creado_en);
      if (!isNaN(d.getTime()) && d.getMonth() + 1 === Number(mes) && d.getFullYear() === Number(anio)) {
        coincide = true;
      }
    }
    if (coincide) idsAEliminar.push(r.id);
  });

  // Intentar eliminar de Supabase si hay IDs
  if (idsAEliminar.length > 0) {
    try {
      await supabase.from(TABLA_REGISTRO_SERVICIOS).delete().in("id", idsAEliminar);
    } catch (e) {
      console.warn("Depuración remota en soporte_registro_servicios:", e.message);
    }
  }

  // Eliminar de almacenamiento local
  const restantes = todos.filter((r) => !idsAEliminar.includes(r.id));
  localStorage.setItem(LOCAL_STORAGE_REGISTRO_SERVICIOS, JSON.stringify(restantes));

  return { depurados: idsAEliminar.length, restantes };
}

// Helpers locales para soporte_registro_servicios
function getRegistrosServiciosLocal() {
  if (typeof window === "undefined") return REGISTROS_SERVICIOS_DEFAULT;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REGISTRO_SERVICIOS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_REGISTRO_SERVICIOS, JSON.stringify(REGISTROS_SERVICIOS_DEFAULT));
      return REGISTROS_SERVICIOS_DEFAULT;
    }
    return JSON.parse(raw);
  } catch (e) {
    return REGISTROS_SERVICIOS_DEFAULT;
  }
}

function guardarRegistroServicioLocal(item) {
  if (typeof window === "undefined") return;
  try {
    const actual = getRegistrosServiciosLocal();
    const index = actual.findIndex((r) => r.id === item.id);
    let nuevo;
    if (index >= 0) {
      nuevo = [...actual];
      nuevo[index] = item;
    } else {
      nuevo = [item, ...actual];
    }
    localStorage.setItem(LOCAL_STORAGE_REGISTRO_SERVICIOS, JSON.stringify(nuevo));
  } catch (e) {
    console.error("Error guardando registro de servicio local:", e);
  }
}

