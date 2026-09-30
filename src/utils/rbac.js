// Control de Acceso Basado en Roles (RBAC)
// Módulo de Soporte Técnico reservado exclusivamente para Jhonka001@gmail.com

export const SOPORTE_ADMIN_EMAIL = "jhonka001@gmail.com";

/**
 * Valida si el usuario actual tiene permisos estrictos para acceder al módulo de Soporte Técnico.
 * @param {object} user - Objeto de usuario autenticado de Supabase Auth
 * @param {object} profile - Perfil de usuario cargado desde la tabla usuarios
 * @returns {boolean}
 */
export function isSoporteAuthorized(user, profile) {
  if (!user && !profile) return false;

  const userEmail = (user?.email || "").toLowerCase().trim();
  const profileEmail = (profile?.email || "").toLowerCase().trim();
  const profileNombre = (profile?.nombre || "").toLowerCase().trim();

  // El correo debe coincidir exactamente con el administrador autorizado
  if (userEmail === SOPORTE_ADMIN_EMAIL.toLowerCase()) return true;
  if (profileEmail === SOPORTE_ADMIN_EMAIL.toLowerCase()) return true;

  // Respaldo de seguridad en caso de perfiles asociados
  if (profileNombre.includes("jhonka001") || userEmail.startsWith("jhonka001@")) {
    return true;
  }

  return false;
}
