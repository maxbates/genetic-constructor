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
import * as snapshotApi from '../../src/middleware/snapshots';
import * as commons from '../../server/data/persistence/commons';
import * as commonsConstants from '../../server/data/util/commons';
import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';
import * as snapshots from '../../server/data/persistence/snapshots';
import { testUserId } from '../constants';
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';
import Rollup from '../../src/models/Rollup';

describe('middleware', () => {
  describe('commons', () => {
    const keywords = [ uuid.v4(), uuid.v4() ];
    const publicTag = { [commonsConstants.COMMONS_TAG]: true };

    const baseTag = { someCustomTag: 'my value' };
    const makeTag = (isPublic) => {
      if (isPublic) {
        return Object.assign({}, baseTag, publicTag);
      }
      return baseTag;
    };

    const updateRollupName = (roll) => _.merge(roll, {
      project: {
        metadata: {
          name: uuid.v4(),
        },
      },
    });


    //roll for another user, to check permissions
    const otherUserId = uuid.v1();
    let rollOtherPublic = createExampleRollup();
    let snapshotOtherPublic = null;

    //for the test user, a private roll, and a published roll with multiple versions
    let rollPrivate = createExampleRollup();
    let rollPrivateSnapshotted = createExampleRollup();
    let rollPublic1 = createExampleRollup();
    let rollPublic2 = updateRollupName(rollPublic1);
    let snapshotPrivate = null;
    let snapshotPublic1 = null;
    let snapshotPublic2 = null;

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
        { message: 'Another users snapshot!', tags: makeTag(true), keywords },
        commonsConstants.SNAPSHOT_TYPE_PUBLISH,
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
        { tags: makeTag(true), keywords },
      );

      snapshotPublic2 = await snapshots.snapshotWrite(
        rollPublic2.project.id,
        testUserId,
        rollPublic2.project.version,
        { message: 'Some message', tags: makeTag(true), keywords },
        commonsConstants.SNAPSHOT_TYPE_PUBLISH,
      );
    });

    it('commonsRetrieve() should fail on private project', (done) => {
      api.commonsRetrieve(rollPrivate.project.id, rollPrivate.project.version)
      .then(result => done('shouldnt work'))
      .catch(resp => {
        expect(resp.status).to.equal(404);
        done();
      })
      .catch(done);
    });

    it('commonsRetrieve() should work on YOUR published project @ version', async () => {
      const ret = await api.commonsRetrieve(snapshotPublic1.projectId, snapshotPublic1.version);
      assert(ret && ret.project && ret.blocks, 'should get rollup');
    });

    it('commonsRetrieve() should work on OTHER published project @ version', async () => {
      const ret = await api.commonsRetrieve(snapshotOtherPublic.projectId, snapshotOtherPublic.version);
      assert(ret && ret.project && ret.blocks, 'should get rollup');
    });

    it('commonsRetrieve() retrieves the latest published version', async () => {
      const ret = await api.commonsRetrieve(rollPublic1.project.id);

      assert(ret && ret.project && ret.blocks, 'should get rollup');
      expect(ret.project.version).to.equal(1);
    });

    it('commonsRetrieve() retrieves a locked project', async () => {
      const ret = await api.commonsRetrieve(rollPublic1.project.id);

      assert(ret.project.rules.frozen, 'project should be frozen');
      assert(_.every(ret.blocks, block => block.rules.frozen), 'blocks should be frozen');
    });

    it('commonsQuery() should query published projects, ignore private projects', async () => {
      const query = await api.commonsQuery();

      assert(Array.isArray(query), 'expect array');
      assert(!_.some(query, result => result.projectId === rollPrivate.project.id), 'should not find private project');

      assert(_.every(query, result => result.tags[commonsConstants.COMMONS_TAG]), 'should all be public');

      //make sure one is there
      const found = query.find(result => result.projectId === rollPublic1.project.id);
      assert(found, 'should find published project');
      expect(found.version).to.equal(1); //should get latest
    });

    it('commonsQuery() only gets latest per project', async () => {
      const query = await api.commonsQuery();

      const uniqueByProject = _.uniqBy(query, 'projectId');
      expect(uniqueByProject.length).to.equal(query.length);
    });

    it('commonsQuery() can search by tags', async () => {
      const query = await api.commonsQuery({ tags: baseTag });

      assert(query.length > 0, 'should find things by tag');
    });

    it('commonsQuery() can search by keywords', async () => {
      const query = await api.commonsQuery({ keywords: [keywords[0]] });

      assert(query.length > 0, 'should find things by tag');
    });

    //create in tests

    const newTag = { funNewTag: 'yay' };

    it('commonsPublishVersion() publishes an existing version, which was not snapshotted, return snapshot', async () => {
      let roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, testUserId);
      roll = writeResult.data;

      const snap = await api.commonsPublishVersion(roll.project.id, writeResult.version);

      expect(snap.version).to.equal(writeResult.version);
      expect(snap.tags[commonsConstants.COMMONS_TAG]).to.equal(true);

      const ret = await api.commonsRetrieve(rollPublic1.project.id, writeResult.version);
      assert(ret);
    });

    it('commonsPublishVersion() publishes an existing version, which was snapshotted, return snapshot', async () => {
      let roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, testUserId);
      roll = writeResult.data;

      const snap = await snapshots.snapshotWrite(roll.project.id, testUserId, writeResult.version);
      assert(!snap.tags[commonsConstants.COMMONS_TAG], 'shouldnt be published');

      const publishedSnap = await api.commonsPublishVersion(roll.project.id, writeResult.version);
      expect(publishedSnap.tags[commonsConstants.COMMONS_TAG]).to.equal(true);
    });

    it('commonsPublishVersion() allows custom tags', async () => {
      let roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, testUserId);
      roll = writeResult.data;

      const message = uuid.v4();
      const body = { message, tags: newTag };

      const snap = await api.commonsPublishVersion(roll.project.id, writeResult.version, body);
      expect(snap.tags[commonsConstants.COMMONS_TAG]).to.equal(true);
      expect(snap.tags).to.eql({ ...snap.tags, ...newTag });
      expect(snap.message).to.equal(message);
    });

    it('commonsPublishVersion() fails on another users project', async () => {
      let roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, otherUserId);
      roll = writeResult.data;

      try {
        await api.commonsPublishVersion(roll.project.id, writeResult.version);
        assert(false, 'should error');
      } catch (resp) {
        expect(resp.status).to.equal(403);
      }
    });

    it('snapshots.snapshotUpdateVersion() fails on another users published project', async () => {
      let roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, otherUserId);
      roll = writeResult.data;

      await commons.commonsPublishVersion(roll.project.id, otherUserId, writeResult.version);

      const update = { message: uuid.v4() };

      try {
        await snapshotApi.snapshotUpdate(roll.project.id, writeResult.version, update);
        assert(false, 'should not work');
      } catch (resp) {
        expect(resp.status).to.equal(403);
      }
    });

    it('commonsUnpublish() can unpublish a version, but not delete it', async () => {
      const roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, testUserId);

      const snap = await api.commonsPublishVersion(roll.project.id, writeResult.version);

      expect(snap.version).to.equal(writeResult.version);
      expect(snap.tags[commonsConstants.COMMONS_TAG]).to.equal(true);

      const unpub = await api.commonsUnpublish(roll.project.id, writeResult.version);

      expect(unpub.tags[commonsConstants.COMMONS_TAG]).to.equal(false);

      const ret = await snapshotApi.snapshotGet(roll.project.id, writeResult.version);

      console.log(ret);

      expect(ret.tags[commonsConstants.COMMONS_TAG]).to.equal(false);
    });

    it('commonsUnpublish() can unpublish whole project', async () => {
      await api.commonsUnpublish(rollPublic1.project.id);

      try {
        await api.commonsRetrieve(rollPublic1.project.id);
        assert(false, 'shouldnt be published');
      } catch (resp) {
        expect(resp.status).to.equal(404);
      }

      const ret = await snapshotApi.snapshotList(rollPublic1.project.id);
      assert(ret.length > 0, 'should still have snapshots');
    });
  });
});
