import { GoogleGenAI } from "@google/genai";

/**
 * Modelo único y estable soportado.
 * Los modelos gemini-1.5-* fueron RETIRADOS por Google y devuelven HTTP 404
 * en /v1beta/models/{modelo}:generateContent. No volver a referenciarlos.
 */
export const MODELO_GEMINI_POR_DEFECTO = "gemini-2.0-flash";

// Versiones de API probadas en orden. "v1" es la GA estable; "v1beta" queda como red de seguridad.
export const GEMINI_API_VERSIONS = ["v1", "v1beta"];

// Configuración de Modelos Disponibles (solo modelos activos y estables sin errores 404)
export const MODELOS_GEMINI = [
  { id: MODELO_GEMINI_POR_DEFECTO, nombre: "Gemini 2.0 Flash", descripcion: "Alta velocidad, precisión OCR y estabilidad", recomendado: true }
];

const MODELOS_PERMITIDOS = new Set(MODELOS_GEMINI.map((m) => m.id));

/**
 * Normaliza cualquier modelo recibido: si no está en la lista blanca se cae
 * a gemini-2.0-flash para no volver a pedir un modelo retirado (404).
 */
export function normalizarModeloGemini(modelId) {
  return MODELOS_PERMITIDOS.has(modelId) ? modelId : MODELO_GEMINI_POR_DEFECTO;
}

/**
 * Instancia el SDK actual (@google/genai) fijando explícitamente la versión de API.
 * Ya no se usa @google/generative-ai (SDK deprecado que sólo expone la ruta v1beta).
 */
export function crearClienteGemini(apiKey, apiVersion = GEMINI_API_VERSIONS[0]) {
  return new GoogleGenAI({ apiKey, apiVersion });
}

const LOCAL_STORAGE_KEYS = ["gemini_api_key", "CRM_GEMINI_API_KEY", "VITE_GEMINI_API_KEY"];

/**
 * Obtiene la API Key activa buscando en localStorage ('gemini_api_key', 'CRM_GEMINI_API_KEY') y en variables de entorno VITE.
 */
export function getGeminiApiKey() {
  if (typeof window !== "undefined") {
    for (const k of LOCAL_STORAGE_KEYS) {
      const val = localStorage.getItem(k);
      if (val && val.trim()) return val.trim();
    }
  }
  const envKey = (
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    import.meta.env.VITE_GOOGLE_API_KEY ||
    import.meta.env.GOOGLE_API_KEY ||
    ""
  ).trim();
  return envKey;
}

/**
 * Guarda una API Key personalizada de forma persistente en localStorage.
 */
export function setGeminiApiKey(key) {
  if (typeof window !== "undefined") {
    const trimmed = (key || "").trim();
    if (trimmed) {
      localStorage.setItem("gemini_api_key", trimmed);
      localStorage.setItem("CRM_GEMINI_API_KEY", trimmed);
    } else {
      for (const k of LOCAL_STORAGE_KEYS) {
        localStorage.removeItem(k);
      }
    }
  }
}

/**
 * Traduce un error de la API a un mensaje accionable en español.
 */
function descErrorGemini(err) {
  const status = err?.status ?? err?.code ?? err?.response?.status;
  const msg = err?.message || String(err);
  if (status === 404 || /not found/i.test(msg)) {
    return `404 · Modelo o endpoint no encontrado. Revisa que el modelo sea "${MODELO_GEMINI_POR_DEFECTO}" y que la API Key tenga acceso a la API Gemini.`;
  }
  if (status === 400) return `400 · Solicitud rechazada por la API: ${msg}`;
  if (status === 401 || status === 403) return `${status} · API Key inválida o sin permisos: ${msg}`;
  if (status === 429) return `429 · Límite de cuota alcanzado. Espera unos segundos e intenta de nuevo.`;
  if (status >= 500) return `${status} · Error del servidor de Google. Reintenta en un momento.`;
  return msg;
}

/**
 * Ejecuta generateContent con reintentos: primero en "v1" (GA) y, si la API
 * respondiera 404, cae a "v1beta". Así el botón nunca muere por la ruta del endpoint.
 */
async function generateContent({ apiKey, model, contents, config }) {
  let lastError = null;

  for (const apiVersion of GEMINI_API_VERSIONS) {
    try {
      const ai = crearClienteGemini(apiKey, apiVersion);
      const response = await ai.models.generateContent({ model, contents, config });
      const text = response?.text;
      if (typeof text === "string" && text.trim()) return text;
      lastError = new Error("La API de Gemini devolvió una respuesta vacía.");
    } catch (err) {
      lastError = err;
      const status = err?.status ?? err?.code;
      if (status !== 404) break; // si no es 404 no tiene sentido cambiar de versión
    }
  }

  throw new Error(descErrorGemini(lastError));
}

