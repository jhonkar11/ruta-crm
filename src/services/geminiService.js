import { supabase } from "./supabaseClient";

/**
 * Cliente del motor de IA.
 *
 * SEGURIDAD: la GEMINI_API_KEY vive únicamente en el servidor (Vercel) y ya no
 * se pide, ni se guarda, ni se lee desde este módulo. Este archivo sólo habla con
 * el proxy /api/gemini usando el token de sesión de Supabase.
 */

/**
 * Modelos que el SERVIDOR acepta. Deben coincidir con `api/_lib/gemini.js`.
 *
 * Google RETIRÓ gemini-1.5-*, gemini-2.0-flash y gemini-2.5-*: llamarlos devuelve
 * HTTP 404 ("This model ... is no longer available"). Esos identificadores se
 * normalizan al modelo vigente, nunca se envían a la API.
 */
export const MODELO_GEMINI_POR_DEFECTO = "gemini-3.8-flash";

export const MODELOS_GEMINI = [
  {
    id: "gemini-3.8-flash",
    nombre: "Gemini 3.8 Flash",
    descripcion: "Modelo vigente. Precisión OCR y estabilidad",
    recomendado: true
  },
  {
    id: "gemini-3.7-flash",
    nombre: "Gemini 3.7 Flash",
    descripcion: "Respaldo estable del anterior"
  },
  {
    id: "gemini-3.6-flash",
    nombre: "Gemini 3.6 Flash",
    descripcion: "Respaldo con mayor capacidad"
  },
  {
    id: "gemini-3.5-flash",
    nombre: "Gemini 3.5 Flash",
    descripcion: "Respaldo de mayor estabilidad"
  },
  {
    id: "gemini-3.1-flash-lite",
    nombre: "Gemini 3.1 Flash Lite",
    descripcion: "Opción ligera y económica"
  }
];

const MODELOS_PERMITIDOS = new Set(MODELOS_GEMINI.map((m) => m.id));

export function normalizarModeloGemini(modelId) {
  return MODELOS_PERMITIDOS.has(modelId) ? modelId : MODELO_GEMINI_POR_DEFECTO;
}

const ENDPOINT = "/api/gemini";

/** Extrae el token de sesión de Supabase para autenticar contra el proxy. */
async function tokenDeSesion() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const token = data?.session?.access_token;
    if (!token) throw new Error("No hay una sesión activa. Inicia sesión de nuevo.");
    return token;
  } catch (err) {
    throw new Error(`Sesión no disponible: ${err?.message || err}`);
  }
}

function descErrorRed(status, mensaje) {
  switch (status) {
    case 401:
      return "Sesión no válida o expirada. Vuelve a iniciar sesión.";
    case 403:
      return "Acceso denegado. El motor de IA es un módulo exclusivo del administrador.";
    case 405:
      return "El endpoint /api/gemini no está disponible (revisa el despliegue en Vercel).";
    case 413:
      return "La imagen es demasiado grande. Reduce su tamaño e intenta de nuevo.";
    case 429:
      return `Cuota o límite alcanzado. ${mensaje || "Espera unos segundos e inténtalo de nuevo."}`;
    case 502:
      return (
        mensaje ||
        "El motor de IA no pudo responder ahora mismo (Google está saturado o el modelo no está disponible). Intenta de nuevo en unos segundos."
      );
    case 503:
      return mensaje || "El servidor de IA no está configurado (falta GEMINI_API_KEY en Vercel).";
    default:
      return mensaje || `Error ${status} en el motor de IA.`;
  }
}

/**
 * POST autenticado contra el proxy seguro.
 * @param {object} payload - { accion, imagenBase64, mimeType, textoNotas, modelName }
 */
async function llamarProxy(payload) {
  const token = await tokenDeSesion();

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    throw new Error(
      `No se pudo contactar el servidor de IA (${ENDPOINT}). ${
        err?.message || "Revisa tu conexión."
      }`
    );
  }

  let cuerpo = null;
  try {
    cuerpo = await res.json();
  } catch {
    cuerpo = null;
  }

  if (!res.ok || cuerpo?.ok === false) {
    throw new Error(descErrorRed(res.status, cuerpo?.error));
  }
  return cuerpo || {};
}

