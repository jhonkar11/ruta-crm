// Vercel Serverless Function: Proxy Gemini API con RBAC para Jhonka001@gmail.com
import { GoogleGenerativeAI } from "@google/generative-ai";

const ADMIN_EMAIL = "jhonka001@gmail.com";

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

  const { prompt, imagenBase64, mimeType, modelName = "gemini-2.0-flash" } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const contents = [];
    if (imagenBase64) {
      contents.push({
        inlineData: {
          data: imagenBase64,
          mimeType: mimeType || "image/png"
        }
      });
    }
    contents.push(prompt);

    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ result: text, modelUsed: modelName });
  } catch (err) {
    console.error("Error en backend Gemini:", err);
    return res.status(500).json({ error: err.message });
  }
}
