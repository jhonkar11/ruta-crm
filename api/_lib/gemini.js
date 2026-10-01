import { setTimeout as dormir } from "node:timers/promises";

/**
 * Motor Gemini - LADO SERVIDOR.
 *
 * La GEMINI_API_KEY vive únicamente en process.env (Vercel): nunca viaja al navegador.
 *
 * Se usa fetch directo contra la URL oficial en lugar del SDK para tener control
 * explícito y auditable del endpoint:
 *
 *   https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={API_KEY}
 *
 * IMPORTANTE - por qué NO gemini-2.0-flash:
 *   Google RETIRÓ los modelos gemini-1.5-* y gemini-2.0-flash. Llamarlos devuelve
 *   HTTP 404 con el mensaje "This model models/gemini-2.0-flash is no longer available".
 *   Verificado contra la API real: gemini-2.0-flash NO aparece en ListModels.
 *   El 404 provenía del modelo retirado, no de una URL mal construida.
 */

export const MODELO_POR_DEFECTO = "gemini-3.8-flash";

/** Todos existen hoy en v1beta. La cadena cubre los 503 intermitentes de Google. */
const MODELOS_FALLBACK = [
  MODELO_POR_DEFECTO,
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite"
];

const BASE = "https://generativelanguage.googleapis.com";
const VERSION_PREFERIDA = "v1beta";
const VERSIONES = [VERSION_PREFERIDA, "v1"];
const API_VERSIONES_VALIDAS = new Set(VERSIONES);
const MODELOS_RETIRODOS = new Set([
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro"
]);

const REINTENTOS_503 = 2;
const ESPERA_BASE_MS = 700;
const MAX_NOTAS = 5000;
const MAX_BASE64 = 4_000_000;
const MAX_CUERPO_JSON = 3_500_000;

/**
 * Construye la URL de la API. Exportada y testeada: es el punto donde un error
 * de nombre de modelo o de ruta se manifiesta como HTTP 404.
 */
export function construirUrl({ model, apiVersion = VERSION_PREFERIDA, apiKey }) {
  if (!apiKey) throw new Error("Falta la GEMINI_API_KEY al construir la petición.");
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(model || "")) {
    throw new Error(`Nombre de modelo con formato inválido: ${model}`);
  }
  const version = API_VERSIONES_VALIDAS.has(apiVersion) ? apiVersion : VERSION_PREFERIDA;
  return `${BASE}/${version}/models/${model}:generateContent?key=${apiKey}`;
}

/** Ruta sin la llave, para logs y diagnóstico. */
export function construirUrlDiagnostica(model, apiVersion = VERSION_PREFERIDA) {
  return `${BASE}/${apiVersion}/models/${model}:generateContent?key=***REDACTADA***`;
}

export function apiKeyDelServidor() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

/** Cadena efectiva de modelos, respetando GEMINI_MODEL sin redeploy. */
export function cadenaDeModelos() {
  const override = (process.env.GEMINI_MODEL || "").trim();
  const base = override && !MODELOS_RETIRODOS.has(override) ? [override, ...MODELOS_FALLBACK] : MODELOS_FALLBACK;
  return [...new Set(base)];
}

export function normalizarModelo(modelId) {
  // El cliente nunca puede forzar un modelo retirado: cae al inicio de la cadena.
  if (!modelId || MODELOS_RETIRODOS.has(modelId)) return cadenaDeModelos()[0];
  return modelId;
}

function mensajeDeGoogle(cuerpoTexto) {
  try {
    const json = JSON.parse(cuerpoTexto);
    return json?.error?.message || cuerpoTexto.slice(0, 200);
  } catch {
    return cuerpoTexto.slice(0, 200);
  }
}

function descError({ status, mensaje }) {
  if (/no longer available|is not found|not found for API version/i.test(mensaje)) {
    return `404 · Modelo retirado o inexistente: ${mensaje}`;
  }
  if (/API_KEY_INVALID|API key not valid|API_KEY_INVALID/i.test(mensaje)) {
    return "GEMINI_API_KEY inválida. Revisa la variable de entorno en Vercel y vuelve a desplegar.";
  }
  if (/PERMISSION_DENIED|permission/i.test(mensaje)) {
    return "403 · La GEMINI_API_KEY no tiene acceso a este modelo.";
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(mensaje)) {
    return "429 · Cuota de Gemini agotada. Espera unos segundos e intenta de nuevo.";
  }
  if (status === 503 || /high demand|overloaded|UNAVAILABLE/i.test(mensaje)) {
    return `503 · El modelo está sobrecargado ahora mismo (${mensaje}).`;
  }
  if (status === 400) return `400 · La API de Gemini rechazó la petición: ${mensaje}`;
  if (status >= 500) return `${status} · Error del servidor de Google. Reintenta en un momento.`;
  return mensaje;
}

/**
 * Llama a generateContent recorriendo la cadena de modelos y versiones.
 * - 404 (modelo retirado) -> salta al siguiente modelo
 * - 503 (sobrecarga)      -> reintenta con backoff y luego salta
 * - 401/403/429           -> aborta (no es cosa del modelo)
 */
