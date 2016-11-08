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
import { testUserId } from '../constants';
import { expect, assert } from 'chai';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import Order from '../../src/models/Order';
import _ from 'lodash';

describe('Model', () => {
  describe('Order', () => {
    const validOrderScaffold = (input = {}) => new Order(_.merge({
      projectId: Project.classless().id,
      constructIds: [Block.classless().id],
    }, input));

    const validOrder = (input = {}) => validOrderScaffold(_.merge({
      user: testUserId,
      projectVersion: 10,
      parameters: {
        onePot: true,
      },
    }, input));

    it('requires projectId and construct Ids', () => {
      expect(() => new Order({})).to.throw();
      expect(() => new Order({ projectId: Project.classless().id })).to.throw();
      expect(() => new Order({ constructIds: [] })).to.throw();
      expect(validOrderScaffold).to.not.throw();
    });

    it('validateParams checks parameters', () => {
      const ord = validOrderScaffold();

      assert(Order.validateParameters(ord.parameters), 'should be valid order params');

      const badParams = Object.assign({}, ord.parameters, {
        onePot: 100,
      });

      assert(Order.validateParameters(badParams) === false, ' should be invalid parameters');
    });

    it('validate() requires projectVersion and userId', () => {
      assert(Order.validate(validOrderScaffold()) === false, 'should require more than just parameters');
      assert(Order.validate(validOrder()), 'valid order generator should be valid');
    });

    it('has submit() and quote()', () => {
      const ord = validOrder();
      expect(typeof ord.submit).to.equal('function');
      expect(typeof ord.quote).to.equal('function');
    });

    it('submit() if all combinations allowed for');

    it('submit requires positional combinations', () => {
      const ord = validOrder();
      expect(ord.submit).to.throw();
      expect(() => ord.submit('egf')).to.throw();
    });

    it('submit() with valid positional combinations');

    it('cannot change a submitted order', () => {
      const ord = validOrder({
        status: {
          foundry: 'egf',
          remoteId: 'actgactgatsdgtasd',
          timeSent: Date.now(),
        },
      });

      expect(() => ord.mutate('metadata.name', 'new name')).to.throw();
    });
  });
});
