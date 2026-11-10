/** Stand-in for the Base44 SDK. Tests set globalThis.__base44 to a fake client. */
export function createClientFromRequest() {
  return globalThis.__base44;
}
