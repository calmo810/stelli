export async function resolve(specifier, context, next) {
  if (specifier === 'base44:runtime') {
    return { url: new URL('./runtime-stub.mjs', import.meta.url).href, shortCircuit: true };
  }
  if (specifier.startsWith('npm:@base44/sdk')) {
    return { url: new URL('./sdk-stub.mjs', import.meta.url).href, shortCircuit: true };
  }
  return next(specifier, context);
}
