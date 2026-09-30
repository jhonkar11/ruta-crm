// Vercel Serverless Function: Purgado de imágenes temporales (> 7 días)
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Faltan credenciales de Supabase en el servidor." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Invocar función SQL si existe
    const { data: rpcData, error: rpcError } = await supabase.rpc("purgar_archivos_temporales_soporte", {
      dias_retencion: 7
    });

    if (!rpcError) {
      return res.status(200).json({ success: true, purgados: rpcData, method: "rpc" });
    }

    // 2. Fallback: Listar y purgar objetos de storage directamente
    const bucket = "soporte-temporales";
    const { data: files, error: listError } = await supabase.storage.from(bucket).list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "asc" }
    });

    if (listError) {
      return res.status(200).json({ success: true, message: "Bucket no inicializado o vacío" });
    }

    const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const aEliminar = files
      .filter((f) => new Date(f.created_at) < sieteDiasAtras)
      .map((f) => f.name);

    if (aEliminar.length > 0) {
      await supabase.storage.from(bucket).remove(aEliminar);
    }

    return res.status(200).json({
      success: true,
      eliminados: aEliminar.length,
      archivos: aEliminar
    });
  } catch (err) {
    console.error("Error en purga de temporales:", err);
    return res.status(500).json({ error: err.message });
  }
}
