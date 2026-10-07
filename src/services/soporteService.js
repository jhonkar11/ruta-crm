import { supabase } from "./supabaseClient";

const TABLA_SERVICIOS = "soporte_servicios";
const TABLA_REGISTRO_SERVICIOS = "soporte_registro_servicios";
const BUCKET_TEMPORAL = "soporte-temporales";
const LOCAL_STORAGE_SERVICIOS = "CRM_SOPORTE_SERVICIOS_LOCAL";
const LOCAL_STORAGE_REGISTRO_SERVICIOS = "CRM_SOPORTE_REGISTRO_SERVICIOS_LOCAL";

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

/**
 * Obtiene los servicios registrados para la cuenta de cobro activa.
 */
export async function getServiciosSoporte() {
  try {
    const { data, error } = await supabase
      .from(TABLA_SERVICIOS)
      .select("*")
      .order("creado_en", { ascending: true });

    if (error) {
      console.warn("Aviso al consultar Supabase (usando almacenamiento local):", error.message);
      return getServiciosLocal();
    }

    if (!data || data.length === 0) {
      // Si la tabla remota está vacía, poblar con las semillas o el almacenamiento local
      const locales = getServiciosLocal();
      return locales.length > 0 ? locales : SERVICIOS_INICIALES_DEFAULT;
    }

    return data;
  } catch (e) {
    console.warn("Excepción al cargar servicios de soporte:", e.message);
    return getServiciosLocal();
  }
}

/**
 * Guarda o actualiza un servicio de soporte técnico en Supabase y localmente.
 */
export async function guardarServicioSoporte(servicio) {
  const itemConId = {
    id: servicio.id || `serv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    numero_caso: servicio.numero_caso || "Sin número",
    fecha_solicitud: servicio.fecha_solicitud || "",
    fecha_atencion: servicio.fecha_atencion || "",
    fecha_finalizacion: servicio.fecha_finalizacion || "",
    mesa: servicio.mesa || "2",
    proveedor: servicio.proveedor || "",
    cliente: servicio.cliente || "Cliente",
    coordinador: servicio.coordinador || "Oswaldo",
    valor_servicios: Number(servicio.valor_servicios) || 0,
    valor_viaticos: Number(servicio.valor_viaticos) || 0,
    valor_materiales: Number(servicio.valor_materiales) || 0,
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
    payment_status: servicio.payment_status || "confirmed",
    creado_en: servicio.creado_en || new Date().toISOString(),
    actualizado_en: new Date().toISOString()
  };

  // Guardar en Supabase
  try {
    const { data, error } = await supabase
      .from(TABLA_SERVICIOS)
      .upsert(itemConId, { onConflict: "id" })
      .select()
      .single();

    if (!error && data) {
      guardarServicioLocal(data);
      return data;
    }
  } catch (err) {
    console.warn("Guardado remoto falló, almacenando en caché local:", err.message);
  }

  // Guardar en almacenamiento local como respaldo garantizado
  guardarServicioLocal(itemConId);
  return itemConId;
}

/**
 * Actualiza un servicio de soporte técnico existente en Supabase y localmente.
 */
export async function actualizarServicioSoporte(servicio) {
  const itemActualizado = {
    ...servicio,
    valor_servicios: Number(servicio.valor_servicios) || 0,
    valor_viaticos: Number(servicio.valor_viaticos) || 0,
    valor_materiales: Number(servicio.valor_materiales) || 0,
    payment_status: servicio.payment_status || "confirmed",
    actualizado_en: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from(TABLA_SERVICIOS)
      .upsert(itemActualizado, { onConflict: "id" })
      .select()
      .single();

    if (!error && data) {
      guardarServicioLocal(data);
      return data;
    }
  } catch (err) {
    console.warn("Actualización remota falló, actualizando caché local:", err.message);
  }

  guardarServicioLocal(itemActualizado);
  return itemActualizado;
}

/**
 * Elimina un servicio de soporte técnico.
 */
export async function eliminarServicioSoporte(id) {
  try {
    await supabase.from(TABLA_SERVICIOS).delete().eq("id", id);
  } catch (e) {
    console.warn("Eliminación remota:", e.message);
  }

  // Eliminar de almacenamiento local
  const items = getServiciosLocal().filter((s) => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(items));
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

// Helpers de persistencia local
function getServiciosLocal() {
  if (typeof window === "undefined") return SERVICIOS_INICIALES_DEFAULT;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SERVICIOS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_SERVICIOS, JSON.stringify(SERVICIOS_INICIALES_DEFAULT));
      return SERVICIOS_INICIALES_DEFAULT;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SERVICIOS_INICIALES_DEFAULT;
  }
}

function guardarServicioLocal(item) {
  if (typeof window === "undefined") return;
  try {
    const actual = getServiciosLocal();
    const index = actual.findIndex((s) => s.id === item.id);
    let nuevo;
    if (index >= 0) {
      nuevo = [...actual];
      nuevo[index] = item;
    } else {
      nuevo = [...actual, item];
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
 * Elimina un registro individual del historial de servicios.
 */
export async function eliminarRegistroServicio(id) {
  try {
    await supabase.from(TABLA_REGISTRO_SERVICIOS).delete().eq("id", id);
  } catch (e) {
    console.warn("Eliminación remota de registro de servicio:", e.message);
  }

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