/** ¿Existe GEMINI_API_KEY en el servidor? (no consume cuota de Gemini) */
export async function estadoMotorIA() {
  try {
    return await llamarProxy({ accion: "estado" });
  } catch (err) {
    return { ok: false, configurado: false, error: err?.message || String(err) };
  }
}

/**
 * Diagnóstico en vivo: hace una llamada real (mínima) a Gemini desde el servidor.
 * @returns {Promise<{ok:boolean, message:string, modeloUsado?:string}>}
 */
export async function testGeminiApiKey(_unusedApiKey, modelName = MODELO_GEMINI_POR_DEFECTO) {
  try {
    const r = await llamarProxy({
      accion: "testear",
      modelName: normalizarModeloGemini(modelName)
    });
    return {
      ok: true,
      message: r.mensaje || `Conexión exitosa con ${r.modeloUsado}.`,
      modeloUsado: r.modeloUsado
    };
  } catch (err) {
    return { ok: false, message: err?.message || String(err) };
  }
}

/**
 * Extrae datos estructurados de servicio a partir de una captura de pantalla (OCR),
 * de notas de texto/voz y de la plantilla institucional del cliente pegada en bruto.
 * El prompt y el modelo se aplican en el servidor.
 *
 * @param {object} params
 * @param {string} [params.imagenBase64] - Imagen en base64 pura (sin el prefijo data:...)
 * @param {string} [params.mimeType] - MimeType de la imagen (ej: 'image/png')
 * @param {string} [params.textoNotas] - Notas dictadas o escritas por el técnico
 * @param {string} [params.plantillaInstitucional] - Texto crudo de la plantilla del banco
 * @param {string} [params.modelId] - Modelo a usar
 */
export async function extraerDatosDeServicio({
  imagenBase64,
  mimeType = "image/png",
  textoNotas = "",
  plantillaInstitucional = "",
  modelId = MODELO_GEMINI_POR_DEFECTO
}) {
  const resultado = await llamarProxy({
    accion: "extraer",
    imagenBase64: imagenBase64 || null,
    mimeType: mimeType || "image/png",
    textoNotas: textoNotas || "",
    plantillaInstitucional: plantillaInstitucional || "",
    modelName: normalizarModeloGemini(modelId)
  });

  return resultado.datos || {};
}

/**
 * Regenera únicamente la Plantilla Corporativa Oficial a partir del texto
 * institucional en bruto. Útil cuando el técnico edita la plantilla y quiere
 * volver a mapearla sin reprocesar la captura.
 *
 * @returns {Promise<string>} Texto de la plantilla corporativa.
 */
export async function generarPlantillaDesdeInstitucional({
  plantillaInstitucional = "",
  textoNotas = "",
  datos = {},
  modelId = MODELO_GEMINI_POR_DEFECTO
}) {
  const resultado = await llamarProxy({
    accion: "plantilla",
    plantillaInstitucional: plantillaInstitucional || "",
    textoNotas: textoNotas || "",
    datos: datos || {},
    modelName: normalizarModeloGemini(modelId)
  });

  return resultado.plantilla || "";
}

/**
 * Mapeador dinámico tipo "espejo" sobre la plantilla institucional de entrada.
 * NO utiliza ninguna plantilla fija o predeterminada quemada.
 * Si no se proporciona plantillaInstitucional, retorna cadena vacía.
 */
