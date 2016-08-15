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
import loadScript from 'load-script';

//map extension key -> true downloaded already
const cached = {};

/**
 * given an extension key, actually load the script
 * @name downloadExtension
 * @memberOf extensions
 * @returns {Promise}
 * @resolve {boolean} (false) - was cached, (true) - was downloaded
 * @reject {Response} (err) - error downloading
 */
export const downloadExtension = (key) => {
  return new Promise((resolve, reject) => {
    if (cached[key] === true) {
      resolve(false);
      return;
    }

    //avoid trying to download again extensions which already errored
    if (cached[key] === false) {
      console.warn(`there was an error loading ${key}, so not trying again`);
      return reject('already errored');
    }

    //we need index.js so that relative sourcemap paths will work properly
    const url = `/extensions/load/${key}/index.js`;

    //we can try to catch some errors, but adding script dynamically to head of page doesn't allow us to catch this way
    //todo - patch window.onerror and catch
    try {
      loadScript(url, (err, script) => {
        if (err) {
          reject(err);
        }
        cached[key] = true;
        resolve(true);
      });
    } catch (err) {
      cached[key] = false;
      reject(err);
    }
  });
};

export const isDownloaded = (key) => {
  return !!cached[key];
};

export default downloadExtension;
