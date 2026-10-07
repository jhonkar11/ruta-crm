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
const VERSIONES = [VERSION_PREFERIDA];
const API_VERSIONES_VALIDAS = new Set(VERSIONES);
const MODELOS_RETIRODOS = new Set([
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro"
]);

const REINTENTOS_503 = 1;
const ESPERA_BASE_MS = 300;
const MAX_NOTAS = 5000;
/**
 * La plantilla institucional del banco suele ser un texto largo, de múltiples
 * líneas y con variaciones de formato (tablas, viñetas, encabezados). Se admite
 * un volumen muy superior al de las notas del técnico para no truncar el
 * requerimiento original, que es la fuente de verdad del caso.
 */
const MAX_PLANTILLA_INSTITUCIONAL = 24_000;
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

/**
 * Normaliza un bloque de texto institucional para incrustarlo en el prompt de
 * forma segura: elimina delimitadores que romperían la estructura, colapsa el
 * espacio excessivo y conserva los saltos de línea (son requisito del mapeo).
 */
function envolverTextoInstitucional(texto) {
  return String(texto || "")
    .replace(/```/g, "'''")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]{4,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function construirPrompt(textoNotas = "", plantillaInstitucional = "") {
  const institucional = envolverTextoInstitucional(plantillaInstitucional);
  const hayInstitucional = institucional.length > 0;

  return `
Eres un Arquitecto de Soporte Técnico e IT empresarial de nivel mundial para mesas de ayuda (Mesa IBM, Redes, Hardware y Software).
Tu tarea es analizar minuciosamente la entrada provista (que puede ser una captura de pantalla de un chat técnico de WhatsApp, notas dictadas por el ingeniero de campo y la plantilla institucional pegada por el cliente) y extraer con máxima precisión los siguientes datos de servicio técnico y generar la información necesaria para la liquidación de la cuenta de cobro y la plantilla corporativa de soporte.

${
  hayInstitucional
    ? `FUENTE PRINCIPAL: PLANTILLA INSTITUCIONAL DEL CLIENTE
El bloque delimitado por <plantilla_institucional> es el requerimiento oficial tal como lo entrega el banco o la entidad (AV Villas, Banco Popular, Almaviva, Davivienda, etc.). Puede llegar con múltiples líneas, viñetas, encabezados, tablas copiadas de Excel o Word, abreviaturas y variaciones de formato.
Debes leerlo COMPLETO, de principio a fin, y mapear cada dato con exactitud. No resumas, no omitas secciones y no limites el alcance a las primeras líneas: las secciones aparecen con nombres distintos (p.ej. "N° de Caso", "Numero de requerimiento", "Ticket", "Radicado", "ID de la llamada") y todas apuntan al mismo campo.

Reglas de mapeo de la plantilla institucional:
- Si un valor aparece explícito, cópialo tal cual, sin reinterpretarlo ni "corregirlo".
- Si el texto es extenso o describe varios equipos, casos o actividades, consolídalos en descripciones completas y detalladas: nunca uses "varios", "los equipos" ni puntos suspensivos como sustituto de la información.
- Interpreta abreviaturas recurrentes del sector: SH/SO = Software, HW/HD = Hardware, SO = Sistema Operativo, REM = Remoto, SIT = Sitio, CC = Copia.
- Si un campo no aparece en la plantilla institucional, recurre a la imagen y a las notas del técnico antes de aplicar un valor por defecto.
- Las fechas pueden venir como "2026-09-23", "23/09/2026", "23 de septiembre de 2026" o "23-Sep-26": conviértelas SIEMPRE a DD/MM/AAAA.`
    : `No se pegó plantilla institucional: extrae los datos exclusivamente de la imagen y de las notas del técnico.`
}

DATOS A EXTRAER Y SU SIGNIFICADO:
1. numero_caso: Código de caso, requerimiento, ticket o ID (ej: "RE26014844 / RF637620" o "2303375").
2. fecha_solicitud: Fecha de asignación o solicitud (formato DD/MM/AAAA). Si no está explícita, usa la fecha de atención o la fecha actual.
3. fecha_atencion: Fecha en que se atendió el servicio (formato DD/MM/AAAA).
4. fecha_finalizacion: Fecha de entrega/cierre del servicio (formato DD/MM/AAAA).
5. mesa: Nombre de la mesa de soporte o tipo de servicio (ej: "Mesa IBM", "Mesa 2", "Soporte en Sitio").
6. proveedor: Nombre del proveedor o entidad corporativa contratante/intermediaria (ej: "Cencosud", "Grupo Aval", "R&S Soluciones", "IBM Colombia"). Si se menciona o se deduce por el contexto (ej: Jumbo corresponde a Cencosud, AV Villas a Grupo Aval), indícalo; si no, déjalo vacío ("").
7. cliente: Nombre del cliente o entidad bancaria final (ej: "Banco Popular", "Davivienda", "Banco AV Villas", "Jumbo Popayán").
8. coordinador: Nombre del coordinador o supervisor de servicio (ej: "Oswaldo", etc.). Si no aparece, coloca "Oswaldo".
8. valor_servicios: Valor numérico en pesos colombianos acordado o estimado (ej: 70000, 150000, 200000). Si no aparece, estima un valor base estándar según complejidad (ej: 70000). Devuelve sólo el número, sin "$", sin puntos ni comas.
9. valor_viaticos: Valor numérico de viáticos si aplica (normalmente 0). Sólo el número.
10. valor_materiales: Valor numérico de repuestos o materiales (normalmente 0). Sólo el número.
11. sh: Tipo de intervención: "SOFTWARE - HARDWARE", "SOFTWARE" o "HARDWARE".
12. tecnico: Nombre del técnico de campo responsable (ej: "Jhon Alexander Vasquez Reveló" o "JHON ALEXANDER").
13. medio: Medio de atención ("SITIO" o "REMOTO").
14. equipo: Nombre del equipo, serial o hostname corporativo (ej: "W005290ADM15 MJOG6EFA"). Si la plantilla lista varios, separa los identificadores legibles por coma.
15. falla: Resumen conciso de la falla o requerimiento (ej: "ACTUALIZACION SISTEMA OPERATIVO").
16. causa: Diagnóstico técnico de la causa raíz, redactado en frases completas.
17. solucion: Descripción detallada y minuciosa de TODAS las actividades ejecutadas en sitio y/o en coordinación remota, en el orden en que se realizaron.
18. pruebas: Descripción de las pruebas de validación con el usuario final que certifican el equipo operativo.
19. horas: Objeto con { "desplazamiento": "10:00 am", "inicio": "11:00 am", "fin": "4:00 pm" }.
20. plantilla_completa: Texto formateado exactamente como la plantilla oficial corporativa para WhatsApp.

PLANTILLA CORPORATIVA OFICIAL (campo plantilla_completa):
Es el entregable principal y debe quedar COMPLETO, EXACTO Y DETALLADO para WhatsApp/Mesas de ayuda IT.
${
  hayInstitucional
    ? `- CASO MOLDE INSTITUCIONAL ESTRICTO (campo 'plantilla_completa'):
  * El usuario proporcionó una estructura o plantilla en blanco en <plantilla_institucional>.
  * DEBES USAR ESA PLANTILLA EXACTAMENTE COMO UN MOLDE O ESQUEMA ESTRICTO.
  * Vacía todos los datos extraídos (de la captura OCR o del detalle del servicio) en ella, limpiándola de imperfecciones o campos huérfanos.
  * Respeta al 100% sus títulos, orden, saltos de línea y etiquetas originales (variables $$Variable, dos puntos, viñetas, etc.), completando cada valor de forma impecable.`
    : `- CASO FORMATO ESTÁNDAR CORPORATIVO ENTER LTDA (campo 'plantilla_completa'):
  * No se adjuntó plantilla institucional en blanco.
  * Debes organizar, formatear y estructurar directamente los datos extraídos (ya sea de la captura de pantalla OCR o del Detalle del Servicio técnico) en la Plantilla Corporativa Oficial para WhatsApp, con el siguiente formato limpio y profesional:
*REPORTE DE SOPORTE TÉCNICO EN SITIO*
N° Caso: [numero_caso]
Fecha: [fecha_atencion o fecha_solicitud]
Proveedor: [proveedor o entidad]
Cliente: [cliente]
Mesa: [mesa] | Coordinador: [coordinador]
Equipo / Serial: [equipo]
Medio: [medio] | Tipo: [sh]
Falla Reportada: [falla]
Diagnóstico / Causa: [causa]
Solución Técnica: [solucion]
Pruebas Realizadas: [pruebas]
Horario: [horas.inicio - horas.fin]
Estado: CERRADO Y ENTREGADO A CONFORMIDAD
Técnico: [tecnico]

Asegúrate de llenar cada corchete con los datos reales obtenidos sin dejar corchetes vacíos.`
}
- No uses corchetes vacíos, guiones innecesarios ni marcadores pendientes como [pendiente] o "N/A" cuando la información exista o pueda ser resuelta técnicamente.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin bloques de markdown adicionales (sin \`\`\`json ni \`\`\`), con los campos especificados.
${textoNotas ? `\nNOTAS ADICIONALES DEL TÉCNICO:\n<notas_tecnico>\n${envolverTextoInstitucional(textoNotas)}\n</notas_tecnico>` : ""}
${hayInstitucional ? `\n<plantilla_institucional>\n${institucional}\n</plantilla_institucional>` : ""}
`.trim();
}

/**
 * Prompt exclusivo para regenerar la Plantilla Corporativa Oficial a partir del
 * texto institucional en bruto. Se usa cuando el técnico edita la plantilla y
 * vuelve a pulsar "Generar plantilla", sin reprocesar la captura.
 */
export function construirPromptSoloPlantilla(plantillaInstitucional = "", notas = "", datosBase = {}) {
  const institucional = envolverTextoInstitucional(plantillaInstitucional);
  const contexto = {
    numero_caso: datosBase.numero_caso || "",
    fecha_solicitud: datosBase.fecha_solicitud || "",
    fecha_atencion: datosBase.fecha_atencion || "",
    fecha_finalizacion: datosBase.fecha_finalizacion || "",
    mesa: datosBase.mesa || "",
    proveedor: datosBase.proveedor || "",
    cliente: datosBase.cliente || "",
    coordinador: datosBase.coordinador || "",
    valor_servicios: datosBase.valor_servicios || 0,
    valor_viaticos: datosBase.valor_viaticos || 0,
    valor_materiales: datosBase.valor_materiales || 0,
    sh: datosBase.sh || "",
    tecnico: datosBase.tecnico || "",
    medio: datosBase.medio || "",
    equipo: datosBase.equipo || "",
    falla: datosBase.falla || "",
    causa: datosBase.causa || "",
    solucion: datosBase.solucion || "",
    pruebas: datosBase.pruebas || "",
    horas: datosBase.horas || {}
  };

  const hayInstitucional = institucional.length > 0;

  return `
Eres un Mapeador Inteligente de Datos IT de ENTER Ltda.
Tu tarea es tomar la plantilla provista en <plantilla_institucional> exactamente como un MOLDE O ESPEJO y rellenar dinámicamente sus campos.

${
  hayInstitucional
    ? `DIRECTRICES TÉCNICAS ESTRICTAS (COMPORTAMIENTO TIPO ESPEJO):
1. TOMA LA PLANTILLA DE ENTRADA COMO MOLDE / ESPEJO:
   - El usuario ingresó la plantilla en <plantilla_institucional> en bruto (sin importar banco, entidad, longitud, líneas, etiquetas libres o variables del tipo $$Variable).
   - Respeta al 100% su estructura, saltos de línea, títulos, orden y diseño original.
   - NO alteres la forma ni inventes campos que no correspondan a la plantilla provista por el usuario. Actúa puramente como un mapeador de datos sobre el formato de entrada.
2. AUTOLLENADO INTELIGENTE CON CONTEXTO:
   - Utilizando la información del servicio en <datos_ya_capturados> y las notas/detalle del técnico en <notas_tecnico>, rellena o mapea dinámicamente cada uno de los campos o variables requeridos dentro de esa misma estructura exacta.
   - Encuentra y redacta la solución técnica más precisa al caso según el requerimiento.
3. FORMATO DE SALIDA:
   - Devuelve ÚNICAMENTE el texto resultante completado, respetando los saltos de línea originales.
   - SIN bloques de markdown (\`\`\` o \`\`\`text), SIN saludos, SIN introducciones y SIN explicaciones.`
    : `No se ingresó plantilla institucional de entrada. Devuelve únicamente una cadena vacía ("").`
}

<datos_ya_capturados>
${envolverTextoInstitucional(JSON.stringify(contexto, null, 2))}
</datos_ya_capturados>
${notas ? `<notas_tecnico>\n${envolverTextoInstitucional(notas)}\n</notas_tecnico>` : ""}
${hayInstitucional ? `<plantilla_institucional>\n${institucional}\n</plantilla_institucional>` : ""}
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

export async function accionExtraer({ imagenBase64, mimeType, textoNotas, plantillaInstitucional, modelName }) {
  const apiKey = exigirLlave();
  const notas = String(textoNotas || "").slice(0, MAX_NOTAS);
  const institucional = String(plantillaInstitucional || "").slice(0, MAX_PLANTILLA_INSTITUCIONAL);

  if (!imagenBase64 && !notas.trim() && !institucional.trim()) {
    const err = new Error(
      "Se requiere una imagen, notas técnicas o la plantilla institucional del cliente para procesar."
    );
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
  parts.push({ text: construirPrompt(notas, institucional) });

  const contents = [{ role: "user", parts }];
  if (JSON.stringify(contents).length > MAX_CUERPO_JSON) {
    const err = new Error("El contenido es demasiado grande para el motor de IA.");
    err.status = 413;
    throw err;
  }

  const { texto, model, apiVersion } = await llamarGemini({
    apiKey,
    contents,
    // Salida generosa: la plantilla institucional extensa produce una
    // plantilla_completa larga y no debe truncarse a mitad de frase.
    config: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 8192 },
    modelos: construirIntentos(modelName)
  });

  const datos = parsearRespuesta(texto);
  return { datos: { ...datos, modelo_usado: model }, modeloUsado: model, apiVersion };
}

/**
 * Regenera únicamente la Plantilla Corporativa Oficial desde el texto
 * institucional en bruto. Devuelve texto plano, no JSON, para no forzar al
 * modelo a escapar saltos de línea dentro de una cadena.
 */
export async function accionGenerarPlantilla({ plantillaInstitucional, textoNotas, datos, modelName }) {
  const apiKey = exigirLlave();
  const institucional = String(plantillaInstitucional || "").slice(0, MAX_PLANTILLA_INSTITUCIONAL);
  const notas = String(textoNotas || "").slice(0, MAX_NOTAS);

  if (!institucional.trim() && !notas.trim()) {
    const err = new Error("Pega la plantilla institucional o escribe notas para generar la plantilla.");
    err.status = 400;
    throw err;
  }

  const contents = [
    {
      role: "user",
      parts: [{ text: construirPromptSoloPlantilla(institucional, notas, datos || {}) }]
    }
  ];
  if (JSON.stringify(contents).length > MAX_CUERPO_JSON) {
    const err = new Error("El contenido es demasiado grande para el motor de IA.");
    err.status = 413;
    throw err;
  }

  const { texto, model, apiVersion } = await llamarGemini({
    apiKey,
    contents,
    config: { temperature: 0.15, maxOutputTokens: 8192 },
    modelos: construirIntentos(modelName)
  });

  const plantilla = limpiarPlantilla(texto);
  if (!plantilla) {
    const err = new Error("El motor de IA devolvió una plantilla vacía.");
    err.status = 502;
    throw err;
  }
  return { plantilla, modeloUsado: model, apiVersion };
}

/** Quita vallas de código y espacios finales, conservando los saltos de línea. */
function limpiarPlantilla(texto) {
  return String(texto || "")
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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