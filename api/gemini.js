// Vercel Serverless Function: Proxy Gemini API con RBAC para Jhonka001@gmail.com
import { GoogleGenAI } from "@google/genai";

const ADMIN_EMAIL = "jhonka001@gmail.com";

// Modelo único y estable. Los gemini-1.5-* fueron retirados por Google (HTTP 404).
const MODELO_POR_DEFECTO = "gemini-2.0-flash";
const MODELOS_PERMITIDOS = new Set([MODELO_POR_DEFECTO]);
const API_VERSIONS = ["v1", "v1beta"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validación de seguridad backend
  const authHeader = req.headers["x-user-email"] || req.headers.authorization;
  const userEmail = (authHeader || "").toLowerCase();

  // En producción, comprobar que la llamada provenga del correo del administrador
  if (userEmail && !userEmail.includes("jhonka001")) {
    return res.status(403).json({ error: `Acceso denegado. Módulo exclusivo para ${ADMIN_EMAIL}` });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY no configurada en las variables del servidor Vercel." });
  }

  const { prompt, imagenBase64, mimeType, modelName } = req.body || {};
  // Lista blanca estricta: nunca permitir que el cliente pida un modelo retirado.
  const model = MODELOS_PERMITIDOS.has(modelName) ? modelName : MODELO_POR_DEFECTO;

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

  for (const apiVersion of API_VERSIONS) {
    try {
      const ai = new GoogleGenAI({ apiKey, apiVersion });
      const response = await ai.models.generateContent({ model, contents });
      const text = response?.text ?? "";
      return res.status(200).json({ result: text, modelUsed: model, apiVersion });
    } catch (err) {
      lastError = err;
      if ((err?.status ?? err?.code) !== 404) break;
    }
  }

  console.error("Error en backend Gemini:", lastError);
  return res.status(500).json({ error: lastError?.message || "Error desconocido en la API de Gemini", modelUsed: model });
}