/**
 * Diagnóstico y verificación en vivo de la API Key.
 */
export async function testGeminiApiKey(apiKey, modelName = MODELO_GEMINI_POR_DEFECTO) {
  const key = apiKey || getGeminiApiKey();
  if (!key) {
    return { ok: false, message: "No se ha configurado ninguna API Key de Gemini." };
  }

  const model = normalizarModeloGemini(modelName);

  try {
    const text = await generateContent({
      apiKey: key,
      model,
      contents: "Hola, responde únicamente con la palabra OK si estás activo.",
      config: { maxOutputTokens: 32 }
    });
    return { ok: true, message: `Conexión exitosa con ${model} (API v1). Respuesta: ${text.trim()}` };
  } catch (err) {
    return { ok: false, message: `Error probando API Key: ${descErrorGemini(err)}` };
  }
}

/**
 * Extrae datos estructurados de servicio a partir de una captura de pantalla (OCR) o notas de texto/voz.
 * @param {object} params
 * @param {string} [params.imagenBase64] - Imagen en base64 pura (sin data:image/...;base64,)
 * @param {string} [params.mimeType] - MimeType de la imagen (ej: 'image/png' o 'image/jpeg')
 * @param {string} [params.textoNotas] - Notas dictadas o escritas por el técnico
 * @param {string} [params.modelId] - Modelo a usar
 */
export async function extraerDatosDeServicio({ imagenBase64, mimeType = "image/png", textoNotas = "", modelId = MODELO_GEMINI_POR_DEFECTO }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No hay una API Key de Gemini configurada. Por favor ingrésala en la configuración superior.");
  }

  const prompt = `
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
`;

  // Lista blanca estricta: cualquier modelo desconocido (p.ej. gemini-1.5-*) cae en gemini-2.0-flash.
  const modeloSolicitado = normalizarModeloGemini(modelId);
  const uniqueModels = [modeloSolicitado];

  const contents = [];
  if (imagenBase64) {
    contents.push({
      inlineData: {
        data: imagenBase64,
        mimeType: mimeType || "image/png"
      }
    });
  }
  contents.push({ text: prompt });

  let lastError = null;

  for (const modelToTry of uniqueModels) {
    try {
      const textResult = await generateContent({
        apiKey,
        model: modelToTry,
        contents,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      // Limpiar y parsear JSON (el modelo puede envolverlo en ```json)
      const jsonStr = textResult
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      let parsedData;
      try {
        parsedData = JSON.parse(jsonStr);
      } catch {
        const primerObjeto = jsonStr.slice(jsonStr.indexOf("{"), jsonStr.lastIndexOf("}") + 1);
        parsedData = JSON.parse(primerObjeto);
      }

      return {
        ...parsedData,
        modelo_usado: modelToTry
      };
    } catch (err) {
      console.warn(`Fallo con el modelo ${modelToTry}:`, err?.message);
      lastError = err;
    }
  }

  throw new Error(`Error en el motor IA Multimodal: ${descErrorGemini(lastError)}`);
}

/**
 * Genera la cadena de texto con la estructura de la Plantilla Corporativa Oficial para WhatsApp.
 */
export function generarPlantillaSolucion(datos) {
  const cliente = datos?.cliente || "Entidad";
  const numCaso = datos?.numero_caso || "";
  const sh = datos?.sh || "SOFTWARE - HARDWARE";
  const tecnicoCorto = (datos?.tecnico || "JHON ALEXANDER").split(" ")[0]?.toUpperCase() + (datos?.tecnico?.split(" ")[1] ? " " + datos?.tecnico?.split(" ")[1]?.toUpperCase() : "");
  const medio = datos?.medio || "SITIO";
  const equipo = datos?.equipo || "No especificado";
  const falla = (datos?.falla || "Mantenimiento / Soporte Técnico").toUpperCase();
  const causa = datos?.causa || "Desgaste preventivo o requerimiento operativo de usuario.";
  const solucion = datos?.solucion || "Se realiza asistencia técnica en sitio dejando el servicio operativo.";
  const pruebas = datos?.pruebas || "Usuario valida operatividad y funcionamiento correcto de los aplicativos.";
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
