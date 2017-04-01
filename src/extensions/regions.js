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

const regions = {
  //region at bottom of page
  projectDetail: 'projectDetail',

  //block context menu
  'menu:block': 'menu:block',
};

const regionTypes = {
  projectDetail: 'render',
  'menu:block': 'menu'
};

/**
 * Check whether a region is a valid to load the extension
 * @name validRegion
 * @memberOf module:constructor.module:extensions
 * @function
 * @param {string} region Region to check
 * @returns {boolean} true if region is valid
 */
export const validRegion = (region) => region === null || typeof regions[region] === 'string';

/**
 * Get the type of extension expected for a given region
 * @param region
 * @returns {string} type of paylaod expected for region
 */
export const regionType = (region) => regionTypes[region];


export default regions;