async function llamarGemini({ apiKey, contents, config, modelos }) {
  let ultimo = { status: 502, mensaje: "Sin intentos." };

  for (const model of modelos) {
    for (const apiVersion of VERSIONES) {
      const url = construirUrl({ model, apiVersion, apiKey });

      for (let intento = 1; intento <= REINTENTOS_503; intento++) {
        let res;
        let texto = "";
        try {
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents, generationConfig: config })
          });
          texto = await res.text();
        } catch (err) {
          ultimo = { status: 502, mensaje: `Fallo de red: ${err?.message || err}` };
          await dormir(ESPERA_BASE_MS * intento);
          continue;
        }

        if (res.ok) {
          let json;
          try {
            json = JSON.parse(texto);
          } catch {
            ultimo = { status: 502, mensaje: "Respuesta no interpretable de la API de Gemini." };
            break;
          }
          const respuesta = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
          if (respuesta.trim()) {
            return { texto: respuesta, model: model, apiVersion };
          }
          ultimo = { status: 502, mensaje: "La API de Gemini devolvió una respuesta vacía." };
          break;
        }

        const mensaje = mensajeDeGoogle(texto);
        ultimo = { status: res.status, mensaje };

        if (res.status === 404) break; // modelo/versión inválida: siguiente candidato
        if (res.status === 503 || res.status === 429) {
          if (intento < REINTENTOS_503) {
            await dormir(ESPERA_BASE_MS * intento * 2);
            continue;
          }
          break; // sobrecarga persistente: siguiente modelo
        }
        break; // 400/401/403 u otro: no adianta cambiar de modelo
      }
    }
  }

  // Un problema de configuracion del servidor no debe parecer un error del cliente.
  const esConfiguracion =
    /GEMINI_API_KEY inválida|403 ·|Fallo de red|no tiene acceso/i.test(descError(ultimo));
  const error = new Error(descError(ultimo));
  error.status = esConfiguracion ? 502 : ultimo.status === 404 ? 502 : ultimo.status;
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

const MIME_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);

function normalizarMime(mimeType) {
  const m = String(mimeType || "").toLowerCase().trim();
  if (!MIME_PERMITIDOS.has(m)) return "image/png";
  return m === "image/jpg" ? "image/jpeg" : m;
}

function exigirLlave() {
  const apiKey = apiKeyDelServidor();
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY no está configurada en el servidor Vercel. Agrégala en Settings → Environment Variables y vuelve a desplegar."
    );
    err.status = 503;
    throw err;
  }
  return apiKey;
}

/**
 * Cadena de modelos a intentar. Si el cliente pide uno explícito y no está
 * retirado, se prueba primero; después se recorre la cadena de respaldo.
 */
function construirIntentos(modelName) {
  const base = cadenaDeModelos();
  const elegido = normalizarModelo(modelName);
  return [...new Set([elegido, ...base])];
}

export async function accionExtraer({ imagenBase64, mimeType, textoNotas, modelName }) {
  const apiKey = exigirLlave();
  const notas = String(textoNotas || "").slice(0, MAX_NOTAS);

  if (!imagenBase64 && !notas.trim()) {
    const err = new Error("Se requiere una imagen o notas técnicas para procesar.");
    err.status = 400;
    throw err;
  }
  if (imagenBase64 && String(imagenBase64).length > MAX_BASE64) {
    const err = new Error("La imagen supera el tamaño máximo permitido (4 MB).");
    err.status = 413;
    throw err;
  }

  const parts = [];
  if (imagenBase64) {
    parts.push({ inlineData: { mimeType: normalizarMime(mimeType), data: String(imagenBase64) } });
  }
  parts.push({ text: construirPrompt(notas) });

  const contents = [{ role: "user", parts }];
  if (JSON.stringify(contents).length > MAX_CUERPO_JSON) {
    const err = new Error("El contenido es demasiado grande para el motor de IA.");
    err.status = 413;
    throw err;
  }

  const { texto, model, apiVersion } = await llamarGemini({
    apiKey,
    contents,
    config: { temperature: 0.2, responseMimeType: "application/json" },
    modelos: construirIntentos(modelName)
  });

  const datos = parsearRespuesta(texto);
  return { datos: { ...datos, modelo_usado: model }, modeloUsado: model, apiVersion };
}

export async function accionTestear({ modelName }) {
  const apiKey = exigirLlave();

  const { texto, model, apiVersion } = await llamarGemini({
    apiKey,
    contents: [{ role: "user", parts: [{ text: "Responde únicamente con la palabra OK." }] }],
    config: { maxOutputTokens: 32 },
    modelos: construirIntentos(modelName)
  });

  return {
    mensaje: `Conexión exitosa con ${model} (API ${apiVersion}). Respuesta: ${texto.trim()}`,
    modeloUsado: model,
    apiVersion,
    url: construirUrlDiagnostica(model, apiVersion)
  };
}

/** Diagnóstico sin gastar cuota: ¿existe GEMINI_API_KEY y qué URL se usaría? */
export function estadoDelMotor() {
  const configurado = !!apiKeyDelServidor();
  const modelos = cadenaDeModelos();
  return {
    configurado,
    modelo: modelos[0],
    cadenaModelos: modelos,
    urlPrevista: construirUrlDiagnostica(modelos[0], VERSION_PREFERIDA),
    mensaje: configurado
      ? `GEMINI_API_KEY detectada. Se usará ${construirUrlDiagnostica(modelos[0], VERSION_PREFERIDA)}`
      : "GEMINI_API_KEY no está configurada en el servidor Vercel."
  };
}

/** Lista los modelos que la llave puede usar realmente (diagnóstico opcional). */
export async function listarModelosDisponibles() {
  const apiKey = apiKeyDelServidor();
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY no configurada." };
  try {
    const res = await fetch(`${BASE}/${VERSION_PREFERIDA}/models?pageSize=200&key=${apiKey}`);
    const json = await res.json();
    const disponibles = (json?.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""));
    return {
      ok: res.ok,
      disponibles,
      flashedUsables: disponibles.filter((m) => /flash/i.test(m) && !/tts|image|omni/i.test(m)),
      url: `${BASE}/${VERSION_PREFERIDA}/models?key=***REDACTADA***`
    };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}