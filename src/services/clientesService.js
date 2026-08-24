import { supabase } from "./supabaseClient";

export async function fetchClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("fecha_creacion", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertCliente(record, isNew) {
  if (isNew) {
    const { data, error } = await supabase.from("clientes").insert(record).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("clientes")
    .update(record)
    .eq("id", record.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archivarCliente(id, estadoPrevio) {
  const { error } = await supabase
    .from("clientes")
    .update({ estado: "Archivado", estado_previo_archivo: estadoPrevio || null })
    .eq("id", id);
  if (error) throw error;
}

// Restaura al cliente exactamente al estado que tenía antes de archivarse
// (guardado en estado_previo_archivo al momento de archivar). Si por algún
// motivo no hay ese dato (registros archivados antes de esta mejora), cae
// en "Pendiente" como valor por defecto razonable.
export async function desarchivarCliente(id) {
  const { data: actual, error: errFetch } = await supabase
    .from("clientes")
    .select("estado_previo_archivo")
    .eq("id", id)
    .single();
  if (errFetch) throw errFetch;

  const estadoRestaurado = actual?.estado_previo_archivo || "Pendiente";
  const { data, error } = await supabase
    .from("clientes")
    .update({ estado: estadoRestaurado, estado_previo_archivo: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarCliente(id) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

// Actualización parcial y "silenciosa": solo toca las columnas que le pases
// (usada por el checklist de documentos), sin disparar la lógica de
// upsertCliente (que registra visitas / agenda citas). Evita que marcar un
// documento como entregado cree registros fantasma en otras tablas.
export async function actualizarCamposCliente(id, patch) {
  const { data, error } = await supabase
    .from("clientes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function registrarVisita({ clienteId, asesorId, observaciones, fotoUrl, estadoResultante }) {
  const { error } = await supabase.from("visitas").insert({
    cliente_id: clienteId,
    asesor_id: asesorId,
    observaciones,
    foto_url: fotoUrl,
    estado_resultante: estadoResultante,
  });
  if (error) throw error;
}
