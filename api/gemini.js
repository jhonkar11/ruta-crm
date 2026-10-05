// Vercel Serverless Function: proxy seguro hacia Google Gemini.
//
// La GEMINI_API_KEY se lee de process.env (Variables de Entorno de Vercel) y NUNCA
// se envía al navegador. El cliente sólo manda sesión + imagen/notas; el prompt,
// el modelo y la llamada a Google ocurren íntegramente aquí.
//
// Requiere en Vercel:
//   GEMINI_API_KEY            -> llave de Google AI Studio (obligatoria)
//   SUPABASE_JWT_SECRET       -> para validar la sesión en local (recomendado)
//   (o alternativamente) SUPABASE_URL + SUPABASE_ANON_KEY
//   SOPORTE_ADMIN_EMAIL       -> opcional, por defecto jhonka001@gmail.com
import { manejarPeticion } from "./_lib/handler.js";

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  const resultado = await manejarPeticion({
    method: req.method,
    headers: req.headers || {},
    // Vercel parsea application/json; si no lo hizo, cae al texto plano.
    body: req.body ?? null
  });

  for (const [clave, valor] of Object.entries(resultado.headers || {})) {
    res.setHeader(clave, valor);
  }
  return res.status(resultado.status).json(resultado.body);
}