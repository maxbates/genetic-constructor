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
import { expect, assert } from 'chai';
import makeEgfRollup from '../../data/egf_parts/index';
import Rollup from '../../src/models/Rollup';
import _ from 'lodash';

describe('Templates', () => {
  describe('EGF', () => {
    it('should create a valid rollup, blocks with correct projectId', () => {
      const roll = makeEgfRollup();
      Rollup.validate(roll, true);
    });

    it('should be different project each time', () => {
      const one = makeEgfRollup();
      const two = makeEgfRollup();

      assert(one.project.id !== two.project.id, 'shouldnt have same projectId');
    });

    it('should have different blocks for same position in different constructs', () => {
      const roll = makeEgfRollup();
      const seen = {};
      const repeats = [];

      _.forEach(roll.blocks, (block) => {
        _.forEach(block.components, componentId => {
          if (seen[componentId]) {
            repeats.push(componentId);
          }
          seen[componentId] = true;
        });
        _.forEach(block.options, (active, optionId) => {
          if (seen[optionId]) {
            repeats.push(optionId);
          }
          seen[optionId] = true;
        });
      });

      /*
       //debugging:
       console.log(`
       Roll has ${Object.keys(roll.blocks).length} blocks
       # Repeats: ${repeats.length}
       # Unique Repeats: ${[...new Set(repeats)].length}
       `);
       */

      assert(!repeats.length, 'should not have any repeats');
    });

    it('should make it quickly', function speedTest(done) {
      const number = 10;
      const perSecond = 1.5;

      this.timeout(number * 1000 / perSecond);

      const rolls = _.range(number).map((ind) => {
        makeEgfRollup();
      });

      done();
    });
  });
});
