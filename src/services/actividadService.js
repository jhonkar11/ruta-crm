import { supabase } from "./supabaseClient";

export async function fetchActividad(clienteId) {
  const { data, error } = await supabase
    .from("novedades")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarActividad({ clienteId, asesorId, asesorNombre, tipo = "nota", descripcion }) {
  const { data, error } = await supabase
    .from("novedades")
    .insert({ cliente_id: clienteId, asesor_id: asesorId, asesor_nombre: asesorNombre, tipo, descripcion })
    .select()
    .single();
  if (error) throw error;
  return data;
}
