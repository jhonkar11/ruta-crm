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
 * Genera la cadena de texto con la estructura de la Plantilla Corporativa Oficial
 * para WhatsApp (función pura, no consume IA).
 */
export function generarPlantillaSolucion(datos) {
  const cliente = datos?.cliente || "Entidad";
  const numCaso = datos?.numero_caso || "";
  const sh = datos?.sh || "SOFTWARE - HARDWARE";
  const tecnicoCorto =
    (datos?.tecnico || "JHON ALEXANDER").split(" ")[0]?.toUpperCase() +
    (datos?.tecnico?.split(" ")[1] ? " " + datos?.tecnico?.split(" ")[1]?.toUpperCase() : "");
  const medio = datos?.medio || "SITIO";
  const equipo = datos?.equipo || "No especificado";
  const falla = (datos?.falla || "Mantenimiento / Soporte Técnico").toUpperCase();
  const causa = datos?.causa || "Desgaste preventivo o requerimiento operativo de usuario.";
  const solucion = datos?.solucion || "Se realiza asistencia técnica en sitio dejando el servicio operativo.";
  const pruebas =
    datos?.pruebas || "Usuario valida operatividad y funcionamiento correcto de los aplicativos.";
  const fechaAtencion = datos?.fecha_atencion || new Date().toLocaleDateString("es-CO");
  const horaInicio = datos?.horas?.inicio || "11:00 am";
  const horaFin = datos?.horas?.fin || "4:00 pm";
  const horaDesplazamiento = datos?.horas?.desplazamiento || "10:00 am";
  const tecnicoFirma = datos?.tecnico || "Jhon Alexander Vasquez Reveló";

  return `*PLANTILLA ${cliente} ${numCaso}*
SH: ${sh}.
Tecnico: ${tecnicoCorto}
Medio: ${medio}
Nombre del equipo: ${equipo}
Falla: ${falla}
Causa: ${causa}
Solución: ${solucion}
Pruebas: ${pruebas}
Fecha de 1 atención: ${fechaAtencion}
Hora inicio: ${horaInicio}
Hora fin: ${horaFin}
Hora de desplazamiento: ${horaDesplazamiento}
Tecnico: ${tecnicoFirma}`.trim();
}