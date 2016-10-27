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
import rollupFromArray from '../../../../src/utils/rollup/rollupFromArray';
import { createExampleRollup } from '../../../_utils/rollup';
import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';

//todo - prefer rollup creation utils instead of manually creating

import * as projectPersistence from '../../../../server/data/persistence/projects';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', function persistenceTests() {
      describe.only('projects', () => {
        const roll = createExampleRollup();
        const projectId = roll.project.id;

        //hack - patch for tests, author is forced when written
        roll.project.metadata.authors = [testUserId];

        it('projectWrite() -> projectGet() works', () => {
          const roll = createExampleRollup();

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(() => projectPersistence.projectGet(roll.project.id))
            .then(result => {
              expect(result).to.eql(roll);
            });
        });

        it('projectExists() rejects if doesnt exist', () => {
          return projectPersistence.projectExists(Project.classless().id)
            .then(() => new Error('shouldnt resolve'))
            .catch((err) => {
              expect(err).to.equal(errorDoesNotExist);
            });
        });

        it('projectWrite() creates a project if needed', () => {
          return projectPersistence.projectWrite(projectId, roll, testUserId);
        });

        it('projectWrite() receives version + roll', () => {
          const roll = createExampleRollup();

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(result => {
              expect(result.version).to.equal(0);
              expect(result.id).to.equal(roll.project.id);
              expect(result.data).to.eql(roll);
              expect(result.owner).to.equal(testUserId);
            });
        });

        it('projectWrite() throws if you dont provide project + blocks', () => {
          return expect(() => projectPersistence.projectWrite(projectId, { project: 'data' }, testUserId))
            .to.throw();
        });

        it('projectWrite() validates the project', () => {
          return projectPersistence.projectWrite(projectId, { project: {}, blocks: {} }, testUserId)
            .then(() => assert(false, 'shouldnt happen'))
            .catch(err => expect(err).to.equal(errorInvalidModel));
        });

        it('projectExists() resolves if it does exist', () => {
          return projectPersistence.projectExists(projectId)
            .then(res => {
              expect(res).to.equal(true);
            });
        });

        it('projectGet() retrieves the project', () => {
          return projectPersistence.projectGet(projectId)
            .then(res => {
              expect(res).to.eql(roll);
            });
        });

        it('projectWrite() updates a project', () => {
          return projectPersistence.projectWrite(projectId, roll, testUserId);
        });

        it('projectMerge() forces the ID', () => {
          const roll = createExampleRollup();
          roll.project.metadata.authors = [testUserId]; //hack - patch for tests, author is forced when written
          const overwrite = { project: { id: uuid.v4(), some: 'field ' } };
          const merged = _.merge({}, roll, overwrite, { project: { id: roll.project.id } });

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(() => projectPersistence.projectGet(roll.project.id))
            .then(result => expect(result).to.eql(roll))
            .then(() => projectPersistence.projectMerge(roll.project.id, overwrite, testUserId))
            .then(() => projectPersistence.projectGet(roll.project.id))
            .then(result => expect(result).to.eql(merged));
        });

        it('projectDelete() deletes a project');

        describe('manifest', () => {
          it('projectGetManifest() gets manifest');
          it('projectWriteManifest() writes manifest');
          it('projectMergeManifest() merges manifest');
        });

        describe('blocks', () => {
          it('blocksWrite() validates the block');
          it('blocksWrite() forces projectId');
          it('blocksWrite() adds blocks to roll');
          it('blocksWrite() overwrites blocks');
          it('blocksMerge() merges blocks');
          it('blockDelete() deletes a block');
        });
      });
    });
  });
});
