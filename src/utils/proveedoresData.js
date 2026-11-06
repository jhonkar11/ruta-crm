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
    if (typeof window === "undefined" || !window.localStorage) return {};
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Guarda un nuevo proveedor personalizado en localStorage.
 * @param {string} nombreProveedor
 * @param {string} razonSocial
 * @param {string} nit
 */
export function guardarProveedorCustom(nombreProveedor, razonSocial, nit) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const custom = leerProveedoresCustom();
    const strNombre = String(nombreProveedor || "").trim();
    if (!strNombre) return;
    const clave = strNombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    custom[clave] = {
      razonSocial: (razonSocial || strNombre).toUpperCase(),
      nit: String(nit || "").trim()
    };
    localStorage.setItem(LS_KEY, JSON.stringify(custom));
  } catch (err) {
    console.warn("No se pudo guardar proveedor custom en localStorage:", err);
  }
}

/**
 * Obtiene los datos del proveedor (razón social + NIT) según el nombre del proveedor activo.
 * Busca primero en localStorage (proveedores custom), luego en el mapa estático.
 * @param {string} nombreProveedor
 * @returns {{ razonSocial: string, nit: string, esDesconocido: boolean }}
 */
export function obtenerDatosProveedor(nombreProveedor) {
  const DEFAULT = { razonSocial: "R&S SOLUCIONES S.A.S.", nit: "900.291.287-9", esDesconocido: false };
  if (!nombreProveedor) return DEFAULT;

  const str = String(nombreProveedor).trim();
  if (!str || str.toLowerCase() === "todos" || str.toLowerCase() === "general") {
    return DEFAULT;
  }

  const normalizar = (text) =>
    String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const clave = normalizar(str);
  if (!clave) return DEFAULT;

  // 1. Buscar en proveedores custom (localStorage)
  try {
    const custom = leerProveedoresCustom();
    for (const [key, val] of Object.entries(custom)) {
      const keyNorm = normalizar(key);
      if (clave === keyNorm || clave.includes(keyNorm) || keyNorm.includes(clave)) {
        return {
          razonSocial: val?.razonSocial || str.toUpperCase(),
          nit: val?.nit || "",
          esDesconocido: false
        };
      }
    }
  } catch {
    /* ignore */
  }

  // 2. Búsqueda exacta en mapa estático
  for (const [key, val] of Object.entries(PROVEEDORES_MAPA)) {
    if (clave === normalizar(key)) {
      return { ...val, esDesconocido: false };
    }
  }

  // 3. Búsqueda por substring en mapa estático
  for (const [key, val] of Object.entries(PROVEEDORES_MAPA)) {
    const keyN = normalizar(key);
    if (clave.includes(keyN) || keyN.includes(clave)) {
      return { ...val, esDesconocido: false };
    }
  }

  // 4. Sin coincidencia: marcar como desconocido
  return { razonSocial: str.toUpperCase(), nit: "", esDesconocido: true };
}
