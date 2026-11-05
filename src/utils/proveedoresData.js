/**
 * Mapa de proveedores conocidos con su Razón Social formal y NIT para la cuenta de cobro.
 * Se usa para inyectar dinámicamente el membrete corporativo según el proveedor activo.
 *
 * Las claves están normalizadas en minúsculas y sin tildes para un matching flexible.
 */
export const PROVEEDORES_MAPA = {
  "r&s soluciones":       { razonSocial: "R&S SOLUCIONES S.A.S.",                      nit: "900.291.287-9" },
  "rs soluciones":        { razonSocial: "R&S SOLUCIONES S.A.S.",                      nit: "900.291.287-9" },
  "r&s":                  { razonSocial: "R&S SOLUCIONES S.A.S.",                      nit: "900.291.287-9" },
  "fractalia":            { razonSocial: "FRACTALIA COLOMBIA S.A.S.",                  nit: "900.352.035-2" },
  "fractalia colombia":   { razonSocial: "FRACTALIA COLOMBIA S.A.S.",                  nit: "900.352.035-2" },
  "cencosud":             { razonSocial: "CENCOSUD COLOMBIA S.A.",                     nit: "890.108.005-5" },
  "grupo aval":           { razonSocial: "GRUPO AVAL ACCIONES Y VALORES S.A.",         nit: "830.060.994-9" },
  "ibm colombia":         { razonSocial: "IBM DE COLOMBIA S.A.S.",                     nit: "860.000.070-1" },
  "ibm":                  { razonSocial: "IBM DE COLOMBIA S.A.S.",                     nit: "860.000.070-1" },
  "lexmark":              { razonSocial: "LEXMARK COLOMBIA LTDA.",                     nit: "900.021.498-6" },
  "almacenes exito":      { razonSocial: "ALMACENES ÉXITO S.A.",                       nit: "860.029.740-4" },
  "almacenes exito":      { razonSocial: "ALMACENES ÉXITO S.A.",                       nit: "860.029.740-4" },
  "exito":                { razonSocial: "ALMACENES ÉXITO S.A.",                       nit: "860.029.740-4" },
  "carvajal tecnologia":  { razonSocial: "CARVAJAL TECNOLOGÍA Y SERVICIOS S.A.S.",     nit: "805.001.153-8" },
  "carvajal":             { razonSocial: "CARVAJAL TECNOLOGÍA Y SERVICIOS S.A.S.",     nit: "805.001.153-8" },
  "redeban multicolor":   { razonSocial: "REDEBAN MULTICOLOR S.A.",                    nit: "860.000.279-7" },
  "redeban":              { razonSocial: "REDEBAN MULTICOLOR S.A.",                    nit: "860.000.279-7" },
};

/**
 * Obtiene los datos del proveedor (razón social + NIT) según el nombre del proveedor activo.
 * Si no hay coincidencia, devuelve el nombre tal como llega en mayúsculas con NIT vacío.
 *
 * @param {string} nombreProveedor - Nombre del proveedor tal como aparece en el filtro.
 * @returns {{ razonSocial: string, nit: string }}
 */
export function obtenerDatosProveedor(nombreProveedor) {
  const DEFAULT = { razonSocial: "R&S SOLUCIONES S.A.S.", nit: "900.291.287-9" };
  if (!nombreProveedor || nombreProveedor === "todos" || nombreProveedor === "General") return DEFAULT;

  // Normalizar: minúsculas + quitar tildes
  const normalizar = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const clave = normalizar(nombreProveedor);

  // Buscar coincidencia exacta primero
  for (const [key, val] of Object.entries(PROVEEDORES_MAPA)) {
    if (clave === normalizar(key)) return val;
  }

  // Buscar coincidencia por substring (clave contiene key o key contiene clave)
  for (const [key, val] of Object.entries(PROVEEDORES_MAPA)) {
    const keyN = normalizar(key);
    if (clave.includes(keyN) || keyN.includes(clave)) return val;
  }

  // Sin coincidencia: devolver el nombre tal como llega
  return { razonSocial: nombreProveedor.toUpperCase(), nit: "" };
}
