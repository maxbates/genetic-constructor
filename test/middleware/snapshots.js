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

import * as api from '../../src/middleware/snapshots';
import * as snapshots from '../../server/data/persistence/snapshots';
import * as projectPersistence from '../../server/data/persistence/projects';
import { testUserId } from '../constants';
import { createExampleRollup } from '../_utils/rollup';

describe('Middleware', () => {
  describe('Snapshots', () => {
    const roll = createExampleRollup();
    const updated = _.merge({}, roll, { project: { blah: 'blah' } });
    const latest = _.merge({}, updated, { project: { another: 'field' } });

    const testTags = { mytag: 'value' };
    const testKeywords = [uuid.v4()];

    const project = roll.project;
    const projectId = project.id;

    before(() => projectPersistence.projectWrite(projectId, roll, testUserId)
    .then(() => projectPersistence.projectWrite(projectId, updated, testUserId))
    .then(() => projectPersistence.projectWrite(projectId, latest, testUserId)));

    it('snapshotList() before projects exists gets 404', (done) => {
      api.snapshotList(createExampleRollup().project.id)
      .then(result => {
        done('shouldnt resolve');
      })
      .catch(resp => {
        expect(resp.status).to.equal(404);
        done();
      })
      .catch(done);
    });

    it('snapshotList() on project with no snapshots gets 200', () => {
      return api.snapshotList(projectId)
      .then(versions => {
        expect(versions.length).to.equal(0);
      });
    });

    const version = 1;

    it('shapshot() a specific version', () => {
      return api.snapshot(projectId, version)
      .then(() => api.snapshotList(projectId))
      .then(snapshots => {
        const found = snapshots.find(snapshot => snapshot.version === version);
        assert(found, 'expected a snapshot with version specified');
      });
    });

    it('snapshot() overwrites a snapshot at specific version', () => {
      const newMessage = 'some new message';
      return api.snapshot(projectId, version, { message: newMessage })
      .then(() => api.snapshotGet(projectId, version))
      .then(snapshot => {
        expect(snapshot.message).to.equal(newMessage);
      });
    });

    const commitMessage = 'my fancy message';

    it('snapshotWrite() creates a snapshot, returns version, time, message, defaults to latest', () => {
      return api.snapshot(projectId, null, { message: commitMessage, tags: testTags, keywords: testKeywords })
      .then(info => {
        assert(info.version === 2, 'should be version 2 (latest)');
        assert(info.message === commitMessage, 'should have commit message');
        assert(Number.isInteger(info.time), 'time should be number');
      });
    });

    it('snapshotGet() gets a snapshot', () => {
      return api.snapshotGet(projectId, 2)
      .then(snapshot => {
        expect(snapshot.version).to.equal(2);
        expect(snapshot.message).to.equal(commitMessage);
      });
    });

    it('snapshotWrite() given rollup bumps verion and creates a snapshot', () => {
      const newest = _.merge({}, roll, { project: { some: 'final' } });

      return api.snapshot(projectId, null, {}, newest)
      .then(info => {
        assert(info.version === 3, 'should be version 3 (new latest)');
      });
    });

    it('snapshotList() gets the projects snapshots', () => {
      return api.snapshotList(projectId)
      .then(snapshots => {
        assert(Array.isArray(snapshots), 'should be array');
        expect(snapshots.length).to.equal(3);
      });
    });

    it('cant snapshot a version which doesnt exist', (done) => {
      api.snapshot(projectId, 99)
      .then(info => {
        done('shouldnt resolve');
      })
      .catch(err => {
        done();
      });
    });

    it('can list keywords for a bunch of snapshots', async () => {
      const map = await api.snapshotsListKeywords();

      expect(typeof map).to.equal('object');
      assert(_.every(testKeywords, word => map[word] >= 1), 'keywords should be present');
    });

    it('snapshotQuery() can search by keywords', () => { throw Error('todo'); });

    it('snapshotQuery() can search by tags', () => { throw Error('todo'); });

    it('snapshotUpdateVersion() updates info about an existing version', async () => {
      let roll = createExampleRollup();
      const writeResult = await projectPersistence.projectWrite(roll.project.id, roll, testUserId);
      roll = writeResult.data;

      const snap = await api.snapshot(roll.project.id, writeResult.version);

      const update1 = { message: uuid.v4(), tags: { fancyTag: 'yassss' } };

      const snapUpdate1 = await api.snapshotUpdate(roll.project.id, writeResult.version, update1);

      expect(snapUpdate1.tags).to.eql(update1.tags);
      expect(snapUpdate1.message).to.eql(update1.message);
      expect(snapUpdate1.keywords).to.eql([]);              //test for default

      const update2 = { message: uuid.v4(), keywords: [uuid.v4(), uuid.v4()], tags: {} };
      const snapUpdate2 = await api.snapshotUpdate(roll.project.id, writeResult.version, update2);

      expect(snapUpdate2.message).to.eql(update2.message);
      expect(snapUpdate2.keywords).to.eql(update2.keywords);
      expect(snapUpdate2.tags).to.eql(update1.tags);            //tags should merge
    });

    describe('permissions', () => {
      const otherUser = uuid.v1();
      const otherRoll = createExampleRollup();

      before(async () => {
        await projectPersistence.projectWrite(otherRoll.project.id, otherRoll, otherUser);
        await snapshots.snapshotWrite(otherRoll.project.id, otherUser, 0);
      });

      it('snapshotGet() returns 403 when dont have access to the snapshot', async() => {
        try {
          await api.snapshotGet(otherRoll.project.id, 0);
          assert(false, 'should not have retreived');
        } catch (resp) {
          assert(resp.status === 403, 'should get a 403');
        }
      });

      it('snapshotList() only queries snapshots you have access to', async () => {
        try {
          await api.snapshotList(otherRoll.project.id);
          assert(false, 'should not have queries');
        } catch (resp) {
          assert(resp.status === 403, 'should get a 403');
        }
      });

      it('snapshotWrite() fails when dont have access to project', async () => {
        try {
          await api.snapshot(otherRoll.project.id);
          assert(false, 'should not have written');
        } catch (resp) {
          assert(resp.status === 403, 'should get a 403');
        }
      });

      it('snapshotQuery() limits to a user', () => { throw Error('todo'); });
    });
  });
});
