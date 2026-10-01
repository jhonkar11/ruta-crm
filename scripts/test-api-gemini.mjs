import crypto from "node:crypto";
import { manejarPeticion } from "../api/_lib/handler.js";
import {
  construirUrl,
  construirUrlDiagnostica,
  construirPrompt,
  construirPromptSoloPlantilla,
  MODELO_POR_DEFECTO,
  normalizarModelo,
  cadenaDeModelos
} from "../api/_lib/gemini.js";
import { normalizarMoneda, normalizarFecha, celdaTexto, EMPRESA } from "../src/utils/excelNormalizadores.js";

const URL_OFICIAL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SECRET = "test-secret-supabase-jwt-para-pruebas";
const OTRO = "jhonka001@gmail.com";
const AJENO = "intruso@ejemplo.com";

// --- Fábrica de JWT HS256 ---
function firmar(payload, secret) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 });
  const firma = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${firma}`;
}

const tokenAdmin = firmar({ email: OTRO, role: "authenticated" }, SECRET);
const tokenAjeno = firmar({ email: AJENO, role: "authenticated" }, SECRET);
const tokenFalsificado = tokenAdmin.split(".").slice(0, 2).join(".") + ".firmaInventada";
const tokenExpirado = (() => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ email: OTRO, exp: Math.floor(Date.now() / 1000) - 10 });
  const firma = crypto.createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${firma}`;
})();

process.env.SUPABASE_JWT_SECRET = SECRET;
process.env.SOPORTE_ADMIN_EMAIL = OTRO;

const hdr = (t) => ({ authorization: `Bearer ${t}` });

let fallos = 0;
async function caso(nombre, entrada, esperadoStatus, verificar) {
  const r = await manejarPeticion(entrada);
  const ok = r.status === esperadoStatus;
  if (!ok) fallos++;
  const extra = verificar ? ` | ${verificar(r)}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${nombre}\n      -> ${r.status} ${extra || JSON.stringify(r.body).slice(0, 120)}`);
  return r;
}

console.log("\n=== 1. Sonda de salud (GET, sin auth) ===");
await caso("GET devuelve ok sin exigir sesión", { method: "GET" }, 200, (r) => `modelo=${r.body.modeloPorDefecto}`);

console.log("\n=== 2. RBAC estricto (antes: pasar sin header) ===");
await caso("POST sin token -> 401", { method: "POST", body: { accion: "estado" } }, 401);
await caso("POST token vacío -> 401", { method: "POST", headers: { authorization: "Bearer " }, body: { accion: "estado" } }, 401);
await caso("POST firma falsificada -> 401", { method: "POST", headers: hdr(tokenFalsificado), body: { accion: "estado" } }, 401);
await caso("POST token expirado -> 401", { method: "POST", headers: hdr(tokenExpirado), body: { accion: "estado" } }, 401);
await caso("POST correo no autorizado -> 403", { method: "POST", headers: hdr(tokenAjeno), body: { accion: "estado" } }, 403, (r) => r.body.error);
await caso("POST admin -> 200 estado", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "estado" } }, 200, (r) => `configurado=${r.body.configurado}`);

console.log("\n=== 3. Método no permitido ===");
await caso("PUT -> 405", { method: "PUT", headers: hdr(tokenAdmin), body: {} }, 405);

console.log("\n=== 4. Lista blanca de modelos (no 404 por modelo retirado) ===");
for (const malo of ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-flash", "../../etc/passwd", ""]) {
  const r = await manejarPeticion({
    method: "POST",
    headers: hdr(tokenAdmin),
    body: { accion: "testear", modelName: malo }
  });
  const usado = r.body.modeloUsado || (r.body.error || "").slice(0, 40);
  // Nunca debe devolver 404 (modelo retirado) ni el identificador retirado.
  const ok = usado === MODELO_POR_DEFECTO || String(usado).includes("GEMINI_API_KEY") || r.status === 503;
  const sin404 = r.status !== 404;
  if (!ok || !sin404) fallos++;
  console.log(`${ok && sin404 ? "PASS" : "FAIL"}  modelName="${malo}" -> normalizado: ${usado}`);
}

console.log("\n=== 5. Sin GEMINI_API_KEY en el servidor -> 503 con mensaje claro ===");
delete process.env.GEMINI_API_KEY;
await caso("testear sin llave -> 503", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "testear" } }, 503, (r) => r.body.error.slice(0, 90));
await caso("extraer sin llave -> 503", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "extraer", textoNotas: "hola" } }, 503);

