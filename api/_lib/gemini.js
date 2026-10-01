import { GoogleGenAI } from "@google/genai";

/**
 * Lado servidor del motor Gemini.
 * La GEMINI_API_KEY vive únicamente en process.env (Vercel): nunca viaja al navegador.
 */

/** Los gemini-1.5-* fueron RETIRADOS por Google y devuelven HTTP 404. */
export const MODELO_POR_DEFECTO = "gemini-2.0-flash";
export const MODELOS_PERMITIDOS = new Set([MODELO_POR_DEFECTO]);

// "v1" es la GA estable; "v1beta" queda como red de seguridad ante un 404 puntual.
const API_VERSIONS = ["v1", "v1beta"];

export function normalizarModelo(modelId) {
  return MODELOS_PERMITIDOS.has(modelId) ? modelId : MODELO_POR_DEFECTO;
}

export function apiKeyDelServidor() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

/**
 * Extrae el mensaje real de Google. El SDK devuelve un JSON enorme anidado
 * ({error:{code,message,status,details[]}}) que no debe mostrarse al usuario.
 */
function mensajeDeGoogle(err) {
  const crudo = err?.message || String(err);
  try {
    const i = crudo.indexOf("{");
    if (i >= 0) {
      const json = JSON.parse(crudo.slice(i));
      if (json?.error?.message) return json.error.message;
      if (json?.error?.status) return json.error.status;
    }
  } catch {
    /* no era JSON */
  }
  return crudo.slice(0, 200);
}

function descErrorGemini(err) {
  const status = err?.status ?? err?.code ?? err?.response?.status;
  const msg = mensajeDeGoogle(err);

  if (/API_KEY_INVALID|API key not valid/i.test(msg)) {
    return "GEMINI_API_KEY inválida. Revisa la variable de entorno en Vercel y vuelve a desplegar.";
  }
  if (status === 404 || /not found/i.test(msg)) {
    return `404 · Modelo o endpoint no encontrado. El modelo válido es "${MODELO_POR_DEFECTO}".`;
  }
  if (status === 401 || status === 403) return `${status} · GEMINI_API_KEY sin permisos en el servidor.`;
  if (status === 429) return "429 · Cuota de Gemini agotada. Espera unos segundos e intenta de nuevo.";
  if (status >= 500) return `${status} · Error del servidor de Google. Reintenta en un momento.`;
  if (status === 400) return `400 · Solicitud rechazada por la API de Gemini: ${msg}`;
  return msg;
}

/** generateContent con reintento de versión de API sólo ante 404. */
async function llamarGemini({ apiKey, model, contents, config }) {
  let lastError = null;

  for (const apiVersion of API_VERSIONS) {
    try {
      const ai = new GoogleGenAI({ apiKey, apiVersion });
      const response = await ai.models.generateContent({ model, contents, config });
      const text = response?.text;
      if (typeof text === "string" && text.trim()) return { text, apiVersion };
      lastError = new Error("La API de Gemini devolvió una respuesta vacía.");
    } catch (err) {
      lastError = err;
      if ((err?.status ?? err?.code) !== 404) break;
    }
  }

  const mensaje = descErrorGemini(lastError);
  const error = new Error(mensaje);
  error.status = lastError?.status ?? lastError?.code ?? 502;
  throw error;
}

/* ------------------------------------------------------------------ */
/* Prompt (vive en el servidor: el cliente no puede alterarlo)        */
/* ------------------------------------------------------------------ */

