/** @typedef {'admin' | 'agency' | 'operator'} AppRole */

export const ROLE_HOME = Object.freeze({
  admin: "/admin",
  agency: "/agency",
  operator: "/operator",
});

/**
 * Resolve the only safe destination after login.
 * A requested path is accepted only when it is an internal path inside the
 * authenticated user's own portal. External/scheme-relative paths are rejected.
 *
 * @param {AppRole} role
 * @param {string | null | undefined} requestedNext
 * @returns {string}
 */
export function resolvePostLoginPath(role, requestedNext) {
  const home = ROLE_HOME[role];
  if (!home) return "/";

  if (!requestedNext || !requestedNext.startsWith("/") || requestedNext.startsWith("//")) {
    return home;
  }

  const isInsideRoleArea = requestedNext === home || requestedNext.startsWith(`${home}/`);
  return isInsideRoleArea ? requestedNext : home;
}
