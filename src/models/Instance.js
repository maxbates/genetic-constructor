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
import { assign, cloneDeep, merge, mergeWith } from 'lodash';

import InstanceSchema from '../schemas/Instance';
import ParentSchema from '../schemas/Parent';
import Immutable from './Immutable';

/**
 * Instances are immutable objects, which conform to a schema, and provide an explicit API for modifying their data.
 * Instances have an ID, metadata, and are versioned (explicitly or implicitly by the Instance which owns them)
 * @name Instance
 * @class
 * @extends Immutable
 * @gc Model
 */
export default class Instance extends Immutable {
  /**
   * Create an instance
   * @constructor
   * @param {Object} input Input object
   * @param {Object} [subclassBase] If extending the class, additional fields to use in the scaffold
   * @param {Object} [frozen=true] Additional fields, beyond the scaffold
   * @returns {Instance} An instance, frozen if not in production
   */
  constructor(input = {}, subclassBase, frozen) {
    invariant(typeof input === 'object', 'must pass an object (or leave undefined) to model constructor');

    //not sure why this is complaining...
    //eslint-disable-next-line constructor-super
    return super(merge(
      assign(InstanceSchema.scaffold(), subclassBase), //perf. NB - this is only valid so long as no overlapping fields (esp. nested ones)
      input,
    ), frozen);
  }

  /**
   * See {@link Immutable.mutate}
   * @method mutate
   * @memberOf Instance
   */
  mutate(path, value) {
    return super.mutate(path, value);
  }

  /**
   * See {@link Immutable.merge}
   * @method merge
   * @memberOf Instance
   */
  merge(obj) {
    return super.merge(obj);
  }

  /**
   * Clone an instance, with a new ID
   * parentInfo === null -> simply copy
   * parentInfo !== null, add the parent to the ancestry of the child Instance.
   * @method clone
   * @memberOf Instance
   * @param {object|null} [parentInfo={}] Parent info for denoting ancestry. If pass null to parentInfo, the instance is simply cloned, and nothing is added to the history.
   * @param {Object} [overwrites={}] object to merge into the cloned Instance
   * @throws if version is invalid (not provided and no field version on the instance)
   * @returns {Instance}
   */
  clone(parentInfo = {}, overwrites = {}) {
    const cloned = cloneDeep(this);
    let clone;

    if (parentInfo === null) {
      clone = mergeWith(cloned, overwrites, mergeCustomizer);
    } else {
      const parentObject = Object.assign({
        id: cloned.id,
        owner: cloned.owner,
        version: cloned.version,
        created: Date.now(),
      }, parentInfo);

      //throw if invalid parent
      ParentSchema.validate(parentObject, true);

      const parents = [parentObject, ...cloned.parents];

      //unclear why, but merging parents was not overwriting the clone, so shallow assign parents specifically
      clone = mergeWith(cloned, overwrites, { parents }, mergeCustomizer);
    }

    //unset the ID, so we make it fresh
    delete clone.id;

    return new this.constructor(clone);
  }
}

function mergeCustomizer(objValue, srcValue) {
  if (srcValue instanceof Array) {
    return srcValue;
  }
}
