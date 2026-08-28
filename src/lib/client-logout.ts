/**
 * Client-side logout — POSTs to /api/auth/logout and returns to a public page.
 *
 * The logout endpoint only accepts POST (GET would be a CSRF vector and
 * also returned 405, so the old `<a href="/api/auth/logout">` links in the
 * public header silently did nothing and the session survived). Every
 * surface that offers "خروج" must go through this helper.
 */
export async function logoutAndRedirect(redirectTo = "/"): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // Network failure: still navigate so the UI doesn't hang; the cookie
    // will simply expire with the session.
  }
  window.location.assign(redirectTo);
}
