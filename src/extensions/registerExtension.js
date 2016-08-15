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
import registry, { registerRender } from './clientRegistry';
import invariant from 'invariant';

/**
 * Register a client-side extension with Genetic Constructor. This function registers a `render` function with the manifest of the extension, allowing the extension to render on the page.
 * @name register
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {string} key Name of the extension, must match package.json of the extension
 * @param {function} render Function called when the extension is requested to render. Called with signature `render(container, options)`
 */
const registerExtension = (key, render) => {
  const manifest = registry[key];

  //we've already checked the manifest is valid when registering the manifest, so if its present, its valid.
  invariant(!!manifest, `Cannot register an extension which does not have a registered manifest, tried to register ${key}`);

  //check the render function
  invariant(typeof render === 'function', 'Must provide a render function to register a plugin. Plugins can interact with the exposed API at window.constructor without registering themselves.');

  //wrap the render function in a closure and try-catch, and ensure it is downloaded
  const wrappedRender = function wrappedRender() {
    try {
      return render.apply(null, arguments);
    } catch (err) {
      console.error('there was an error rendering the extension ' + key);
      console.error(err);
      throw err;
    }
  };

  registerRender(key, wrappedRender);
};

export default registerExtension;
