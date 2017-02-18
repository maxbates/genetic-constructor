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
import { assign, merge } from 'lodash';
import moment from 'moment';
import invariant from 'invariant';

import SnapshotSchema from '../schemas/Snapshot';
import Immutable from './Immutable';

import { SNAPSHOT_TYPE_PUBLISH, COMMONS_TAG } from '../../server/data/util/commons';

/**
 * Annotations mark regions of sequence with notes, colors, roles, etc.
 * Annotations are often used in imports due to the hierarchical nature of the Genetic Constructor data model. Blocks do not allow for overlaps, but many sequences have overlapping annotations. Annotations which do not overlap are used to create the Block hierarchy, while overlaps are converted into instances of the Annotation class.
 * @name Annotation
 * @class
 * @extends Immutable
 * @gc Model
 */
export default class Snapshot extends Immutable {
  /**
   * Create an annotation
   * @constructor
   * @param {Object} input Input object for the annotation to merge onto the scaffold
   * @param {boolean} frozen
   */
  constructor(input, frozen = true) {
    invariant(input, 'input is required to make a snapshot');
    SnapshotSchema.validate(input, true);
    super(input, {}, frozen);
  }

  /**
   * Validate a snapshot
   * @method validate
   * @memberOf Snapshot
   * @static
   * @param {Object} input Object to validate
   * @param {boolean} [throwOnError=false] Validation should throw on errors
   * @throws if you specify throwOnError
   * @returns {boolean} Whether input valid
   */
  static validate(input, throwOnError) {
    return SnapshotSchema.validate(input, throwOnError);
  }

  static isPublished(snapshot) {
    return snapshot.tags[COMMONS_TAG];
  }

  //todo - should use constants from snapshots. requires shared constants file without any imports (so can be used on client)
  static nameSnapshot(snapshot) {
    switch (snapshot.type) {
      case SNAPSHOT_TYPE_PUBLISH:
        return 'Published to Commons';
      case 'SNAPSHOT_ORDER': {
        const foundry = snapshot.tags.foundry;
        return `Order${foundry ? ` at ${foundry}` : ''}`;
      }
      case 'SNAPSHOT_USER':
      default:
        return 'Saved Snapshot';
    }
  }

  isPublished() {
    return Snapshot.isPublished(this);
  }

  getNamedType() {
    return Snapshot.nameSnapshot(this);
  }

  getTime(format = 'D MMM YYYY H:mm:s') {
    return moment(this.created).format('D MMM YYYY H:mm:s');
  }
}
