// ============================================================
// Lógica de negocio del libro de abonos: cronograma en vivo, cuota
// actual, reparto de un abono (interés -> seguro -> capital) y estado
// de cartera (Al día / Abono Parcial / Mora / Pagado en su totalidad).
// Todo se calcula en el momento a partir de los pagos ya registrados
// (utils/creditoMath.js) — no hay ningún dato duplicado ni cacheado
// que se pueda desincronizar.
// ============================================================

import { tablaAmortizacionFrancesa, tablaAmortizacionAlemana, teaToTasaMensual } from "./creditoMath";

export function tieneCreditoActivo(cliente) {
  return !!(cliente?.credito_monto && cliente?.credito_plazo_meses && cliente?.credito_tasa_tea && cliente?.credito_sistema);
}

export function generarCronograma(cliente) {
  if (!tieneCreditoActivo(cliente)) return [];
  const tasaMensual = teaToTasaMensual(cliente.credito_tasa_tea);
  const seguro = cliente.credito_seguro_mensual || 0;
  return cliente.credito_sistema === "aleman"
    ? tablaAmortizacionAlemana(cliente.credito_monto, tasaMensual, cliente.credito_plazo_meses, seguro, cliente.credito_fecha_desembolso)
    : tablaAmortizacionFrancesa(cliente.credito_monto, tasaMensual, cliente.credito_plazo_meses, seguro, cliente.credito_fecha_desembolso);
}

// Encuentra la primera cuota del cronograma que aún no está cubierta al
// 100%, sumando lo que ya se ha abonado a esa cuota específica (agrupado
// por cuota_numero en el libro de pagos — nunca se "adivina" el reparto).
export function obtenerCuotaActual(cronograma, pagos = []) {
  const acumulados = {};
  for (const p of pagos) {
    const n = p.cuota_numero;
    if (!n) continue;
    if (!acumulados[n]) acumulados[n] = { interes: 0, seguro: 0, capital: 0, total: 0 };
    acumulados[n].interes += Number(p.abono_interes || 0);
    acumulados[n].seguro += Number(p.abono_seguro || 0);
    acumulados[n].capital += Number(p.abono_capital || 0);
    acumulados[n].total += Number(p.monto_pagado || 0);
  }

  for (const fila of cronograma) {
    const ac = acumulados[fila.periodo] || { interes: 0, seguro: 0, capital: 0, total: 0 };
    if (ac.total < fila.cuota - 0.01) {
      return {
        ...fila,
        pagadoDeEsta: redondear(ac.total),
        pendienteDeEsta: redondear(fila.cuota - ac.total),
        interesPendiente: redondear(Math.max(0, fila.interes - ac.interes)),
        seguroPendiente: redondear(Math.max(0, fila.seguro - ac.seguro)),
        capitalPendiente: redondear(Math.max(0, fila.abonoCapital - ac.capital)),
      };
    }
  }
  return null; // crédito pagado en su totalidad
}

// Reparte un abono nuevo contra lo que falte de la cuota actual, en el
// orden estándar de servicing de cartera: interés -> seguro -> capital.
// Si el monto pagado supera lo que faltaba de la cuota, el excedente se
// aplica como abono extra a capital (prepago).
export function calcularAsignacionAbono(cuotaActual, montoPagado) {
  let restante = Math.max(0, montoPagado);

  const abonoInteres = redondear(Math.min(restante, cuotaActual.interesPendiente));
  restante -= abonoInteres;

  const abonoSeguro = redondear(Math.min(restante, cuotaActual.seguroPendiente));
  restante -= abonoSeguro;

  const capitalDeEstaCuota = redondear(Math.min(restante, cuotaActual.capitalPendiente));
  restante -= capitalDeEstaCuota;

  // Lo que sobre después de saldar la cuota completa es prepago a capital
  const abonoCapital = redondear(capitalDeEstaCuota + restante);

  return { abonoInteres, abonoSeguro, abonoCapital };
}

export function estadoCartera(cliente, pagos = [], hoyISO) {
  if (!tieneCreditoActivo(cliente)) return { activo: false };

  const cronograma = generarCronograma(cliente);
  const cuotaActual = obtenerCuotaActual(cronograma, pagos);
  const totalPagado = redondear(pagos.reduce((s, p) => s + Number(p.monto_pagado || 0), 0));

  const pagosOrdenados = [...pagos].sort((a, b) => String(a.creado_en || "").localeCompare(String(b.creado_en || "")));
  const ultimoPago = pagosOrdenados[pagosOrdenados.length - 1];
  const saldoPendiente = ultimoPago ? Number(ultimoPago.saldo_nuevo) : cliente.credito_monto;

  if (!cuotaActual) {
    return { activo: true, estado: "Pagado en su totalidad", saldoPendiente: 0, totalPagado, cronograma, cuotaActual: null, diasMora: 0 };
  }

  const hoy = hoyISO || new Date().toISOString().slice(0, 10);
  const vencida = cuotaActual.fecha < hoy;
  const abonoParcial = cuotaActual.pagadoDeEsta > 0.01;

  let estado = "Al día";
  if (vencida) estado = "Mora";
  else if (abonoParcial) estado = "Abono Parcial";

  const diasMora = vencida ? Math.max(0, Math.round((new Date(`${hoy}T00:00:00`) - new Date(`${cuotaActual.fecha}T00:00:00`)) / 86400000)) : 0;

  return { activo: true, estado, saldoPendiente, totalPagado, cronograma, cuotaActual, diasMora };
}

export const ESTADO_CARTERA_STYLE = {
  "Al día": { bg: "rgba(22, 163, 74, 0.12)", border: "rgba(22, 163, 74, 0.30)", fg: "#15803D", dot: "#16A34A" },
  "Abono Parcial": { bg: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.35)", fg: "#92400E", dot: "#D97706" },
  "Mora": { bg: "rgba(220, 38, 38, 0.12)", border: "rgba(220, 38, 38, 0.35)", fg: "#B91C1C", dot: "#DC2626" },
  "Pagado en su totalidad": { bg: "rgba(100, 116, 139, 0.12)", border: "rgba(100, 116, 139, 0.30)", fg: "#475569", dot: "#64748B" },
};

export function generarNumeroRecibo(clienteId) {
  const hoy = new Date();
  const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, "");
  const sufijo = String(clienteId).slice(-4).padStart(4, "0");
  const azar = Math.floor(Math.random() * 900 + 100);
  return `REC-${fecha}-${sufijo}-${azar}`;
}

function redondear(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}
