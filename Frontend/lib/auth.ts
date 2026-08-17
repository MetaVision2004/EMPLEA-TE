/**
 * Módulo centralizado de autenticación y roles para Emplea-TE.
 *
 * Los administradores se identifican por su email.
 * Para agregar o quitar administradores, basta con editar la lista ADMIN_EMAILS.
 */

const ADMIN_EMAILS: string[] = [
  "heidieneidal@gmail.com",
  "serjegomare@gmail.com",
];

/**
 * Verifica si un email pertenece a un administrador autorizado.
 * La comparación es case-insensitive para mayor robustez.
 */
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
