// ============================================================
// Matemática financiera de créditos: sistema Francés (cuota fija),
// sistema Alemán (amortización a capital fija), y conversión TEA <-> TNA.
// Funciones puras, sin dependencias de Supabase ni de React — se pueden
// probar y reutilizar donde haga falta.
// ============================================================

// TEA (efectivo anual) -> TNA (nominal anual, con la periodicidad dada)
export function teaToTna(teaPct, periodosPorAno = 12) {
  const tea = teaPct / 100;
  const tna = periodosPorAno * (Math.pow(1 + tea, 1 / periodosPorAno) - 1);
  return tna * 100;
}

// TNA (nominal anual) -> TEA (efectivo anual)
export function tnaToTea(tnaPct, periodosPorAno = 12) {
  const tna = tnaPct / 100;
  const tea = Math.pow(1 + tna / periodosPorAno, periodosPorAno) - 1;
  return tea * 100;
}

// Tasa efectiva MENSUAL equivalente a una TEA dada (la que se usa mes a mes
// en las tablas de amortización)
export function teaToTasaMensual(teaPct) {
  const tea = teaPct / 100;
  return (Math.pow(1 + tea, 1 / 12) - 1) * 100;
}

// ------------------------------------------------------------
// Topes de usura vigentes en Colombia (Superintendencia Financiera).
// ⚠️ ESTOS VALORES CAMBIAN CADA MES — no son una constante permanente
// del sistema. El valor de referencia aquí corresponde a la certificación
// vigente en agosto de 2026 (Resolución 1139 de 2026). Actualízalos
// mensualmente desde https://www.superfinanciera.gov.co — no se puede
// automatizar sin conectar esa fuente oficial, así que por ahora es un
// valor editable a mano, no una verdad fija en el código.
// ------------------------------------------------------------
export const TOPES_USURA_REFERENCIA = {
  vigencia: "Agosto 2026",
  consumo_ordinario: 29.66,
  consumo_bajo_monto: 65.46,
  productivo_mayor_monto: 42.00,
  productivo_rural: 33.56,
  productivo_urbano: 59.67,
  popular_productivo_rural: 68.55,
  popular_productivo_urbano: 88.97,
};

export const MODALIDADES_USURA = [
  { key: "consumo_ordinario", label: "Consumo y ordinario" },
  { key: "consumo_bajo_monto", label: "Consumo de bajo monto" },
  { key: "productivo_mayor_monto", label: "Productivo de mayor monto" },
  { key: "productivo_rural", label: "Productivo rural" },
  { key: "productivo_urbano", label: "Productivo urbano" },
  { key: "popular_productivo_rural", label: "Popular productivo rural" },
  { key: "popular_productivo_urbano", label: "Popular productivo urbano" },
];

export function excedeTopeUsura(teaPct, modalidad = "consumo_ordinario") {
  const tope = TOPES_USURA_REFERENCIA[modalidad] ?? TOPES_USURA_REFERENCIA.consumo_ordinario;
  return teaPct > tope;
}

// ------------------------------------------------------------
// Sistema FRANCÉS: cuota fija durante todo el plazo.
// ------------------------------------------------------------
export function cuotaFrancesa(monto, tasaMensualPct, plazoMeses) {
  const i = tasaMensualPct / 100;
  if (!monto || !plazoMeses) return 0;
  if (i === 0) return monto / plazoMeses;
  return (monto * i) / (1 - Math.pow(1 + i, -plazoMeses));
}

export function tablaAmortizacionFrancesa(monto, tasaMensualPct, plazoMeses, seguroMensual = 0, fechaInicio) {
  const i = tasaMensualPct / 100;
  const cuota = cuotaFrancesa(monto, tasaMensualPct, plazoMeses);
  let saldo = monto;
  const filas = [];
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date();

  for (let periodo = 1; periodo <= plazoMeses; periodo++) {
    const saldoInicial = saldo;
    const interes = saldo * i;
    const abonoCapital = periodo === plazoMeses ? saldo : cuota - interes;
    saldo = Math.max(0, saldo - abonoCapital);
    const fechaPago = new Date(inicio);
    fechaPago.setMonth(fechaPago.getMonth() + periodo);

    filas.push({
      periodo,
      fecha: fechaPago.toISOString().slice(0, 10),
      saldoInicial: redondear(saldoInicial),
      cuota: redondear(abonoCapital + interes + seguroMensual),
      abonoCapital: redondear(abonoCapital),
      interes: redondear(interes),
      seguro: seguroMensual,
      saldoFinal: redondear(saldo),
    });
  }
  return filas;
}

// ------------------------------------------------------------
// Sistema ALEMÁN: abono a capital fijo, cuota decreciente mes a mes.
// ------------------------------------------------------------
export function tablaAmortizacionAlemana(monto, tasaMensualPct, plazoMeses, seguroMensual = 0, fechaInicio) {
  const i = tasaMensualPct / 100;
  const abonoCapitalFijo = plazoMeses ? monto / plazoMeses : 0;
  let saldo = monto;
  const filas = [];
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date();

  for (let periodo = 1; periodo <= plazoMeses; periodo++) {
    const saldoInicial = saldo;
    const interes = saldoInicial * i;
    saldo = Math.max(0, saldo - abonoCapitalFijo);
    const fechaPago = new Date(inicio);
    fechaPago.setMonth(fechaPago.getMonth() + periodo);

    filas.push({
      periodo,
      fecha: fechaPago.toISOString().slice(0, 10),
      saldoInicial: redondear(saldoInicial),
      cuota: redondear(abonoCapitalFijo + interes + seguroMensual),
      abonoCapital: redondear(abonoCapitalFijo),
      interes: redondear(interes),
      seguro: seguroMensual,
      saldoFinal: redondear(saldo),
    });
  }
  return filas;
}

export function totalesTabla(filas = []) {
  return filas.reduce((acc, f) => ({
    totalCuotas: acc.totalCuotas + f.cuota,
    totalIntereses: acc.totalIntereses + f.interes,
    totalCapital: acc.totalCapital + f.abonoCapital,
    totalSeguro: acc.totalSeguro + f.seguro,
  }), { totalCuotas: 0, totalIntereses: 0, totalCapital: 0, totalSeguro: 0 });
}

function redondear(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