console.log("\n=== 6. Validación de entrada ===");
process.env.GEMINI_API_KEY = "clave-falsa-para-probar-el-camino-de-error";
await caso("extraer sin imagen ni notas -> 400", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "extraer" } }, 400);
await caso("extraer con notas vacías -> 400", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "extraer", textoNotas: "   " } }, 400);
await caso("imagen mayor a 4MB -> 413", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "extraer", imagenBase64: "A".repeat(4_100_000) } }, 413);

console.log("\n=== 7. Llamada real a Google con llave inválida -> error mapeado, sin filtrar la llave ===");
const r7 = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAdmin),
  body: { accion: "extraer", textoNotas: "revision de equipo W005290ADM15" }
});
const texto = JSON.stringify(r7.body);
const noFuga = !texto.includes("clave-falsa-para-probar-el-camino-de-error");
if (!noFuga) fallos++;
console.log(`${r7.status >= 400 ? "PASS" : "FAIL"}  status=${r7.status}  error=${r7.body.error}`);
// El mensaje debe ser de la API de Google, nunca un error interno del servidor.
const noBugInterno = !/Assignment to constant|is not defined|Cannot read|undefined is not/i.test(r7.body.error || "");
if (!noBugInterno) fallos++;
console.log(`${noBugInterno ? "PASS" : "FAIL"}  el error viene de la API, no de un bug interno: ${noBugInterno}`);
console.log(`${noFuga ? "PASS" : "FAIL"}  la GEMINI_API_KEY NO aparece en la respuesta: ${noFuga}`);

console.log("\n=== 8. Rate limit (30/min por IP) ===");
let permitido = 0, bloqueado = 0;
for (let i = 0; i < 35; i++) {
  const r = await manejarPeticion({ method: "POST", headers: { ...hdr(tokenAdmin), "x-forwarded-for": "1.2.3.4" }, body: { accion: "estado" } });
  if (r.status === 429) bloqueado++; else permitido++;
}
const okRl = bloqueado > 0;
if (!okRl) fallos++;
console.log(`${okRl ? "PASS" : "FAIL"}  35 peticiones desde la misma IP -> ${permitido} permitidas, ${bloqueado} bloqueadas con 429`);

console.log("\n=== 9. Verificación con configuración ausente -> 503, nunca abierto ===");
delete process.env.SUPABASE_JWT_SECRET;
await caso("sin SUPABASE_JWT_SECRET ni URL -> 503", { method: "POST", headers: hdr(tokenAdmin), body: { accion: "estado" } }, 503, (r) => r.body.error.slice(0, 80));

/* ================================================================== */
console.log("\n=== 10. CORRECCION DE LA URL (causa raiz del 404) ===");

function afirmar(condicion, etiqueta) {
  if (!condicion) fallos++;
  console.log(`${condicion ? "PASS" : "FAIL"}  ${etiqueta}`);
}

process.env.SUPABASE_JWT_SECRET = SECRET;

afirmar(
  construirUrl({ model: "gemini-3.8-flash", apiKey: "K" }) ===
    `${URL_OFICIAL.replace("gemini-2.0-flash", "gemini-3.8-flash")}?key=K`,
  "La URL sigue exactamente el formato oficial: /v1beta/models/{modelo}:generateContent?key="
);
afirmar(
  construirUrl({ model: "gemini-3.8-flash", apiVersion: "v1beta", apiKey: "K" }).startsWith(
    "https://generativelanguage.googleapis.com/v1beta/models/"
  ),
  "Host y version v1beta correctos"
);
afirmar(
  construirUrl({ model: "gemini-3.8-flash", apiKey: "K" }).includes(":generateContent"),
  "Incluye la accion :generateContent (su ausencia es lo que produce 404)"
);
afirmar(
  construirUrlDiagnostica("gemini-3.8-flash") ===
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=***REDACTADA***",
  "La URL de diagnostico redacta la llave"
);
afirmar(!construirUrlDiagnostica("gemini-3.8-flash").match(/AIza|AQ\./), "No hay llave en la URL de diagnostico");
afirmar(cadenaDeModelos().every((m) => !/^gemini-(1\.5|2\.0|2\.5)-/.test(m)), "La cadena no incluye modelos retirados");
afirmar(normalizarModelo("gemini-2.0-flash") === MODELO_POR_DEFECTO, "gemini-2.0-flash se redirige al modelo vigente");
afirmar(normalizarModelo("gemini-1.5-pro") === MODELO_POR_DEFECTO, "gemini-1.5-pro se redirige al modelo vigente");
afirmar(normalizarModelo("gemini-3.7-flash") === "gemini-3.7-flash", "Un modelo vigente se respeta tal cual");
afirmar(
  MODELO_POR_DEFECTO !== "gemini-2.0-flash" && !/no longer available/.test(""),
  `El modelo por defecto NO es un modelo retirado (es ${MODELO_POR_DEFECTO})`
);
try {
  construirUrl({ model: "gemini-2.0-flash/../../admin", apiKey: "K" });
  afirmar(false, "Se rechaza un model con inyeccion de ruta");
} catch {
  afirmar(true, "Se rechaza un model con inyeccion de ruta");
}
afirmar(
  construirUrl({ model: "gemini-3.8-flash", apiVersion: "v1betaALGO", apiKey: "K" }).includes("/v1beta/"),
  "Una apiVersion desconocida cae a v1beta"
);

