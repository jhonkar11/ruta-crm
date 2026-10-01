import crypto from "node:crypto";

const ADMIN_EMAIL_POR_DEFECTO = "jhonka001@gmail.com";

/** Correo con acceso permitido. Configurable con SOPORTE_ADMIN_EMAIL en Vercel. */
export function adminEmail() {
  return (process.env.SOPORTE_ADMIN_EMAIL || ADMIN_EMAIL_POR_DEFECTO).toLowerCase().trim();
}

function b64urlToBuffer(seg) {
  return Buffer.from(seg.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Verificación local de un JWT HS256 de Supabase.
 * Devuelve el payload o lanza si la firma / expiración no cuadran.
 */
function verificarJwtHs256(token, secret) {
  const partes = token.split(".");
  if (partes.length !== 3) throw new Error("Token mal formado");

  const [headerB64, payloadB64, firmaB64] = partes;

  let header;
  let payload;
  try {
    header = JSON.parse(b64urlToBuffer(headerB64).toString("utf8"));
    payload = JSON.parse(b64urlToBuffer(payloadB64).toString("utf8"));
  } catch {
    throw new Error("Token ilegible");
  }

  if (header.alg !== "HS256") throw new Error(`Algoritmo no permitido: ${header.alg}`);

  const esperada = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const recibida = b64urlToBuffer(firmaB64);

  if (esperada.length !== recibida.length) throw new Error("Firma inválida");
  if (!crypto.timingSafeEqual(esperada, recibida)) throw new Error("Firma inválida");

  const ahora = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && ahora >= payload.exp) throw new Error("Sesión expirada");

  return payload;
}

/**
 * Valida el token Bearer contra Supabase y devuelve { ok, email }.
 *
 * Cadena de verificación (la primera disponible):
 *  1. SUPABASE_JWT_SECRET -> verificación local HS256 (sin red).
 *  2. SUPABASE_URL + anon key -> consulta GET {url}/auth/v1/user.
 *
 * Si ninguna está configurada devuelve 503: el endpoint NUNCA queda abierto.
 */
export async function verificarToken(token) {
  if (!token || typeof token !== "string") {
    return { ok: false, status: 401, error: "Falta el token de sesión (Authorization: Bearer)." };
  }

  const bearer = token.replace(/^Bearer\s+/i, "").trim();
  if (!bearer) {
    return { ok: false, status: 401, error: "Token de sesión vacío." };
  }

  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_JWT_SECRET_LOCAL;
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  let email = null;

  if (secret) {
    try {
      const payload = verificarJwtHs256(bearer, secret);
      email = (payload.email || "").toLowerCase().trim();
    } catch (err) {
      return { ok: false, status: 401, error: `Sesión no válida: ${err.message}` };
    }
  } else if (url && anonKey) {
    try {
      const res = await fetch(`${url}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${bearer}`, apikey: anonKey }
      });
      if (!res.ok) return { ok: false, status: 401, error: "Sesión no válida o expirada." };
      const data = await res.json();
      email = (data?.email || "").toLowerCase().trim();
    } catch (err) {
      return { ok: false, status: 401, error: `No se pudo validar la sesión: ${err.message}` };
    }
  } else {
    return {
      ok: false,
      status: 503,
      error:
        "Servidor sin configurar. Define SUPABASE_JWT_SECRET (recomendado) o SUPABASE_URL + SUPABASE_ANON_KEY en las variables de Vercel."
    };
  }

  if (!email) return { ok: false, status: 401, error: "El token no incluye un correo." };

  if (email !== adminEmail()) {
    return {
      ok: false,
      status: 403,
      error: `Acceso denegado. Este módulo es exclusivo para ${adminEmail()}.`
    };
  }

  return { ok: true, email };
}

/* ------------------------------------------------------------------ */
/* Rate limiting en memoria (por IP). Suficiente para frenar ráfagas. */
/* ------------------------------------------------------------------ */

const Ventanas = new Map();
const LIMITE_POR_MINUTO = Number(process.env.GEMINI_RATE_LIMIT || 30);
const VENTANA_MS = 60_000;

export function aplicarRateLimit(ip) {
  const ahora = Date.now();
  const clave = ip || "desconocida";
  const previo = Ventanas.get(clave);

  if (!previo || ahora - previo.desde > VENTANA_MS) {
    Ventanas.set(clave, { desde: ahora, conteo: 1 });
    return { permitido: true, restantes: LIMITE_POR_MINUTO - 1 };
  }

  previo.conteo += 1;
  if (previo.conteo > LIMITE_POR_MINUTO) {
    const reintentarEn = Math.ceil((VENTANA_MS - (ahora - previo.desde)) / 1000);
    return { permitido: false, reintentarEn };
  }
  return { permitido: true, restantes: LIMITE_POR_MINUTO - previo.conteo };
}

export function extraerIp(headers = {}) {
  const xf = headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return headers["x-real-ip"] || headers["x-vercel-forwarded-for"] || "desconocida";
}