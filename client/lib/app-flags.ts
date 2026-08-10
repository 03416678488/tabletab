/**
 * App-wide runtime flags from Settings → System, set once by the
 * SettingsProvider. Kept as a module singleton (not React context) so code that
 * runs OUTSIDE the provider tree — e.g. the global error boundary — can read
 * them too.
 */
let appDebug = false;

export function setAppDebug(on: boolean) {
  appDebug = on;
}

/** True when "App Debug" is enabled — surfaces verbose error details. */
export function isAppDebug(): boolean {
  return appDebug;
}
