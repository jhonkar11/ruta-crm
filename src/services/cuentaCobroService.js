/**
 * Servicio de integración con módulo de Cuentas de Cobro.
 * 
 * Este archivo es un stub/minimal que permite la integración del flujo unificado
 * de soporte técnico con el módulo de cuentas de cobro sin alterar la lógica
 * existente de cálculo de campos, formato de moneda o generación de Excel.
 * 
 * En tiempo de ejecución, handleProcesarIA intentará llamar a actualizarServicioEnCuentasCobro
 * si está disponible; si no, simplemente registra y continúa el proceso.
 */

// Exportar función vacía por defecto para que el módulo siempre se pueda importar
export function actualizarServicioEnCuentasCobro(servicio) {
  // No-op: la integración se hace mediante paso de state global
  // Los módulos de cuentas de cobro existentes consumen los mismos datos
  // desde su propio state/ctx sin esta llamada.
  console.log("Integración soporte→cuentas: servicio recibido, state global actualizado por el consumidor");
  return Promise.resolve();
}