/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import invariant from 'invariant';
import { get as getPath, isEqual, merge } from 'lodash';

import { extensionName, getClientFileFromRegion, manifestClientRegions, manifestIsClient } from '../../server/extensions/manifestUtils';
import { downloadExtension } from './downloadExtension';
import { validRegion } from './regions';

//map of extensions
export const registry = {};

//listeners when an extension registers
const callbacks = [];

//track user's config for extensions - { [key] : {active : Boolean} }
//note - need to set this whenever it changes (currently track from user reducers)
const extensionConfig = {};

const defaultArgs = [registry, null, []];

function safelyRunCallback(callback, ...args) {
  try {
    callback.apply(null, args);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('error running callback');
      console.error(err);
    }
  }
}

function safelyRunCallbacks(...args) {
  const callbackArgs = (args.length > 0) ? args : defaultArgs;
  callbacks.forEach(cb => safelyRunCallback(cb, ...callbackArgs));
}

//pass config.extensions
export const setExtensionConfig = (nextConfig = {}) => {
  invariant(!nextConfig.extensions, 'pass config.extensions directly');

  if (!isEqual(nextConfig, extensionConfig)) {
    Object.keys(extensionConfig).forEach(key => {
      delete extensionConfig[key];
    });
    merge(extensionConfig, nextConfig);
    return true;
  }

  return false;
};

export const extensionIsActive = (key) => {
  const extensionManifest = registry[key];
  if (!extensionManifest) {
    return false;
  }
  return getPath(extensionConfig, [key, 'active'], false);
};

const defaultFilterOptions = {
  includeInactive : false,
  includeServer :false,
};

//returns an array of manifests
export const extensionsByRegion = (region, filterOptions = defaultFilterOptions) => {
  const { includeInactive, includeServer } = filterOptions;

  return Object.keys(registry)
    .map(key => registry[key])
    .filter(manifest => includeServer === true || manifestIsClient(manifest))
    .filter(manifest => includeInactive === true || extensionIsActive(manifest.name))
    .filter(manifest => {
      const regions = manifestClientRegions(manifest);
      return regions.indexOf(region) >= 0;
    })
    .sort((one, two) => one.name < two.name ? -1 : 1);
};

//check if a region expects file to download immediately
const fileShouldDownloadImmediately = (region) => region === null || region.startsWith('menu');

/**
 * Validate + register an extension manifest
 * If invalid, error is caught and logged and the extension is ignored
 * Downloads non-visual parts of client extension immediately, then runs all callbacks if successful. These callbacks include sections of the page to update when the registry updates.
 * called by loadExtensions to add the manifests
 * @function
 * @private
 * @param {Object} manifest A valid manifest
 * @returns {Object} registry
 */
export const registerManifest = (manifest) => {
  try {
    const { name, geneticConstructor } = manifest;
    const { client = [] } = geneticConstructor;

    //checks
    invariant(name, 'Name is required');
    invariant(Array.isArray(client), 'geneticConstruct.client must be an array');
    if (client.length > 0) {
      invariant(client.every(({ file, region }, index) => typeof file === 'string'), `File required for each client-side component, check ${name}`);
      invariant(client.every(({ file, region }, index) => region || region === null), `Region (manifest.geneticConstructor.region) is required to register a client-side extension, or null for non-visual extensions [${name}]`);
      invariant(client.every(({ file, region }, index) => validRegion(region)), `Region must be a valid region, check ${name}`);
    }

    //if we're already registered this extension, skip assigning render and downloading non-visible components, but let listeners know its in
    if (registry[name] && registry[name]._activated > 0) {
      safelyRunCallbacks(registry, name, manifestClientRegions(registry[name]));
      return registry;
    }

    //checks out, so assign to registry + do some setup for render functions
    Object.assign(registry, {
      [name]: Object.assign(manifest, {
        _downloaded: +Date.now(),
        _activated: extensionIsActive(manifest.name) ? +Date.now() : null,
        //render obj is map of region to payload
        render: {},
      }),
    });

    //when register non-client manifest, don't try to download or anything...

    //save:
    // 1) list of files for non-visual extensions to download immediately upon registration, if the extension is active
    // 2) list of relevant regions
    const extensionInfo = client.reduce((acc, { file, region }) => {
      acc.regions.add(region);

      if (fileShouldDownloadImmediately(region)) {
        acc.files.add(file)
      }

      return acc;
    }, { files: new Set(), regions: new Set() });

    //download appropriate files immediately, then run callbacks asynchronously, regardless of whether extension was downloaded
    const promises = extensionIsActive(manifest.name) ?
      [...extensionInfo.files].map(file => downloadExtension(name, file)) :
      [];

    Promise.all(promises)
      .then(() => {
        safelyRunCallbacks(registry, name, [...extensionInfo.regions]);
      });

    //return the registry synchronously
    return registry;
  } catch (err) {
    console.log(`could not register extension ${manifest.name}, ignoring.`);
    console.error(err);
    return registry;
  }
};

