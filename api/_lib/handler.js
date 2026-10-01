import { verificarToken, aplicarRateLimit, extraerIp, adminEmail } from "./auth.js";
import { accionExtraer, accionTestear, estadoDelMotor, MODELO_POR_DEFECTO } from "./gemini.js";

const MAX_BODY = 4_500_000; // límite de Vercel para serverless (4.5 MB)

const MIME_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif"
];

function normalizarMime(mimeType) {
  const m = String(mimeType || "").toLowerCase().trim();
  if (!MIME_PERMITIDOS.includes(m)) return "image/png";
  return m === "image/jpg" ? "image/jpeg" : m;
}

/**
 * Manejador puro: { method, headers, body } -> { status, headers, body }.
 * Lo consumen tanto el adaptador de Vercel (api/gemini.js) como el middleware
 * de `vite.config.js` en desarrollo, para que dev y prod se comporten igual.
 */
export async function manejarPeticion({ method = "GET", headers = {}, body = null } = {}) {
  const cabeceras = headers || {};
  const lowered = {};
  for (const [k, v] of Object.entries(cabeceras)) {
    lowered[k.toLowerCase()] = Array.isArray(v) ? v[0] : v;
  }

  if (method === "GET") {
    // Sonda de salud: no revela si hay llave, sólo si el servidor está vivo.
    return {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: { ok: true, servicio: "gemini", modeloPorDefecto: MODELO_POR_DEFECTO }
    };
  }

  if (method !== "POST") {
    return {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "GET, POST" },
      body: { ok: false, error: "Método no permitido." }
    };
  }

  const crudo = typeof body === "string" ? body : JSON.stringify(body ?? {});
  if (crudo.length > MAX_BODY) {
    return {
      status: 413,
      headers: { "Content-Type": "application/json" },
      body: { ok: false, error: "La carga es demasiado grande. Máximo 4.5 MB." }
    };
  }

  let datos = {};
  try {
    datos = typeof body === "string" ? JSON.parse(body || "{}") : (body || {});
  } catch {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { ok: false, error: "JSON inválido en el cuerpo de la petición." }
    };
  }

  const limite = aplicarRateLimit(extraerIp(cabeceras));
  if (!limite.permitido) {
    return {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(limite.reintentarEn)
      },
      body: {
        ok: false,
        error: `Demasiadas consultas. Reintenta en ${limite.reintentarEn}s.`
      }
    };
  }

  const token = lowered.authorization || lowered["x-access-token"];
  const sesion = await verificarToken(token);
  if (!sesion.ok) {
    return {
      status: sesion.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: { ok: false, error: sesion.error }
    };
  }

  const accion = String(datos.accion || "extraer");

  try {
    if (accion === "estado") {
      return {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: { ok: true, ...estadoDelMotor() }
      };
    }

    if (accion === "testear") {
      const resultado = await accionTestear({ modelName: datos.modelName });
      return {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: { ok: true, ...resultado }
      };
    }

    const resultado = await accionExtraer({
      imagenBase64: datos.imagenBase64,
      mimeType: normalizarMime(datos.mimeType),
      textoNotas: datos.textoNotas,
      modelName: datos.modelName
    });

    return {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: { ok: true, ...resultado }
    };
  } catch (err) {
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    console.error(`[api/gemini] ${status} -> ${err?.message}`);
    return {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: { ok: false, error: err?.message || "Error desconocido en la API de Gemini." }
    };
  }
}

export { adminEmail };