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

/**
 * get the object with the given key. If the key is not present
 * return the defaultObject.
 * @return {Object}
 */
export function getLocal(key, defaultObject) {
  // many things could go wrong here, no localStorage, unserializable object etc.
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return defaultObject;
  } catch (error) {
    console.error('error getting localStorage:', key, ' - removing.');//eslint-disable-line no-console
    try {
      if (localStorage && localStorage.removeItem) {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.log('error removing ' + key + ' from localStorage'); //eslint-disable-line no-console
    }
  }
  return defaultObject;
}

/**
 * write JSON object to local storage
 */
export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage item:', key);//eslint-disable-line no-console
  }
}
