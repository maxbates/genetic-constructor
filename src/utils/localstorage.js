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
const logger = process.env.NODE_ENV === 'dev' ? console.error.bind(console) : () => {};

const getPrefix = () => {
  try {
    //this only works after the page has loaded... fails when the reducers are loading for example since store not initiated
    return window.constructor.store.getState().user.userid;
  } catch (err) {
    //since we refresh when we log the user out, this should be fine
    return window.flashedUser.userid;
  }
};

const getKey = (key, shouldPrefix = true) => {
  const prefix = getPrefix();
  return (shouldPrefix && prefix) ? `${prefix}_${key}` : key;
};

/**
 * get the object with the given key. If the key is not present
 * return the defaultObject.
 * @return {Object}
 */
export function getLocal(key, defaultObject, shouldPrefix = true) {
  // many things could go wrong here, no localStorage, unserializable object etc.
  try {
    const item = localStorage.getItem(getKey(key, shouldPrefix));
    if (item) {
      return JSON.parse(item);
    }
    return defaultObject;
  } catch (error) {
    logger('error getting localStorage:', key, ' - removing.');
    try {
      if (localStorage && localStorage.removeItem) {
        localStorage.removeItem(key);
      }
    } catch (err) {
      logger(`error removing ${key} from localStorage`);
    }
  }
  return defaultObject;
}

/**
 * write JSON object to local storage
 */
export function setLocal(key, value, shouldPrefix = true) {
  try {
    localStorage.setItem(getKey(key, shouldPrefix), JSON.stringify(value));
  } catch (error) {
    logger('Error setting localStorage item:', key);
  }
}