/* ================================================================== */
console.log("\n=== 11. Estado del motor reporta la URL que se usara ===");
const r11 = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAdmin),
  body: { accion: "estado" }
});
afirmar(
  typeof r11.body.urlPrevista === "string" &&
    r11.body.urlPrevista.includes("/v1beta/models/") &&
    r11.body.urlPrevista.includes(":generateContent"),
  `urlPrevista bien formada: ${r11.body.urlPrevista}`
);
afirmar(
  !JSON.stringify(r11.body).match(/AIza|AQ\.Ab/),
  "El estado del motor no filtra la llave"
);

/* ================================================================== */
/* ================================================================== */
console.log("\n=== 12. Plantilla institucional: límites y validación ===");
process.env.GEMINI_API_KEY = "clave-falsa-para-probar-el-camino-de-error";
const LIMITE_INSTITUCIONAL = 24000;

// Sin ninguna fuente de entrada -> 400 (las tres rutas siguen siendo obligatorias).
await caso(
  "extraer sin imagen, notas ni plantilla institucional -> 400",
  { method: "POST", headers: hdr(tokenAdmin), body: { accion: "extraer", textoNotas: "   ", plantillaInstitucional: "  " } },
  400
);

// La plantilla institucional por sí sola ya es una entrada válida: no debe exigir imagen.
const r12a = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAdmin),
  body: { accion: "extraer", plantillaInstitucional: "N° de Caso: RE26014844" }
});
afirmar(
  r12a.status !== 400 && r12a.status !== 413,
  `extraer sólo con plantilla institucional no se rechaza por validación: ${r12a.status}`
);

//accion=plantilla con texto en bruto largo y multilínea llega al motor sin recortarse.
const institucionalLargo = Array.from(
  { length: 300 },
  (_, i) => `Línea ${i + 1}: RE26014844 - actividad detallada con acentos, viñetas y saltos.`
).join("\n");
afirmar(
  institucionalLargo.length > 20000 && institucionalLargo.length <= LIMITE_INSTITUCIONAL,
  `El caso de prueba es extenso y multilínea (${institucionalLargo.length} caracteres, dentro del tope de ${LIMITE_INSTITUCIONAL})`
);
const r12b = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAdmin),
  body: { accion: "plantilla", plantillaInstitucional: institucionalLargo, datos: { cliente: "Banco Popular" } }
});
afirmar(
  r12b.status !== 400 && r12b.status !== 413,
  `accion=plantilla acepta texto institucional extenso sin 400/413: ${r12b.status}`
);

// La plantilla institucional sola, sin notas, sigue siendo válida para regenerar.
const r12c = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAdmin),
  body: { accion: "plantilla", plantillaInstitucional: "BANCO AV VILLAS\nN° de Caso: 99120" }
});
afirmar(
  r12c.status !== 400 && r12c.status !== 413,
  `accion=plantilla con sólo la plantilla institucional es válida: ${r12c.status}`
);

// Sin ninguna fuente, la acción de plantilla también debe fallar cerrado.
await caso(
  "plantilla sin texto ni notas -> 400",
  { method: "POST", headers: hdr(tokenAdmin), body: { accion: "plantilla", plantillaInstitucional: "   " } },
  400
);

// El prompt debe incluir el bloque institucional en bruto.
const promptConInstitucional = construirPrompt("notas", "N° de Caso: RE26014844\nMesa: 2");
afirmar(
  promptConInstitucional.includes("<plantilla_institucional>") &&
    promptConInstitucional.includes("RE26014844") &&
    promptConInstitucional.includes("<notas_tecnico>"),
  "construirPrompt inyecta el bloque institucional y las notas del técnico"
);
afirmar(
  !construirPrompt("notas", "").includes("<plantilla_institucional>"),
  "Sin plantilla pegada, el prompt no inventa el bloque institucional"
);
afirmar(
  construirPrompt("", "```json {\"hack\": true} ```").includes("'''json"),
  "Los delimitadores de código del texto pegado se neutralizan"
);

