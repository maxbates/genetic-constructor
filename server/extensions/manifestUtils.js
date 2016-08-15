import invariant from 'invariant';

/**
 * Check whether an extension manifest has client side components
 * @private
 * @param manifest
 * @returns {boolean} true if client components
 */
export function manifestIsClient(manifest) {
  invariant(typeof manifest.geneticConstructor === 'object', 'must pass a valid genetic constructor manifest');
  const hasRegion = (manifest.geneticConstructor.region === null || !!manifest.geneticConstructor.region);
  return hasRegion;
}

/**
 * Check whether an extension manifest has server side components
 * @private
 * @param manifest
 * @returns {boolean} true if server components
 */
export function manifestIsServer(manifest) {
  invariant(typeof manifest.geneticConstructor === 'object', 'must pass a valid genetic constructor manifest');
  return !!manifest.geneticConstructor.router;
}
