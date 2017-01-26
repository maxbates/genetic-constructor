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
import { assert, expect } from 'chai';
import uuid from 'uuid';
import _ from 'lodash';

import * as api from '../../src/middleware/commons';
import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';
import * as snapshots from '../../server/data/persistence/snapshots';
import { testUserId } from '../constants';
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';
import Rollup from '../../src/models/Rollup';

describe('middleware', () => {
  describe.only('commons', () => {
    //roll for another user, to check permissions
    const otherUserId = uuid.v1();
    let rollOtherPublic = createExampleRollup();
    let snapshotOtherPublic = null;

    //for the test user, a private roll, and a published roll with multiple versions
    let rollPrivate = createExampleRollup();
    let rollPrivateSnapshotted = createExampleRollup();
    let rollPublic1 = createExampleRollup();
    let rollPublic2 = _.merge(rollPublic1, {
      project: {
        metadata: {
          addition: 'field',
        },
      },
    });
    let snapshotPrivate = null;
    let snapshotPublic1 = null;
    let snapshotPublic2 = null;

    //todo - create in tests
    let rollPublic3;
    let snapshotPublic3;

    before(async () => {
      //write the projects
      rollOtherPublic = (await projectPersistence.projectWrite(rollOtherPublic.project.id, rollOtherPublic, otherUserId)).data;
      rollPrivate = (await projectPersistence.projectWrite(rollPrivate.project.id, rollPrivate, testUserId)).data;
      rollPrivateSnapshotted = (await projectPersistence.projectWrite(rollPrivateSnapshotted.project.id, rollPrivateSnapshotted, testUserId)).data;
      rollPublic1 = (await projectPersistence.projectWrite(rollPublic1.project.id, rollPublic1, testUserId)).data;
      rollPublic2 = (await projectPersistence.projectWrite(rollPublic2.project.id, rollPublic2, testUserId)).data;

      snapshotOtherPublic = await snapshots.snapshotWrite(
        rollOtherPublic.project.id,
        otherUserId,
        rollOtherPublic.project.version,
        'Another users snapshot!',
        { [snapshots.SNAPSHOT_TAG_PUBLIC]: true },
        snapshots.SNAPSHOT_TYPE_PUBLISH,
      );

      snapshotPrivate = await snapshots.snapshotWrite(
        rollPrivate.project.id,
        testUserId,
        rollPrivate.project.version,
      );

      snapshotPublic1 = await snapshots.snapshotWrite(
        rollPublic1.project.id,
        testUserId,
        rollPublic1.project.version,
        undefined,
        { [snapshots.SNAPSHOT_TAG_PUBLIC]: true },
      );

      snapshotPublic2 = await snapshots.snapshotWrite(
        rollPublic2.project.id,
        testUserId,
        rollPublic2.project.version,
        'Some message',
        { [snapshots.SNAPSHOT_TAG_PUBLIC]: true },
        snapshots.SNAPSHOT_TYPE_PUBLISH,
      );
    });

    it('commonsRetrieve() should fail on private project');
    it('commonsRetrieve() should work on published project');
    it('commonsRetrieve() retrieves the latest published version');

    it('commonsQuery() should query published projects, ignore private projects');

    it('commonsPublish() should create a snapshot at the newest version');

    it('commonsPublishVersion() publishes an existing version, which was not snapshotted');
    it('commonsPublishVersion() publishes an existing version, which was snapshotted');

    it('commonsUnpublish() should unpublish a snapshot, but not delete it');

    it('commonsPublishVersion() allows custom tags');
  });
});