/**
 * Register the render() function of an extension
 * Extension manifest must already registered
 * used by registerExtension()
 * @function
 * @private
 * @param {string} key
 * @param {string} region
 * @param {Function} renderFn
 * @throws If extension manifest not already registered
 */
export const registerRender = (key, region, renderFn) => {
  invariant(!!key && typeof region === 'string', 'improper args to registerRender');
  invariant(typeof renderFn === 'function', 'Must provide a render function to register a visual extension.');
  invariant(registry[key], 'manifest must exist for extension ' + key + ' before registering');

  //wrap the render function in a closure and try-catch, and ensure it is downloaded
  const wrappedRender = function wrappedRender() {
    try {
      Object.assign(registry[key], { _activated: +Date.now() });
      return renderFn.apply(null, arguments);
    } catch (err) {
      console.error(`there was an error rendering the extension ${key} in ${region}`);
      console.error(err);
      throw err;
    }
  };

  Object.assign(registry[key].render, { [region]: wrappedRender });
};

export const registerMenu = (key, region, menuItems) => {
  invariant(typeof menuItems === 'function', 'Must provide a function returning the menu items.');
  invariant(Array.isArray(menuItems()), 'must render an array of menu items, even with no arguments passed');

  Object.assign(registry[key].render, { [region]: menuItems });
};

/**
 * Register a callback for when extensions are registered
 * @name onRegister
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {Function} cb Callback, called with signature (registry, key, regions) where key is last registered extension key, and regions is an array of region names where the extension registers
 * @param {boolean} [skipFirst=false] Execute on register? regions is null for this callback.
 * @returns {Function} Unregister function
 */
export const onRegister = (cb, skipFirst = false) => {
  callbacks.push(cb);
  !skipFirst && safelyRunCallback(cb, ...defaultArgs);
  return function unregister() { callbacks.splice(callbacks.findIndex(cb), 1); };
};

export const getExtensionName = (key) => {
  const manifest = registry[key];
  if (!manifest) {
    return null;
  }
  return extensionName(manifest);
};

/**
 * Attempt to download and render an extension.
 *
 * Should only call this function if there is a render function, otherwise just download it.
 *
 * E.g. this is called by ExtensionView component, for visual extensions, to defer loading of large visual bundle
 *
 * @private
 * @function
 *
 * @param key
 * @param region
 * @param container
 * @param options
 * @returns {Promise}
 * @resolve {Function} callback from render, the unregister function
 * @reject {Error} Error while rendering
 */
export const downloadAndRender = (key, region, container, options) => {
  const manifest = registry[key];
  const file = getClientFileFromRegion(manifest, region);

  return downloadExtension(key, file)
    .then(() => {
      const manifest = registry[key];
      const regionRender = manifest.render[region];

      if (typeof regionRender !== 'function') {
        return Promise.reject(`Extension ${key} did not specify a render() function, even though it defined a region. Check Extension manifest definition.`);
      }

      return new Promise((resolve, reject) => {
        try {
          const callback = regionRender(container, options);
          resolve(callback);
        } catch (err) {
          //already logged it when wrap render in registerExtension
          reject(err);
        }
      });
    });
};

/**
 * Check whether an extension is registered
 * @name isRegistered
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {string} key Extension name
 * @returns {boolean} true if registered
 */
export const isRegistered = (key) => {
  return !!registry[key];
};

//we can remove it from the registry, but there is no meaningful way to remove the script from the page...
export const clearRegistry = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('not actually clearning the registry, or doing anything');
  }
  /*
  Object.keys(registry).forEach(key => {
    delete registry[key];
  });
  */
  safelyRunCallbacks();
};

export default registry;