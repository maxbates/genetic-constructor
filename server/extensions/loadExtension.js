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
import path from 'path';
import { errorDoesNotExist } from '../utils/errors';
import registry from './registry';
import { clientBundleUrl, defaultClientFilePath } from './constants';

//todo - no need for this right now - everything is statically avaialbe in the beginning (but other code expects this to be a promise)
const loadExtension = (name) => {
  return new Promise((resolve, reject) => {
    const manifest = registry[name];
    if (!!manifest) {
      resolve(manifest);
    } else {
      reject(errorDoesNotExist);
    }
  });
};

export const getExtensionInternalPath = (name, fileName = clientBundleUrl) => {
  const extensionPath = path.resolve(__dirname, `./node_modules/${name}`);

  //if requesting the bundle, see if the extension has a preferred route for it, otherwise just use index.js
  if (fileName === clientBundleUrl) {
    const manifest = registry[name];
    const client = manifest.geneticConstructor.client || defaultClientFilePath;
    return path.resolve(extensionPath, client);
  }

  path.resolve(extensionPath, fileName);
};

export default loadExtension;
