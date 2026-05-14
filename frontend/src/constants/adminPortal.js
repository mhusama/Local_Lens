/** Obscure URL prefix for the admin console (not linked from the public site). */
export const ADMIN_PORTAL_BASE = '/lens-console/a7k9m2';

/** Secret admin signup: full path is `${ADMIN_PORTAL_BASE}/${ADMIN_SECRET_SIGNUP_SEGMENT}` */
export const ADMIN_SECRET_SIGNUP_SEGMENT = 'create-admin-x3k7q';

export function adminSignupPath() {
  return `${ADMIN_PORTAL_BASE}/${ADMIN_SECRET_SIGNUP_SEGMENT}`;
}
