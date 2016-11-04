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

import { every, cloneDeep, isEqual } from 'lodash';
import invariant from 'invariant';
import Instance from './Instance';
import RollupSchema from '../schemas/Rollup';
import Project from '../models/Project';
import Block from '../models/Block';
import safeValidate from '../schemas/fields/safeValidate';

/**
 * Rollups contain a 'complete' project, and are what are sent between client and server
 *
 * Rollups take the form { project: {}, blocks: {} } and may include a field 'sequence' (see the schema
 *
 * @name Rollup
 * @class
 * @extends Instance
 * @gc Model
 */
export default class Rollup extends Instance {
  constructor(input) {
    super(input, RollupSchema.scaffold())
  }

  /**
   * Validate a Rollup object
   * @method validate
   * @memberOf Rollup
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @param {boolean} [light=false] deeply check project + blocks, true by default in NODE_ENV=test. If false, basic structure and IDs are valid. If true, validate everything.
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Rollup.validate(new Block()); //false
   * Rollup.validate(new Rollup()); //true
   */
  static validate(input, throwOnError, light) {
    return RollupSchema.validate(input, throwOnError, light);
  }

  /**
   * Compare two rollups' project and blocks
   * ignoring versioning information, e.g. see Project.compare()
   *
   * Note that this is expensive, especially for large rollups
   * @method compare
   * @memberOf Rollup
   * @static
   * @param {Rollup} one
   * @param {Rollup} two
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when not equal
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * const roll = new Rollup();
   * const other = Object.assign({}, roll);
   *
   * Rollup.compare(roll, other); //true
   * Rollup.compare(roll, new Rollup()); //false
   */
  static compare(one, two, throwOnError = false) {
    if ((typeof one === 'object') && (typeof two === 'object') && (one === two)) {
      return true;
    }

    try {
      invariant(one && two, 'must pass two rollups');

      //compare projects, throwing if error
      Project.compare(one.project, two.project, true);

      //compare blocks
      invariant(Object.keys(one.blocks).length === Object.keys(two.blocks).length, 'blocks are different number');
      invariant(every(one.blocks, (value, key) => {
        return value === two.blocks[key] || isEqual(value, two.blocks[key]);
      }), 'blocks do not match');
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }

  static fromArray(project, ...blocks) {
    return {
      project,
      blocks: blocks.reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {}),
    };
  }

}
