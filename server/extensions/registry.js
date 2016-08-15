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
import fs from 'fs';
import { pickBy } from 'lodash';
import { manifestIsServer, manifestIsClient } from './manifestUtils';

const nodeModulesDir = process.env.BUILD ? 'gd_extensions' : path.resolve(__dirname, './node_modules');

const registry = {};

fs.readdirSync(nodeModulesDir).forEach(packageName => {
  try {
    //skip the test extensions unless we're in the test environment
    if (packageName.startsWith('test') && process.env.NODE_ENV !== 'test') {
      return;
    }

    //future process.env.BUILD support (if not already handled by line above)
    const filePath = path.resolve(nodeModulesDir, packageName + '/package.json');
    const depManifest = require(filePath);

    if (!depManifest.geneticConstructor) {
      console.log('ignoring package ' + packageName + ', no field geneticConstructor');
      return;
    }

    Object.assign(registry, {
      [packageName]: depManifest,
    });
  } catch (err) {
    console.warn('error loading extension: ' + packageName);
    console.error(err);
  }
});

export const isRegistered = (name) => {
  return registry.hasOwnProperty(name);
};

export const getClientExtensions = () => {
  return pickBy(registry, (manifest, key) => manifestIsClient(manifest));
};

export const getServerExtensions = () => {
  return pickBy(registry, (manifest, key) => manifestIsServer(manifest));
};

export default registry;
