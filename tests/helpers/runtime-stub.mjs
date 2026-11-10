/** Stand-in for Base44's secret store. Tests set globalThis.__secrets. */
export const secrets = {
  get: (name) => (globalThis.__secrets || {})[name],
};
