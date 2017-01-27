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

import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';

import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as snapshots from '../../../../server/data/persistence/snapshots';
import * as commons from '../../../../server/data/persistence/commons';

//Note - more complicated flow is tested in test/middleware/commons.js, since get more coverage

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('commons', () => {
        before(() => {
          throw new Error('write suite');
        });

        it('publishing a specific project + version, returns a snapshot, which is public');
        it('can query public snapshots');
        it('can query for public snapshots by projectId');
        it('can retrieve versions of a published project');
        it('can retrieve a locked project');
        it('can unpublish a version, doesnt delete snapshot');
        it('can unpublish a whole project');
      });
    });
  });
});
