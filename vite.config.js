import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { manejarPeticion } from "./api/_lib/handler.js";

/**
 * Monta /api/gemini dentro del servidor de desarrollo de Vite usando EXACTAMENTE el
 * mismo manejador que Vercel. Así la GEMINI_API_KEY sólo existe en process.env
 * durante el desarrollo: nunca se inyecta en el bundle del navegador.
 */
function geminiProxyDev() {
  return {
    name: "gemini-proxy-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/gemini", async (req, res, next) => {
        // Tras el montaje, req.url es sólo la ruta relativa. Se normaliza para que
        // un query string (p.ej. /api/gemini?x=1) no desvíe la petición a otro
        // middleware, que dejaría expuesto el archivo fuente.
        let ruta = "/";
        try {
          ruta = new URL(req.url || "/", "http://localhost").pathname;
        } catch {
          ruta = "/";
        }
        if (ruta !== "/" && ruta !== "") return next();

        let cuerpo = null;
        try {
          const trozos = [];
          for await (const trozo of req) trozos.push(trozo);
          const crudo = Buffer.concat(trozos).toString("utf8");
          if (crudo) cuerpo = JSON.parse(crudo);
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "JSON inválido." }));
          return;
        }

        try {
          const resultado = await manejarPeticion({
            method: req.method,
            headers: req.headers,
            body: cuerpo
          });

          res.statusCode = resultado.status;
          for (const [clave, valor] of Object.entries(resultado.headers || {})) {
            res.setHeader(clave, valor);
          }
          res.end(JSON.stringify(resultado.body));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              ok: false,
              error: `Error interno del proxy de IA: ${err?.message || err}`
            })
          );
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv con prefijo "" lee TODAS las variables de .env (incluidas GEMINI_API_KEY),
  // pero únicamente dentro del proceso de Node: aquí se pasan a process.env para que
  // el servidor de desarrollo y el handlersequent el mismo camino que Vercel.
  // El bundle del navegador sólo recibe import.meta.env, que Vite restringe a VITE_*.
  const cargadas = loadEnv(mode, process.cwd(), "");
  for (const clave of Object.keys(cargadas)) {
    if (process.env[clave] === undefined) process.env[clave] = cargadas[clave];
  }

  return {
    plugins: [react(), geminiProxyDev()],
    server: { port: 5173 },
    // Sólo se expone al cliente lo que lleva prefijo VITE_.
    // GEMINI_/GOOGLE_ quedan fuera del bundle: esas llaves viven en el servidor.
    envPrefix: ["VITE_"]
  };
});