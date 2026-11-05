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

// ─── Clave de localStorage para proveedores personalizados ───────────────────
const LS_KEY = "rutacrm_proveedores_custom";

/**
 * Lee los proveedores personalizados guardados en localStorage.
 */
export function leerProveedoresCustom() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/**
 * Guarda un nuevo proveedor personalizado en localStorage.
 * @param {string} nombreProveedor
 * @param {string} razonSocial
 * @param {string} nit
 */
export function guardarProveedorCustom(nombreProveedor, razonSocial, nit) {
  const custom = leerProveedoresCustom();
  const clave = nombreProveedor.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  custom[clave] = { razonSocial: razonSocial || nombreProveedor.toUpperCase(), nit: nit || "" };
  localStorage.setItem(LS_KEY, JSON.stringify(custom));
}

/**
 * Obtiene los datos del proveedor (razón social + NIT) según el nombre del proveedor activo.
 * Busca primero en localStorage (proveedores custom), luego en el mapa estático.
 * @param {string} nombreProveedor
 * @returns {{ razonSocial: string, nit: string, esDesconocido: boolean }}
 */
export function obtenerDatosProveedor(nombreProveedor) {
  const DEFAULT = { razonSocial: "R&S SOLUCIONES S.A.S.", nit: "900.291.287-9", esDesconocido: false };
  if (!nombreProveedor || nombreProveedor === "todos" || nombreProveedor === "General") return DEFAULT;

  const normalizar = (str) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const clave = normalizar(nombreProveedor);

  // 1. Buscar en proveedores custom (localStorage)
  try {
    const custom = leerProveedoresCustom();
    for (const [key, val] of Object.entries(custom)) {
      if (clave === key || clave.includes(key) || key.includes(clave))
        return { ...val, esDesconocido: false };
    }
  } catch { /* SSR o localStorage no disponible */ }

  // 2. Búsqueda exacta en mapa estático
  for (const [key, val] of Object.entries(PROVEEDORES_MAPA)) {
    if (clave === normalizar(key)) return { ...val, esDesconocido: false };
  }

  // 3. Búsqueda por substring en mapa estático
  for (const [key, val] of Object.entries(PROVEEDORES_MAPA)) {
    const keyN = normalizar(key);
    if (clave.includes(keyN) || keyN.includes(clave)) return { ...val, esDesconocido: false };
  }

  // 4. Sin coincidencia: marcar como desconocido
  return { razonSocial: nombreProveedor.toUpperCase(), nit: "", esDesconocido: true };
}
