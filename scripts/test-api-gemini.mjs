import crypto from "node:crypto";
import { manejarPeticion } from "../api/_lib/handler.js";

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
for (const malo of ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "../../etc/passwd", ""]) {
  const r = await manejarPeticion({
    method: "POST",
    headers: hdr(tokenAdmin),
    body: { accion: "testear", modelName: malo }
  });
  const usado = r.body.modeloUsado || (r.body.error || "").slice(0, 40);
  const ok = usado === "gemini-2.0-flash" || String(usado).includes("GEMINI_API_KEY") || r.status === 503;
  if (!ok) fallos++;
  console.log(`${ok ? "PASS" : "FAIL"}  modelName="${malo}" -> normalizado: ${usado}`);
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

console.log(fallos === 0 ? "\n*** TODAS LAS PRUEBAS PASARON ***" : `\n*** ${fallos} PRUEBA(S) FALLARON ***`);
// process.exitCode en vez de process.exit(): evita el assert de libuv en Windows
// al cortar sockets pendientes del agente HTTP de @google/genai.
process.exitCode = fallos === 0 ? 0 : 1;