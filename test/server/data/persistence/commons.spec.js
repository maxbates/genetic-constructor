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
import _ from 'lodash';
import { testUserId } from '../../../constants';
import { createExampleRollup } from '../../../_utils/rollup';

import {
  errorNotPublished,
  errorDoesNotExist,
} from '../../../../server/errors/errorConstants';

import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as snapshots from '../../../../server/data/persistence/snapshots';
import * as commons from '../../../../server/data/persistence/commons';

//Note - more complicated flow is tested in test/middleware/commons.js, since get more coverage

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('commons', () => {
        const keywords = ['something'];
        const publicTag = { [commons.COMMONS_TAG]: true };
        const makeTag = (isPublic, index) => {
          const base = { indexTag: index, customTag: 'custom' };
          if (isPublic) {
            Object.assign(base, publicTag);
          }
          return base;
        };

        //first set of projects, written ahead of tests
        //create a bunch of project snapshots, some public some not
        const snapsPublic = [false, false, true, false, false, false, true, false];
        const numberPublished = snapsPublic.reduce((acc, isPublic) => isPublic ? acc + 1 : acc, 0);
        const lastPublishedIndex = snapsPublic.lastIndexOf(true);
        const rolls = snapsPublic.map((isPublic, index) => _.merge(createExampleRollup(), {
          project: {
            version: index,
            metadata: { name: `version ${index}` },
          },
        }));
        const projectId = rolls[0].project.id;
        let allSnapshots;

        before(async () => {
          //write rolls in order
          await _.reduce(
            rolls,
            (acc, roll) => acc.then(() => projectPersistence.projectWrite(projectId, roll, testUserId)),
            Promise.resolve(),
          );

          //write all the snapshots, any order
          allSnapshots = await Promise.all(
            snapsPublic.map((isPublic, index) => snapshots.snapshotWrite(
              projectId,
              testUserId,
              index,
              { message: `Snapshot ${index}`, tags: makeTag(isPublic, index), keywords },
              isPublic ? commons.SNAPSHOT_TYPE_PUBLISH : undefined,
            )),
          );
        });

        it('can check if a project is public', async () => {
          const snap = await commons.checkProjectPublic(projectId);
          assert(snap, 'should get a snapshot');
          assert(snap.projectId === projectId, 'should have snapshot fields');
        });

        it('can check if a version is public', async () => {
          const snap = await commons.checkProjectPublic(projectId, lastPublishedIndex);
          assert(snap, 'should get a snapshot');
        });

        it('check project version, if not published error properly', async () => {
          const firstUnpublished = snapsPublic.indexOf(false);

          try {
            await commons.checkProjectPublic(projectId, firstUnpublished);
            assert(false, 'shouldnt get here');
          } catch (err) {
            expect(err).to.equal(errorNotPublished);
          }
        });

        it('check project version, if does not exist error properly', async () => {
          try {
            //this version doesnt exist
            await commons.checkProjectPublic(projectId, snapsPublic.length);
            assert(false, 'shouldnt get here');
          } catch (err) {
            expect(err).to.equal(errorDoesNotExist);
          }
        });

        it('can get all published snapshots for a project', async () => {
          const published = await commons.commonsRetrieveVersions(projectId);

          expect(published.length).to.equal(numberPublished);
          expect(_.sortBy(published, 'version')).to.eql(_.sortBy(allSnapshots.filter(snap => snap.tags[commons.COMMONS_TAG]), 'version'));

          expect(published[0].snapshotUUID).to.be.defined;
          expect(published[0].projectUUID).to.be.defined;
          expect(published[0].projectId).to.be.defined;
          expect(published[0].version).to.be.defined;
        });

        it('can query public snapshot by tag, returning latest per project by default', async () => {
          const query = await commons.commonsQuery({ customTag: 'custom' });

          expect(query.length).to.equal(1);
          expect(query[0]).to.eql(allSnapshots[lastPublishedIndex]);
        });

        it('can query, without collapsing to one per project', async () => {
          const query = await commons.commonsQuery({ customTag: 'custom' }, false);

          expect(query.length).to.equal(numberPublished);
        });

        it('can retrieve a locked project, default to latest', async () => {
          const published = await commons.commonsRetrieve(projectId);

          assert(published && published.blocks && published.project, 'shoudl get roll');
          assert(published.project.version === lastPublishedIndex, 'should have latest version');
          assert(published.project.rules.frozen, 'should be frozen');
          assert(_.every(published.blocks, block => block.rules.frozen), 'all blocks should be frozen');
        });

        it('can retrieve versions of a published project', async () => {
          const targetVersion = snapsPublic.indexOf(true);

          const published = await commons.commonsRetrieve(projectId, targetVersion);

          assert(published && published.blocks && published.project, 'shoudl get roll');
          assert(published.project.version === targetVersion, 'should have latest version');
        });

        it('publishing at un-snapshotted version returns a snapshot which is public with proper snapshot type', async () => {
          const newestProject = _.merge({}, _.last(rolls), { project: { metadata: { field: 'yay' } } });
          const newestWrite = await projectPersistence.projectWrite(projectId, newestProject, testUserId);
          const versionToPub = newestWrite.version;

          const body = { message: 'Some message', tags: { myTag: 'yay' } };
          const snapshot = await commons.commonsPublishVersion(projectId, testUserId, versionToPub, body);

          assert(snapshot && snapshot.snapshotUUID, 'should get snapshot');
          assert(snapshot.version === versionToPub, 'shoudl be version passed in');
          assert(snapshot.type === commons.SNAPSHOT_TYPE_PUBLISH, 'should have explicit snapshot type for publishing');

          const retrieved = await commons.commonsRetrieve(projectId, versionToPub);
          assert(retrieved && retrieved.project && retrieved.blocks, 'should get project');
        });

        it('can publish an existing snapshot, doesnt change type', async () => {
          const versionToPub = snapsPublic.indexOf(false);

          const body = { message: 'Some message', tags: { myTag: 'yay' } };
          const snapshot = await commons.commonsPublishVersion(projectId, testUserId, versionToPub, body);

          assert(snapshot && snapshot.snapshotUUID, 'should get snapshot');
          assert(snapshot.version === versionToPub, 'shoudl be version passed in');
          assert(snapshot.type !== commons.SNAPSHOT_TYPE_PUBLISH, 'should not have publishing type, since was already snapshotted');

          const retrieved = await commons.commonsRetrieve(projectId, versionToPub);
          assert(retrieved && retrieved.project && retrieved.blocks, 'should get project');
        });

        //todo (when expose route)
        it('can publish a rollup directly');

        it('can unpublish a version, doesnt delete snapshot', async () => {
          const versionToUnpub = snapsPublic.indexOf(true);

          await commons.commonsUnpublish(projectId, testUserId, versionToUnpub);

          try {
            await commons.checkProjectPublic(projectId, versionToUnpub);
            assert(false, 'shouldnt get here');
          } catch (err) {
            expect(err).to.equal(errorNotPublished);
          }

          const snap = await snapshots.snapshotGet(projectId, versionToUnpub);
          assert(snap && snap.snapshotUUID, 'should still get a snapshot');
        });

        it('can unpublish a whole project', async () => {
          //we add some through the suite
          const initialSnaps = await snapshots.snapshotList(projectId);
          await commons.commonsUnpublish(projectId, testUserId);

          try {
            await commons.checkProjectPublic(projectId);
            assert(false, 'shouldnt get here');
          } catch (err) {
            expect(err).to.equal(errorNotPublished);
          }

          const snaps = await snapshots.snapshotList(projectId);

          assert(snaps.length === initialSnaps.length, 'all snapshots should still be there');
        });
      });
    });
  });
});
