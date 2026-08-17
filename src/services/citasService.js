import { supabase } from "./supabaseClient";

// Trae las citas con los datos del cliente ya incluidos (join),
// para no tener que cruzar arrays en el frontend.
export async function fetchCitas() {
  const { data, error } = await supabase
    .from("citas")
    .select(`
      id, cliente_id, asesor_id, fecha_hora, estado, notas,
      cita_anterior_id, recordatorio_24h_enviado, recordatorio_1h_enviado, creado_en,
      cliente:cliente_id ( nombres, apellidos, telefono, whatsapp, direccion, barrio, ciudad )
    `)
    .order("fecha_hora", { ascending: true });
  if (error) throw error;
  return data;
}

// Crea una cita nueva (agendamiento inicial o seguimiento).
export async function crearCita({ clienteId, asesorId, fechaHora, notas }) {
  const { data, error } = await supabase
    .from("citas")
    .insert({ cliente_id: clienteId, asesor_id: asesorId, fecha_hora: fechaHora, notas, estado: "Programada" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Reprograma: marca la cita actual como "Pospuesta" y crea una nueva
// "Programada" enlazada, conservando el historial completo.
export async function posponerCita(citaActual, nuevaFechaHora, notas) {
  const { error: errUpdate } = await supabase
    .from("citas")
    .update({ estado: "Pospuesta" })
    .eq("id", citaActual.id);
  if (errUpdate) throw errUpdate;

  const { data, error } = await supabase
    .from("citas")
    .insert({
      cliente_id: citaActual.cliente_id,
      asesor_id: citaActual.asesor_id,
      fecha_hora: nuevaFechaHora,
      notas: notas ?? citaActual.notas,
      estado: "Programada",
      cita_anterior_id: citaActual.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function marcarCumplida(citaId) {
  const { error } = await supabase.from("citas").update({ estado: "Cumplida" }).eq("id", citaId);
  if (error) throw error;
}

export async function cancelarCita(citaId) {
  const { error } = await supabase.from("citas").update({ estado: "Cancelada" }).eq("id", citaId);
  if (error) throw error;
}
