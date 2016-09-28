const invariant = require('invariant');

//todo (future) - allow manifest to specify multiple regions for a single file. Allow region to be an array, not just a string.

//validate a manifest
function validateManifest(manifest) {
  invariant(typeof manifest === 'object', 'must pass manifest to clientCheck');
  invariant(typeof manifest.geneticConstructor === 'object', 'must pass a valid genetic constructor manifest');

  const router = manifest.geneticConstructor.router;
  const client = manifest.geneticConstructor.client;

  invariant(typeof manifest.geneticConstructor.type === 'string', 'must specify geneticConstructor.type');

  invariant(!!client || !!router, 'must specify client or router for extension');

  if (!!client) {
    invariant(Array.isArray(client), 'geneticConstructor.client must be array');
    invariant(client.every(function checkFiles(clientObj) {
      return typeof clientObj.file === 'string';
    }), 'each client extension object must have a file');

    invariant(client.every(function checkRegions(clientObj) {
      return typeof clientObj.region === 'string' || clientObj.region === null;
    }), 'each client extension object must have a region, or define region as null');

    const regions = client.map(function mapToRegion(clientObj) { return clientObj.region; })
      .filter(function filterNulls(region) { return !!region; });

    //get regions, ignore null, make sure no repeats
    const unique = Object.keys(regions.reduce(function reduceRegions(acc, region) {
      acc[region] = 1;
      return acc;
    }, {}));

    invariant(regions.length === unique.length, 'can only have one client extension per region');
  }

  if (!!router) {
    invariant(typeof router === 'string' && router.endsWith('.js'), 'must specify javascript router as file');
  }

  return manifest;
}

/**
 * Check whether an extension manifest has client side components. Does not validate their format.
 * @private
 * @param manifest
 * @returns {boolean} true if client components
 */
function manifestIsClient(manifest) {
  //check for old format
  if (typeof manifest.geneticConstructor.client === 'string' || typeof manifest.geneticConstructor.region === 'string') {
    console.error('extension in wrong format. Manifest should list array of client modules, not a single one. Check docs.');
  }

  if (!Array.isArray(manifest.geneticConstructor.client)) {
    return false;
  }

  return manifest.geneticConstructor.client.length > 0;
}

/**
 * Check whether an extension manifest has server side components
 * @private
 * @param manifest
 * @returns {boolean} true if server components
 */
function manifestIsServer(manifest) {
  return !!manifest.geneticConstructor.router;
}

function manifestClientFiles(manifest) {
  invariant(manifestIsClient(manifest), 'must pass client manifest');
  return manifest.geneticConstructor.client.map(clientObj => clientObj.file);
}

function manifestClientRegions(manifest) {
  invariant(manifestIsClient(manifest), 'must pass client manifest');
  return manifest.geneticConstructor.client.map(clientObj => clientObj.region);
}

//given a manifest (where only one file for a given region) and a region, find the file
function getClientFileFromRegion(manifest, region) {
  invariant(manifestIsClient(manifest), 'must pass client manifest');

  function finder(clientObj) {
    return clientObj.region === region;
  }

  const found = manifest.geneticConstructor.client.find(finder);

  return found ? found.file : null;
}

function extensionName(manifest) {
  return manifest.geneticConstructor.readable || manifest.name;
}

function extensionAuthor(manifest) {
  return manifest.author || 'Unknown';
}

function extensionDescription(manifest) {
  return manifest.geneticConstructor.description || manifest.description || 'No Description';
}

function extensionType(manifest) {
  return manifest.geneticConstructor.type || '';
}

function extensionRegion(manifest) {
  return manifest.geneticConstructor.region;
}

//es5 support - can use es6 modules when update node

module.exports = {
  validateManifest: validateManifest,
  manifestIsClient: manifestIsClient,
  manifestIsServer: manifestIsServer,
  manifestClientFiles: manifestClientFiles,
  manifestClientRegions: manifestClientRegions,
  getClientFileFromRegion: getClientFileFromRegion,
  extensionName: extensionName,
  extensionAuthor: extensionAuthor,
  extensionDescription: extensionDescription,
  extensionType: extensionType,
  extensionRegion: extensionRegion,
};
