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
import _ from 'lodash';
import { assert, expect } from 'chai';
import * as projectPersistence from '../../server/data/persistence/projects';
import { testUserId } from '../constants';
import { createListRollup } from '../_utils/rollup';
import * as api from '../../src/middleware/order';
import Project from '../../src/models/Project';
import Order from '../../src/models/Order';

describe('Middleware', () => {
  describe('Orders', () => {
    const numLists = 4;
    const numOpts = 5;
    const roll = createListRollup(numLists, numOpts);
    const updated = _.merge({}, roll, { project: { another: 'field' } });

    //todo - dont require sending positional combinations to server. share code better.
    //hack - should not be required to send this to the server
    //only works for exampleListRollup
    const generateSimplePositionals = (roll, indexWanted = 0) => {
      const componentId = roll.project.components[indexWanted];

      const combos = roll.blocks[componentId].components
        .map(componentId => Object.keys(roll.blocks[componentId].options).map(optionId => roll.blocks[optionId]))
        .map(combo => combo.map(part => part.id));

      return { [componentId ]: combos };
    };

    const onePotOrder = Order.classless({
      projectId: roll.project.id,
      constructIds: [roll.project.components[0]],
      numberCombinations: 20,                      //hack - should not be required
      parameters: {
        onePot: true,
      },
    });
    let onePotSubmitted;

    const activeIndices = [1, 4, 8, 12, 16].reduce((acc, num) => Object.assign(acc, { [num]: true }), {});

    const selectionOrder = Order.classless({
      projectId: roll.project.id,
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
      return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
        .then(() => projectPersistence.projectWrite(roll.project.id, updated, testUserId));
    });

    it('submit(order, foundry, combinations) sends the order', () => {
      return api.submitOrder(onePotOrder, foundry, generateSimplePositionals(roll, 0))
        .then(result => {
          onePotSubmitted = result;

          assert(Order.validate(result), 'returned order must be valid');
          assert(result.status.foundry === foundry, 'should have foundry in status');

          assert(result.projectVersion === 1, 'project version should default to latest');

          const overridden = _.merge({}, result, onePotOrder);

          //shouldnt change any values
          expect(overridden).to.eql(result);
        });
    });

    it('submit() with random subset only orders that subset', () => {
      return api.submitOrder(selectionOrder, foundry, generateSimplePositionals(roll, 0))
        .then(result => {
          assert(Order.validate(result), 'returned order must be valid');
          assert(result.status.foundry === foundry, 'should have foundry in status');
          assert(result.status.numberOrdered === Object.keys(activeIndices).length, 'should note number of constructs made');

          const overridden = _.merge({}, result, selectionOrder);

          //shouldnt change any values
          expect(overridden).to.eql(result);
        });
    });

    it('submit() can specify project version, defaults to latest version', () => {
      const versioned = _.merge({}, onePotOrder, { projectVersion: 0 });

      return api.submitOrder(versioned, foundry, generateSimplePositionals(roll, 0))
        .then(result => {
          assert(result.projectVersion === 0, 'project version should default to latest');

          const overridden = _.merge({}, result, versioned);

          //shouldnt change any values
          expect(overridden).to.eql(result);
        });
    });

    it('getOrder() can retrieve a specific order (if submitted)', () => {
      return api.getOrder(roll.project.id, onePotOrder.id)
        .then(result => {
          expect(result).to.eql(onePotSubmitted);
        });
    });

    it('getOrders() returns empty array if no orders for project', () => {
      return api.getOrders(Project.classless().id)
        .then(results => {
          expect(results).to.eql([]);
        });
    });

    it('getOrders() can retrieve list of orders (if submitted)', () => {
      return api.getOrders(roll.project.id)
        .then(results => {
          assert(Array.isArray(results), 'should get array');
          assert(results.length === 3, 'should have three orders');
          expect(results[0]).to.eql(onePotSubmitted);
        });
    });

    it('cannot re-order a submitted order - blocked by server', (done) => {
      api.submitOrder(onePotSubmitted, foundry, generateSimplePositionals(roll, 0))
        .then(() => done('shouldnt be able to submit'))
        .catch(err => {
          assert(err.indexOf('cannot submit') >= 0, 'should say cant resubmit');
          done();
        });
    });

    // future tests

    //todo - future, requires some work. how to handle indices across multiple constructs?
    it('ordering works with multiple constructs specified');

    //todo - future, once supported
    it('can re-order an order by cloning');

    //todo - future
    it('should handle construct with list blocks in hierarchy');

    //todo - future
    it('ordering works with previous versions of the project');
  });
});
