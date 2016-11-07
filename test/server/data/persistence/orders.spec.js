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
import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import Order from '../../../../src/models/Order';

import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as orderPersistence from '../../../../server/data/persistence/orders';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('orders', () => {

        //const order = new Order();

        it('orderList() returns 404 when no orders', (done) => {
          orderPersistence.orderList(Project.classless().id)
            .then((results) => done('shouldnt resolve'))
            .catch(err => {
              expect(err).to.equal(errorDoesNotExist);
              done();
            });
        });

        it('orderWrite() write makes an order', () => {
          return orderPersistence.orderWrite(testUserId, )
        });

        it('orderGet() gets an order');

        it('orderExists() resolves when an order exists');

        it('orderList() lists orders which exist for a project');
        it('orderList() lists orders only for given project');

        it('orderExists() resolves for order which exists');
        it('orderExists() rejects on non existent order');

        it('orderDelete() is impossible');

        it('projectDelete() should remove orders');
      });
    });
  });
});
