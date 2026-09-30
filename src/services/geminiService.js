import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración de Modelos Disponibles (solo modelos activos y sin errores 404)
export const MODELOS_GEMINI = [
  { id: "gemini-2.5-flash-preview-05-20", nombre: "Gemini 2.5 Flash ★", descripcion: "Ultrarrápido y multimodal de última generación", recomendado: true },
  { id: "gemini-2.0-flash", nombre: "Gemini 2.0 Flash", descripcion: "Alta velocidad y excelente precisión OCR", recomendado: false },
  { id: "gemini-1.5-flash", nombre: "Gemini 1.5 Flash", descripcion: "Modelo balanceado y máxima estabilidad", recomendado: false },
];

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
 * Diagnóstico y verificación en vivo de la API Key.
 */
export async function testGeminiApiKey(apiKey, modelName = "gemini-2.0-flash") {
  const key = apiKey || getGeminiApiKey();
  if (!key) {
    return { ok: false, message: "No se ha configurado ninguna API Key de Gemini." };
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hola, responde únicamente con la palabra OK si estás activo.");
    const response = await result.response;
    const text = response.text();
    return { ok: true, message: `Conexión exitosa con ${modelName}! Respuesta: ${text.trim()}` };
  } catch (err) {
    // Si falla el modelo solicitado, probar con gemini-2.0-flash como fallback seguro
    if (modelName !== "gemini-2.0-flash") {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const fallback = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const res2 = await fallback.generateContent("Test OK");
        const resp2 = await res2.response;
        return {
          ok: true,
          message: `Conectado exitosamente usando gemini-2.0-flash. Respuesta: ${resp2.text().trim()}`,
          fallbackUsed: "gemini-2.0-flash"
        };
      } catch (innerErr) {
        return { ok: false, message: `Error probando API Key: ${innerErr.message || err.message}` };
      }
    }
    return { ok: false, message: `Error probando API Key: ${err.message}` };
  }
}

/**
 * Instancia el cliente de Google Generative AI con tolerancia a fallos y fallback de modelos.
 */
function getGenerativeModelWithFallback(apiKey, requestedModel = "gemini-2.0-flash") {
  const genAI = new GoogleGenerativeAI(apiKey);
  return { genAI, modelName: requestedModel };
}

/**
 * Extrae datos estructurados de servicio a partir de una captura de pantalla (OCR) o notas de texto/voz.
 * @param {object} params
 * @param {string} [params.imagenBase64] - Imagen en base64 pura (sin data:image/...;base64,)
 * @param {string} [params.mimeType] - MimeType de la imagen (ej: 'image/png' o 'image/jpeg')
 * @param {string} [params.textoNotas] - Notas dictadas o escritas por el técnico
 * @param {string} [params.modelId] - Modelo a usar
 */
export async function extraerDatosDeServicio({ imagenBase64, mimeType = "image/png", textoNotas = "", modelId = "gemini-2.0-flash" }) {
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

  const fallbackChain = [modelId, "gemini-2.0-flash", "gemini-2.5-flash-preview-05-20", "gemini-1.5-flash"];
  const uniqueModels = [...new Set(fallbackChain)];

  let lastError = null;

  for (const modelToTry of uniqueModels) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelToTry,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const contents = [];
      if (imagenBase64) {
        contents.push({
          inlineData: {
            data: imagenBase64,
            mimeType: mimeType || "image/png",
          },
        });
      }
      contents.push(prompt);

      const result = await model.generateContent(contents);
      const response = await result.response;
      const textResult = response.text();

      // Limpiar y parsear JSON
      const jsonStr = textResult.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsedData = JSON.parse(jsonStr);

      return {
        ...parsedData,
        modelo_usado: modelToTry
      };
    } catch (err) {
      console.warn(`Fallo con el modelo ${modelToTry}:`, err.message);
      lastError = err;
      // Probar siguiente modelo en la cadena de fallback
    }
  }

  throw new Error(`Error en el motor IA Multimodal: ${lastError?.message || "No se pudo procesar la solicitud"}`);
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
