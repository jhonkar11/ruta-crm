/**
 * Identidad corporativa del emisor del documento de cuenta de cobro.
 */
export const EMPRESA = "R&S SOLUCIONES";

/**
 * Normaliza un valor monetario que puede venir de la IA o de la base de datos.
 * La IA suele devolver "70000", "$ 70.000", "1.250.500,50" o "70000 COP"; ExcelJS
 * necesita un número limpio o el formato moneda se rompe.
 *
 * @param {unknown} valor
 * @returns {number} Monto numérico; 0 si no es interpretable.
 */
export function normalizarMoneda(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (valor === null || valor === undefined) return 0;

  const limpio = String(valor).replace(/[^0-9,.-]/g, "");
  if (!limpio) return 0;

  const puntos = (limpio.match(/\./g) || []).length;
  const comas = (limpio.match(/,/g) || []).length;
  let normalizado = limpio;

  if (puntos > 0 && comas > 0) {
    // El separador decimal es el que aparece más a la derecha: "1.234,56" o "1,234.56".
    normalizado =
      limpio.lastIndexOf(",") > limpio.lastIndexOf(".")
        ? limpio.replace(/\./g, "").replace(",", ".")
        : limpio.replace(/,/g, "");
  } else if (comas > 0) {
    // Una sola coma con exactamente 3 decimales es separador de miles ("1,250,500").
    normalizado = /,\d{3}(?:\D|$)/.test(limpio) ? limpio.replace(/,/g, "") : limpio.replace(",", ".");
  } else if (puntos > 0) {
    // Un punto con exactamente 3 decimales es separador de miles colombiano ("70.000").
    normalizado = /\.\d{3}(?:\D|$)/.test(limpio) ? limpio.replace(/\./g, "") : limpio;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normaliza fechas a DD/MM/AAAA desde ISO, ISO con hora o texto ya formateado.
 * @param {unknown} valor
 * @returns {string} Fecha en DD/MM/AAAA, o el texto original si no se reconoce.
 */
export function normalizarFecha(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();

  // 2026-09-23 o 2026-09-23T10:00:00Z
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  // Ya viene en DD/MM/AAAA
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(texto)) {
    const [d, m, a] = texto.split("/");
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${a}`;
  }

  return texto;
}

/**
 * Convierte un valor a celda de texto legible. Las columnas de la plantilla
 * oficial no admiten nulos: se usa "n/d" (no disponible) para no dejar huecos.
 * @param {unknown} valor
 * @returns {string}
 */
export function celdaTexto(valor) {
  const texto = String(valor ?? "").trim();
  return texto || "n/d";
}