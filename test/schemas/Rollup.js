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
import { expect } from 'chai';
import RollupSchema from '../../src/schemas/Rollup';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import uuid from 'node-uuid';
import { createExampleRollup, createSequencedRollup } from '../_utils/rollup';

describe('Schema', () => {
  describe.only('Rollup', () => {
    it('should validate the test created rollup', () => {
      expect(RollupSchema.validate(createExampleRollup())).to.equal(true);
    });

    it('should validate a simply created rollup', () => {
      const project = new Project();
      const block = new Block();

      const roll = {
        project,
        blocks: {
          [block.id]: block,
        },
      };

      expect(RollupSchema.validate(roll)).to.equal(true);
    });

    it('should validate a rollup with sequences', () => {
      // { md5: sequence } format
      expect(RollupSchema.validate(createSequencedRollup())).to.equal(true);

      const project = new Project();
      const seq = 'CAGTCGATCGATCGTCAGTACGTGCTAGCTGACTGACATCTAGCAGCTAGC';
      const block = new Block({
        projectId: project.id,
      });
      const block2 = new Block({
        projectId: project.id,
      });

      const roll = {
        project,
        blocks: {
          [block.id]: block,
          [block2.id]: block2,
        },
        sequences: [{
          sequence: seq,
          blocks: {
            [block.id]: true,
            [block2.id]: [5, 10],
          },
        }],
      };

      expect(RollupSchema.validate(roll)).to.equal(true);
    });

    //todo
    it('should only allow fields project, blocks, sequences');

    it('should make sure projectIds in blocks match the rollup project Id');

    it('should allow for a cheap check');
  });
});
