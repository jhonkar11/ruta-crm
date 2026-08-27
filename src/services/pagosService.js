import { supabase } from "./supabaseClient";
import { generarNumeroRecibo } from "../utils/pagosCredito";

// Trae TODO el libro de pagos de una sola vez (igual que fetchClientes),
// para que el estado de cartera se pueda calcular en memoria por cliente
// sin disparar una consulta nueva por cada tarjeta de la lista.
export async function fetchTodosPagos() {
  const { data, error } = await supabase
    .from("pagos_credito")
    .select("*")
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return data;
}

export async function registrarPago({
  clienteId, montoPagado, abonoCapital, abonoInteres, abonoSeguro,
  saldoAnterior, saldoNuevo, cuotaNumero, asesorId, asesorNombre, observaciones, fechaPago,
}) {
  const { data, error } = await supabase
    .from("pagos_credito")
    .insert({
      cliente_id: clienteId,
      numero_recibo: generarNumeroRecibo(clienteId),
      fecha_pago: fechaPago || new Date().toISOString().slice(0, 10),
      monto_pagado: montoPagado,
      abono_capital: abonoCapital,
      abono_interes: abonoInteres,
      abono_seguro: abonoSeguro,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      cuota_numero: cuotaNumero,
      asesor_id: asesorId,
      asesor_nombre: asesorNombre,
      observaciones: observaciones || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