export function construirPrompt(textoNotas = "") {
  return `
Eres un Arquitecto de Soporte Técnico e IT empresarial de nivel mundial para mesas de ayuda (Mesa IBM, Redes, Hardware y Software).
Tu tarea es analizar minuciosamente la entrada provista (que puede ser una captura de pantalla de un chat técnico de WhatsApp o notas dictadas por el ingeniero de campo) y extraer con máxima precisión los siguientes datos de servicio técnico y generar la información necesaria para la liquidación de la cuenta de cobro y la plantilla corporativa de soporte.

DATOS A EXTRAER Y SU SIGNIFICADO:
1. numero_caso: Código de caso, requerimiento, ticket o ID (ej: "RE26014844 / RF637620" o "2303375").
2. fecha_solicitud: Fecha de asignación o solicitud (formato DD/MM/AAAA). Si no está explícita, usa la fecha de atención o la fecha actual.
3. fecha_atencion: Fecha en que se atendió el servicio (formato DD/MM/AAAA).
4. fecha_finalizacion: Fecha de entrega/cierre del servicio (formato DD/MM/AAAA).
5. mesa: Nombre de la mesa de soporte o tipo de servicio (ej: "Mesa IBM", "Mesa 2", "Soporte en Sitio").
6. cliente: Nombre del cliente o entidad bancaria final (ej: "Banco Popular", "Davivienda", "Banco AV Villas", "Jumbo Popayán").
7. coordinador: Nombre del coordinador o supervisor de servicio (ej: "Oswaldo", etc.). Si no aparece, coloca "Oswaldo".
8. valor_servicios: Valor numérico en pesos colombianos acordado o estimado (ej: 70000, 150000, 200000). Si no aparece, estima un valor base estándar según complejidad (ej: 70000).
9. valor_viaticos: Valor numérico de viáticos si aplica (normalmente 0).
10. valor_materiales: Valor numérico de repuestos o materiales (normalmente 0).
11. sh: Tipo de intervención: "SOFTWARE - HARDWARE", "SOFTWARE" o "HARDWARE".
12. tecnico: Nombre del técnico de campo responsable (ej: "Jhon Alexander Vasquez Reveló" o "JHON ALEXANDER").
13. medio: Medio de atención ("SITIO" o "REMOTO").
14. equipo: Nombre del equipo, serial o hostname corporativo (ej: "W005290ADM15 MJOG6EFA").
15. falla: Resumen conciso de la falla o requerimiento (ej: "ACTUALIZACION SISTEMA OPERATIVO").
16. causa: Diagnóstico técnico de la causa raíz.
17. solucion: Descripción detallada y minuciosa de todas las actividades ejecutadas en sitio y/o en coordinación remota.
18. pruebas: Descripción de las pruebas de validación con el usuario final que certifican el equipo operativo.
19. horas: Objeto con { "desplazamiento": "10:00 am", "inicio": "11:00 am", "fin": "4:00 pm" }.
20. plantilla_completa: Texto formateado exactamente como la plantilla oficial corporativa para WhatsApp.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin bloques de markdown adicionales (sin \`\`\`json ni \`\`\`), con los campos especificados.
${textoNotas ? `\nNOTAS ADICIONALES DEL TÉCNICO:\n"${textoNotas}"` : ""}
`.trim();
}

export function parsearRespuesta(text) {
  const limpio = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(limpio);
  } catch {
    const desde = limpio.indexOf("{");
    const hasta = limpio.lastIndexOf("}");
    if (desde === -1 || hasta === -1 || hasta <= desde) {
      throw new Error("Gemini no devolvió JSON válido.");
    }
    return JSON.parse(limpio.slice(desde, hasta + 1));
  }
}

/* ------------------------------------------------------------------ */
/* Acciones públicas de la API                                          */
/* ------------------------------------------------------------------ */

const LIMITE_NOTAS = 5000;
const LIMITE_BASE64 = 4_000_000;

export async function accionExtraer({ imagenBase64, mimeType, textoNotas, modelName }) {
  const apiKey = apiKeyDelServidor();
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY no está configurada en el servidor Vercel. Agrégala en Settings → Environment Variables y vuelve a desplegar."
    );
    err.status = 503;
    throw err;
  }

  const modelo = normalizarModelo(modelName);
  const notas = String(textoNotas || "").slice(0, LIMITE_NOTAS);

  if (!imagenBase64 && !notas.trim()) {
    const err = new Error("Se requiere una imagen o notas técnicas para procesar.");
    err.status = 400;
    throw err;
  }

  if (imagenBase64 && String(imagenBase64).length > LIMITE_BASE64) {
    const err = new Error("La imagen supera el tamaño máximo permitido (4 MB).");
    err.status = 413;
    throw err;
  }

  const contents = [];
  if (imagenBase64) {
    contents.push({
      inlineData: {
        data: String(imagenBase64),
        mimeType: mimeType || "image/png"
      }
    });
  }
  contents.push({ text: construirPrompt(notas) });

  const { text, apiVersion } = await llamarGemini({
    apiKey,
    model: modelo,
    contents,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  const datos = parsearRespuesta(text);
  return { datos: { ...datos, modelo_usado: modelo }, modeloUsado: modelo, apiVersion };
}

export async function accionTestear({ modelName }) {
  const apiKey = apiKeyDelServidor();
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY no está configurada en el servidor Vercel. Agrégala en Settings → Environment Variables y vuelve a desplegar."
    );
    err.status = 503;
    throw err;
  }

  const modelo = normalizarModelo(modelName);
  const { text, apiVersion } = await llamarGemini({
    apiKey,
    model: modelo,
    contents: "Hola, responde únicamente con la palabra OK si estás activo.",
    config: { maxOutputTokens: 32 }
  });

  return {
    mensaje: `Conexión exitosa con ${modelo} (API ${apiVersion}). Respuesta: ${text.trim()}`,
    modeloUsado: modelo,
    apiVersion
  };
}

/** Diagnóstico sin gastar cuota: ¿existe GEMINI_API_KEY en el servidor? */
export function estadoDelMotor() {
  const configurado = !!apiKeyDelServidor();
  return {
    configurado,
    modelo: MODELO_POR_DEFECTO,
    mensaje: configurado
      ? `GEMINI_API_KEY detectada en el servidor. Listo para usar ${MODELO_POR_DEFECTO}.`
      : "GEMINI_API_KEY no está configurada en el servidor Vercel."
  };
}