/* ================================================================== */
console.log("\n=== 13. Prompt exclusivo de Plantilla Corporativa ===");
const promptSolo = construirPromptSoloPlantilla("BANCO POPULAR\nN° de Caso: 12345", "", {
  cliente: "Banco Popular"
});
afirmar(
  promptSolo.includes("*PLANTILLA {cliente} {numero_caso}*"),
  "El prompt exige el formato corporativo oficial con la etiqueta PLANTILLA literal"
);
afirmar(
  ["SH:", "Medio:", "Nombre del equipo:", "Falla:", "Causa:", "Solución:", "Pruebas:", "Fecha de 1 atención:", "Hora inicio:", "Hora fin:", "Hora de desplazamiento:"].every((etiqueta) =>
    promptSolo.includes(etiqueta)
  ),
  "El prompt enumera las 14 etiquetas del formato oficial de WhatsApp"
);
afirmar(
  construirPromptSoloPlantilla("", "", { numero_caso: "2303375" }).includes("<datos_ya_capturados>"),
  "El prompt prioriza los datos ya capturados en el formulario"
);
afirmar(
  promptSolo.includes("<plantilla_institucional>") && promptSolo.includes("12345"),
  "El prompt incluye el bloque institucional en bruto"
);

/* ================================================================== */
console.log("\n=== 14. Excel corporativo R&S Soluciones (normalización) ===");
afirmar(
  normalizarMoneda("70.000") === 70000 && normalizarMoneda("$ 1.250.500") === 1250500,
  "normalizarMoneda resuelve el separador de miles colombiano"
);
afirmar(
  normalizarMoneda("$ 1.250.500,50") === 1250500.5 && normalizarMoneda("70000") === 70000,
  "normalizarMoneda resuelve miles y decimales a la vez"
);
afirmar(
  normalizarMoneda("") === 0 && normalizarMoneda(null) === 0 && normalizarMoneda("n/d") === 0,
  "normalizarMoneda devuelve 0 ante valores vacíos o no numéricos"
);
afirmar(normalizarFecha("2026-09-23") === "23/09/2026", "normalizarFecha convierte ISO a DD/MM/AAAA");
afirmar(
  normalizarFecha("2026-09-23T10:00:00Z") === "23/09/2026",
  "normalizarFecha descarta la hora del ISO"
);
afirmar(normalizarFecha("4/9/2026") === "04/09/2026", "normalizarFecha rellena a dos dígitos");
afirmar(normalizarFecha("23 de septiembre de 2026") === "23 de septiembre de 2026",
  "normalizarFecha conserva el texto que no reconoce en vez de perderlo");
afirmar(celdaTexto("") === "n/d" && celdaTexto(null) === "n/d" && celdaTexto(" 2 ") === "2",
  "celdaTexto sustituye vacíos por n/d y recorta espacios");
afirmar(EMPRESA === "R&S SOLUCIONES", "La identidad corporativa del archivo es R&S SOLUCIONES");

/* ================================================================== */
console.log("\n=== 15. accion=modelos (diagnostico, requiere llave) ===");
delete process.env.GEMINI_API_KEY;
const r12 = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAdmin),
  body: { accion: "modelos" }
});
afirmar(r12.status === 502 && !r12.body.ok, `sin llave -> 502 controlado: ${r12.status}`);
afirmar(
  !JSON.stringify(r12.body).match(/AIza|AQ\.Ab/),
  "modelos no filtra la llave"
);
const r15b = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAjeno),
  body: { accion: "modelos" }
});
afirmar(r15b.status === 403, `RBAC tambien protege el diagnostico: ${r15b.status}`);

// La acción de plantilla institucional también queda tras RBAC.
const r15c = await manejarPeticion({
  method: "POST",
  headers: hdr(tokenAjeno),
  body: { accion: "plantilla", plantillaInstitucional: "BANCO POPULAR\nN°: 12345" }
});
afirmar(r15c.status === 403, `RBAC protege accion=plantilla: ${r15c.status}`);

console.log(fallos === 0 ? "\n*** TODAS LAS PRUEBAS PASARON ***" : `\n*** ${fallos} PRUEBA(S) FALLARON ***`);
// process.exitCode en vez de process.exit(): evita cortar sockets pendientes
// de las llamadas reales a Google sin completar.
process.exitCode = fallos === 0 ? 0 : 1;