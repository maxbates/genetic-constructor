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
import { expect, assert } from 'chai';
import { merge, isEqual } from 'lodash';
import Snapshot from '../../src/models/Snapshot';
import { testUserId } from '../constants';

import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';
import * as snapshots from '../../server/data/persistence/snapshots';

describe('Model', () => {
  describe('Snapshot', () => {

    let model;

    it('requires an input', () => {
      expect(() => new Snapshot()).throw();
      expect(() => new Snapshot({})).throw();
    });

    it('works after snapshotting', async () => {
      const roll = createExampleRollup();

      await projectPersistence.projectWrite(roll.project.id, roll, testUserId);

      const snapshotBody = { message: 'Some message', tags: { something: 'cool' }, keywords: ['words'] };
      const snapshot = await snapshots.snapshotWrite(roll.project.id, testUserId, 0, snapshotBody);

      model = new Snapshot(snapshot);
    });

    it('model has methods isPublished(), getNamedType(), getTime()', () => {
      model.isPublished();
      model.getNamedType();
      model.getTime();
    });
  });
});
