/** Module-level guard: run session verification only once per page load. */
let authCheckDispatched = false;

export function shouldDispatchAuthCheck(): boolean {
  if (authCheckDispatched) return false;
  authCheckDispatched = true;
  return true;
}

export function resetAuthCheckGuard(): void {
  authCheckDispatched = false;
}
