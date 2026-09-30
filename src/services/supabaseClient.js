import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
// Normalizar URL: quitar sufijos como /rest/v1 o barras finales si fueron pegados por error
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
    "Revisa tu archivo .env (usa .env.example como plantilla)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
