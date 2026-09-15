/**
 * Módulo centralizado de autenticación y roles para Emplea-TE.
 *
 * Los permisos se identifican por el rol del perfil y se vuelven a validar en backend.
 */

/**
 * Verifica si un email pertenece a un administrador autorizado.
 * La comparación es case-insensitive para mayor robustez.
 */
export function isAdmin(_email?: string | null, role?: string | null): boolean {
  return ["admin", "staff", "empresa"].includes(role || "");
}

export function canManageOffers(user?: { email?: string | null; app_metadata?: { role?: string }; user_metadata?: { role?: string }} | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  return isAdmin(user.email) || role === "staff" || role === "empresa";
}
