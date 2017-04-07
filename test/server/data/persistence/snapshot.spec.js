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
import uuid from 'node-uuid';
import _ from 'lodash';
import { updateProjectWithTestAuthor } from '../../../_utils/userUtils';
import { testUserId } from '../../../constants';
import { createExampleRollup } from '../../../_utils/rollup';

import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/errors/errorConstants';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import Rollup from '../../../../src/models/Rollup';

import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as projectVersions from '../../../../server/data/persistence/projectVersions';
import * as snapshots from '../../../../server/data/persistence/snapshots';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('snapshot', () => {
        const projectName = uuid.v4()

        const roll = createExampleRollup();
        roll.project.metadata.name = projectName;

        const updated = _.merge({}, roll, { project: { another: 'field' } });
        const latest = _.merge({}, updated, { project: { different: 'value' } });
        const otherProject = createExampleRollup();
        let otherSnapshot;

        const exampleTag = { some: ' tag' };
        const exampleKeywords = ['special phrase', 'e coli'];

        before(async() => {
          await projectPersistence.projectWrite(roll.project.id, roll, testUserId);
          await projectPersistence.projectWrite(roll.project.id, updated, testUserId);
          await projectPersistence.projectWrite(roll.project.id, latest, testUserId);
          await projectPersistence.projectWrite(otherProject.project.id, otherProject, testUserId);

          const snapshotBody = { message: 'Some message', tags: exampleTag, keywords: exampleKeywords };
          otherSnapshot = await snapshots.snapshotWrite(otherProject.project.id, testUserId, 0, snapshotBody);
        });

        it('snapshotExists() returns 404 when does not exist', () => {
          return snapshots.snapshotExists(roll.project.id, 1012)
          .then(() => Promise.reject('shouldnt exist'))
          .catch(err => {
            expect(err).to.equal(errorDoesNotExist);
          });
        });

        it('snapshotList() returns 404 when no snapshots', () => {
          return snapshots.snapshotList(roll.project.id)
          .then(() => Promise.reject('shouldnt exist'))
          .catch(err => {
            expect(err).to.equal(errorDoesNotExist);
          });
        });

        it('snapshotMerge() throws when snapshot does not exist', () => {
          return snapshots.snapshotMerge(roll.project.id, testUserId, 0, { message: 'new message' })
          .then(() => Promise.reject('shouldnt exist'))
          .catch(err => {
            expect(err).to.equal(errorDoesNotExist);
          });
        });

        it('snapshotWrite() works on version 0, returns type, message, tags, created, version', () => {
          return snapshots.snapshotWrite(roll.project.id, testUserId, 0)
          .then(result => {
            expect(result.version).to.equal(0);
            expect(result.projectId).to.equal(roll.project.id);
            expect(result.message).to.equal(snapshots.defaultMessage);
            assert(result.tags.author, 'author should exist');
            expect(result.tags.projectName).to.equal(projectName);
            expect(result.owner).to.equal(testUserId);
            expect(Number.isInteger(result.created)).to.equal(true);
          });
        });

        it('snapshotExists() returns UUID of latest snapshot', () => {
          return snapshots.snapshotExists(roll.project.id, 0)
          .then(snapshotUUID => {
            expect(snapshotUUID).to.be.defined;
          });
        });

        it('snapshotGet() should be able to get a specific snapshot', () => {
          return snapshots.snapshotGet(roll.project.id, 0)
          .then(result => {
            expect(result.snapshotUUID).to.be.defined;
            expect(result.projectUUID).to.be.defined;
            expect(result.version).to.equal(0);
            expect(result.projectId).to.equal(roll.project.id);
            expect(result.message).to.equal(snapshots.defaultMessage);
            assert(result.tags.author, 'author should exist');
            assert(result.tags.projectName, 'projectName should exist');
            expect(result.owner).to.equal(testUserId);
          });
        });

        it('snapshotWrite() can take any version, takes a message, tags, type', () => {
          const message = 'my snapshot message';
          const type = 'SOME TYPE';
          const version = 1;

          const body = { message, tags: exampleTag, keywords: exampleKeywords };
          return snapshots.snapshotWrite(roll.project.id, testUserId, version, body, type)
          .then(result => {
            expect(result.version).to.equal(version);
            expect(result.projectId).to.equal(roll.project.id);
            expect(result.message).to.equal(message);
            assert(_.isMatch(result.tags, exampleTag), 'tags should be present');
            expect(result.keywords).to.eql(exampleKeywords);
            expect(result.owner).to.equal(testUserId);
            expect(result.type).to.equal(type);
          });
        });

        it('snapshotWrite() the current version by default', () => {
          return snapshots.snapshotWrite(roll.project.id, testUserId)
          .then(result => {
            expect(result.version).to.equal(2);
          });
        });

        it('snapshotList() returns all the snapshots for a project', () => {
          return snapshots.snapshotList(roll.project.id)
          .then(results => {
            assert(results.length === 3, 'should have 3 snapshots');
            assert(results.every(result => {
              return Number.isInteger(result.version) && Number.isInteger(result.created) && !!result.message;
            }), 'invalid format for snapshots');
          });
        });

        it('snapshotList() -> projectVersions.projectVersionsByUUID gets projects', async () => {
          const snaps = await snapshots.snapshotList(roll.project.id);
          const UUIDs = snaps.map(snap => snap.projectUUID);
          const projects = await projectVersions.projectVersionsByUUID(UUIDs);

          expect(projects.length).to.equal(3);
          assert(projects.every(project => Rollup.validate(project, false)), 'invalid project returned');
        });

        it('snapshotQuery() queries by tags', async() => {
          try {
            const results = await snapshots.snapshotQuery({ tags: exampleTag });
            const projects = _.uniq(_.map(results, 'projectId'));

            expect(projects.length).to.equal(2);
            assert(results.length === 2, 'should have 2 snapshot with tag');
            expect(results.find(result => result.projectId === roll.project.id).version).to.equal(1);
          } catch (err) {
            throw err;
          }
        });

        it('snapshotQuery() can limit to a project', () => {
          return snapshots.snapshotQuery({ tags: exampleTag }, roll.project.id)
          .then(results => {
            assert(results.length === 1, 'should have 1 snapshot with tag');
            expect(results[0].version).to.equal(1);
          });
        });

        it('snapshotMerge() updates a snapshot', async() => {
          const newMessage = 'Some new message';

          const initial = await snapshots.snapshotGet(otherSnapshot.projectId, otherSnapshot.version);

          const updated = await snapshots.snapshotMerge(
            otherSnapshot.projectId,
            otherSnapshot.owner,
            otherSnapshot.version,
            { message: newMessage },
          );

          expect(updated.version).to.equal(initial.version);
          expect(updated.message).to.equal(newMessage);
          expect(updated.type).to.equal(initial.type);
          assert(_.isMatch(updated.tags, initial.tags), 'tags should be present');
          expect(updated.uuid).to.equal(initial.uuid);

          const retrieved = await snapshots.snapshotGet(otherSnapshot.projectId, otherSnapshot.version);

          expect(retrieved.version).to.equal(initial.version);
          expect(retrieved.message).to.equal(newMessage);
          expect(retrieved.type).to.equal(initial.type);
          assert(_.isMatch(retrieved.tags, initial.tags), 'tags should be present');
          expect(retrieved.uuid).to.equal(initial.uuid);
        });

        it('snapshotDelete() with version removes a single snapshot', async() => {
          await snapshots.snapshotDelete(otherSnapshot.projectId, otherSnapshot.version);

          return snapshots.snapshotExists(otherSnapshot.projectId, otherSnapshot.version)
          .then(() => Promise.reject('shouldnt exist'))
          .catch(err => {
            expect(err).to.equal(errorDoesNotExist);
          });
        });

        it('snapshotDelete() requires a version', () => {
          expect(() => snapshots.snapshotDelete(otherProject.project.id)).to.throw();
        });

        it('projectDelete() deletes all snapshots', (done) => {
          projectPersistence.projectDelete(roll.project.id, testUserId)
          .then(() => snapshots.snapshotList(roll.project.id))
          .then(results => {
            //console.log(results);
            done(new Error('project shouldnt exist'));
          })
          .catch(err => {
            //console.log(err);
            done();
          });
        });

        describe('keywords', () => {
          it('can list keywords without parameters', async() => {
            const map = await snapshots.snapshotGetKeywordMap();
            expect(typeof map).to.equal('object');
            assert(_.every(exampleKeywords, keyword => map[keyword] > 0), 'keywords should be present in map');
          });

          it('can filter by projectId');
          it('can filter by tags');
        });
      });
    });
  });
});
