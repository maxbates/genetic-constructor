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
import path from 'path';
import uuid from 'node-uuid';
import merge from 'lodash.merge';
import { updateProjectWithTestAuthor } from '../../../_utils/userUtils';
import md5 from 'md5';
import { testUserId } from '../../../constants';
import rollupFromArray from '../../../../src/utils/rollup/rollupFromArray';
import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';

import * as projectPersistence from '../../../../server/data/persistence/projects';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', function persistenceTests() {
      describe.only('projects', () => {
        const projectName = 'persistenceProject';
        const projectData = Project.classless(updateProjectWithTestAuthor({ metadata: { name: projectName } }));
        const projectId = projectData.id;

        const blockName = 'blockA';
        const blockData = Block.classless({ projectId, metadata: { name: blockName } });
        const blockId = blockData.id;

        const roll = rollupFromArray(projectData, blockData);

        const blockName2 = 'new name';
        const blockData2 = Block.classless({ projectId, metadata: { name: blockName2 } });
        const blockId2 = blockData2.id;

        const roll2 = rollupFromArray(projectData, blockData2);

        it('projectWrite() -> projectGet() works', () => {
          const project = Project.classless(updateProjectWithTestAuthor({ metadata: { name: 'some name' } }));
          const block = Block.classless({ projectId, metadata: { name: blockName } });
          const roll = rollupFromArray(project, block);

          return projectPersistence.projectWrite(project.id, roll, testUserId)
            .then(() => projectPersistence.projectGet(project.id))
            .then(result => {
              expect(result).to.eql(roll);
            });
        });

        it('projectExists() rejects if doesnt exist', (done) => {
          projectPersistence.projectExists(Project.classless().id)
            .then(() => done(new Error('shouldnt resolve')))
            .catch(() => done());
        });

        it('projectWrite() creates a project if needed', () => {
          return projectPersistence.projectWrite(projectId, roll, testUserId);
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

        it('projectWrite() receives version + roll');

        //todo - so many more...
      });
    });
  });
});
