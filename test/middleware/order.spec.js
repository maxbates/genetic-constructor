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
import invariant from 'invariant';
import _ from 'lodash';
import { assert, expect } from 'chai';
import * as projectPersistence from '../../server/data/persistence/projects';
import { testUserId } from '../constants';
import { createSequencedRollup, createListRollup, createExampleRollup } from '../_utils/rollup';
import * as api from '../../src/middleware/order';
import Project from '../../src/models/Project';
import Order from '../../src/models/Order';

//todo - dont require sending positional combinations to server. share code better.

describe('Middleware', () => {
  describe.only('Orders', () => {
    const numLists = 4;
    const numOpts = 5;
    const roll = createListRollup(numLists, numOpts);

    const onePotOrder = new Order({
      projectId: roll.project.id,
      projectVersion: 0,
      constructIds: [roll.project.components[0]],
      numberCombinations: 20,                      //hack - should not be required
      parameters: {
        onePot: true,
      },
    });

    const activeIndices = [1, 4, 8, 12, 16].reduce((acc, num) => Object.assign(acc, { [num]: true }), {});

    const selectionOrder = new Order({
      projectId: roll.project.id,
      projectVersion: 0,
      constructIds: [roll.project.components[0]],
      numberCombinations: 20,                              //hack - should not be required
      parameters: {
        onePot: false,
        permutations: 5,
        combinatorialMethod: 'Random Subset',
        activeIndices,
      },
    });

    const foundry = 'test';

    before(() => {
      return projectPersistence.projectWrite(roll.project.id, roll, testUserId);
    });

    it.only('submit(order, foundry, combinations) sends the order', () => {
      //hack - this should not be necessary here -- and assumes a lot of structure
      const combos = roll.project.components
        .map(componentId => Object.keys(roll.blocks[componentId].options).map(optionId => roll.blocks[optionId]))
        .map(combo => combo.map(part => part.id));

      return api.submitOrder(onePotOrder, foundry, { [roll.project.components[0]]: combos })
        .then(result => {
          assert(Order.validate(result), 'returned order must be valid');
          assert(result.status.foundry === foundry, 'should have foundry in status');

          const overridden = _.merge({}, result, onePotOrder);

          //shouldnt change any values
          expect(overridden).to.eql(result);
        });
    });

    //todo
    it('submit() with random subset only orders that subset');

    //todo
    it('submit() can specify project version');

    //todo - may need to update the retrieved order, since changes once submitted
    it('getOrder() can retrieve a specific order (if submitted)', () => {
      return api.getOrder(roll.project.id, onePotOrder.id)
        .then(result => {
          expect(result).to.eql(onePotOrder);
        });
    });

    it('getOrders() returns empty array if no orders for project', () => {
      return api.getOrders(Project.classless().id)
        .then(results => {
          expect(results).to.eql([]);
        });
    });

    it('getOrders() can retrieve list of orders (if submitted)', () => {
      return api.getOrder(roll.project.id)
        .then(results => {
          assert(Array.isArray(results), 'should get array');
        });
    });

    //todo
    it('cannot re-order a submitted order - blocked by server');

    //todo - future, once supported
    it('can re-order an order by cloning');

    //todo - future, requires some work
    it('ordering works with multiple constructs specified');

    //todo - future
    it('should handle construct with list blocks in hierarchy');

    //todo - future
    it('ordering works with previous versions of the project');
  });
});