export function generarPlantillaSolucion(datos = {}, plantillaInstitucional = "") {
  if (!plantillaInstitucional || !String(plantillaInstitucional).trim()) {
    return "";
  }

  const raw = String(plantillaInstitucional);
  const lineas = raw.split(/\r?\n/);

  // Mapeador tipo espejo que preserva 100% la estructura original y saltos de línea
  const resultado = lineas.map((linea) => {
    let l = linea;

    // 1. Soporte para variables tipo $$Variable (ej: $$Inc, $$Tecnico, $$Falla, $$Solucion, etc.)
    l = l.replace(/\$\$(?:inc|wo|caso|ticket|requerimiento)\b/gi, datos?.numero_caso || "");
    l = l.replace(/\$\$(?:cliente|banco|entidad)\b/gi, datos?.cliente || "");
    l = l.replace(/\$\$(?:mesa)\b/gi, datos?.mesa || "");
    l = l.replace(/\$\$(?:coordinador)\b/gi, datos?.coordinador || "");
    l = l.replace(/\$\$(?:equipo|serial|hostname)\b/gi, datos?.equipo || "");
    l = l.replace(/\$\$(?:medio)\b/gi, datos?.medio || "");
    l = l.replace(/\$\$(?:sh|tipo_soporte)\b/gi, datos?.sh || "");
    l = l.replace(/\$\$(?:falla|problema)\b/gi, datos?.falla || "");
    l = l.replace(/\$\$(?:solucion|actividades)\b/gi, datos?.solucion || "");
    l = l.replace(/\$\$(?:pruebas)\b/gi, datos?.pruebas || "");
    l = l.replace(/\$\$(?:tecnico)\b/gi, datos?.tecnico || "");
    l = l.replace(/\$\$(?:fecha|fecha_atencion)\b/gi, datos?.fecha_atencion || "");
    l = l.replace(/\$\$(?:hora_inicio)\b/gi, datos?.horas?.inicio || "");
    l = l.replace(/\$\$(?:hora_fin)\b/gi, datos?.horas?.fin || "");
    l = l.replace(/\$\$(?:hora_desplazamiento)\b/gi, datos?.horas?.desplazamiento || "");

    // 2. Mapeo sobre etiquetas estándar vacías al final de línea (dos puntos o igual)
    if (/(?:n[°o]|numero|número)\s*(?:de\s*)?(?:caso|requerimiento|ticket|inc|wo)\s*[:=]\s*$/i.test(l) && datos?.numero_caso) {
      return l + " " + datos.numero_caso;
    }
    if (/(?:cliente(?:\s*final)?|banco|entidad)\s*[:=]\s*$/i.test(l) && datos?.cliente) {
      return l + " " + datos.cliente;
    }
    if (/(?:mesa(?:\s*de\s*soporte)?)\s*[:=]\s*$/i.test(l) && datos?.mesa) {
      return l + " " + datos.mesa;
    }
    if (/(?:coordinador(?:a)?)\s*[:=]\s*$/i.test(l) && datos?.coordinador) {
      return l + " " + datos.coordinador;
    }
    if (/(?:equipo(?:\s*\/\s*serial)?|serial|hostname)\s*[:=]\s*$/i.test(l) && datos?.equipo) {
      return l + " " + datos.equipo;
    }
    if (/(?:tipo\s*de\s*medio|medio)\s*[:=]\s*$/i.test(l) && datos?.medio) {
      return l + " " + datos.medio;
    }
    if (/(?:sh\s*\/\s*hw|sh)\s*[:=]\s*$/i.test(l) && datos?.sh) {
      return l + " " + datos.sh;
    }
    if (/(?:falla(?:\s*reportada)?|problema)\s*[:=]\s*$/i.test(l) && datos?.falla) {
      return l + " " + datos.falla;
    }
    if (/(?:soluci[oó]n(?:\s*t[eé]cnica)?|actividades(?:\s*realizadas)?)\s*[:=]\s*$/i.test(l) && datos?.solucion) {
      return l + " " + datos.solucion;
    }
    if (/(?:pruebas(?:\s*de\s*validaci[oó]n)?)\s*[:=]\s*$/i.test(l) && datos?.pruebas) {
      return l + " " + datos.pruebas;
    }
    if (/(?:t[eé]cnico(?:\s*responsable)?)\s*[:=]\s*$/i.test(l) && datos?.tecnico) {
      return l + " " + datos.tecnico;
    }
    if (/(?:fecha(?:\s*de\s*atenci[oó]n)?)\s*[:=]\s*$/i.test(l) && datos?.fecha_atencion) {
      return l + " " + datos.fecha_atencion;
    }

    return l;
  });

  return resultado.join("\n");
}