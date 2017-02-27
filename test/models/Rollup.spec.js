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
import _ from 'lodash';

import { testUserId } from '../constants';
import { createExampleRollup, createListRollup } from '../_utils/rollup';
import RollupSchema, { currentDataModelVersion } from '../../src/schemas/Rollup';
import Rollup from '../../src/models/Rollup';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import * as projectPersistence from '../../server/data/persistence/projects';

describe('Model', () => {
  describe('Rollup', () => {
    describe('validate()', () => {
      it('can throw on errors', () => {
        expect(() => Rollup.validate({ project: {}, blocks: {} }, true)).to.throw();
      });

      it('works on examples', () => {
        Rollup.validate(createExampleRollup(), true);
      });

      it('works on simple one', () => {
        const pr = Project.classless({ owner: testUserId });
        const bl = Block.classless({ projectId: pr.id });
        const rl = {
          schema: currentDataModelVersion,
          project: pr,
          blocks: {
            [bl.id]: bl,
          },
        };

        expect(Rollup.validate(rl)).to.equal(true);
        Rollup.validate(rl, true);
      });

      it('cheap validation just checks basic shape, e.g. ignores block projectId', () => {
        const pr = Project.classless({ owner: testUserId });
        const bl = Block.classless();
        const rl = Object.assign(RollupSchema.scaffold(), {
          project: pr,
          blocks: {
            [bl.id]: bl,
          },
        });

        expect(Rollup.validate(rl, false, false)).to.equal(true);
      });

      it('catches wrong projectId, in non-light validation', () => {
        const pr = Project.classless({ owner: testUserId });
        const bl = Block.classless({
          projectId: Project.classless().id,
        });
        const rl = {
          schema: currentDataModelVersion,
          project: pr,
          blocks: {
            [bl.id]: bl,
          },
        };

        expect(Rollup.validate(rl, false)).to.equal(false);

        rl.blocks[bl.id].projectId = pr.id;

        expect(Rollup.validate(rl, false)).to.equal(true);
      });

      it('checks for weird keys', () => {
        const pr = Project.classless({ owner: testUserId });
        const bl = Block.classless({
          projectId: Project.classless().id,
        });
        const rl = Object.assign(RollupSchema.scaffold(), {
          project: pr,
          blocks: {
            [bl.id]: bl,
          },
          random: 'value',
        });

        expect(Rollup.validate(rl, false)).to.equal(false);
      });

      it('checks if each block is valid', () => {
        const proj = Project.classless({ owner: testUserId });
        const invalidBlock = Object.assign(Block.classless({ projectId: proj.id }), { metadata: 'invalid' });

        const rl = Object.assign(RollupSchema.scaffold(), {
          project: proj,
          blocks: {
            [invalidBlock.id]: invalidBlock,
          },
        });

        expect(() => Rollup.validate(rl, true)).to.throw();
      });
    });

    describe('compare', () => {
      it('compare() can throw', () => {
        expect(() => Rollup.compare(createExampleRollup(), createExampleRollup(), true)).to.throw();
      });

      it('compare() picks up project difference, throws on error', () => {
        const one = createExampleRollup();
        const two = _.merge({}, one, { project: { blah: 'field' } });
        expect(Project.compare(one.project, two.project)).to.equal(false);
        expect(() => Rollup.compare(one, two, true)).to.throw();
      });

      it('compare() ignores project version stuff', () => {
        const roll = createExampleRollup();

        return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
        .then(info => {
          Rollup.compare(info.data, roll, true);
        });
      });
    });

    describe('upgrade()', () => {
      it('upgrade() updates to the latest schema number', () => {
        const rl = Object.assign(RollupSchema.scaffold(), { schema: 1 });
        Rollup.upgrade(rl);
        expect(rl.schema).to.equal(currentDataModelVersion);
      });

      it('constructor() automatically updates', () => {
        const roll = new Rollup();
        expect(roll.schema).to.equal(currentDataModelVersion);

        const upgraded = new Rollup({
          schema: 1,
          project: new Project({}, false),
        });
        expect(upgraded.schema).to.equal(currentDataModelVersion);
      });

      it('v1 -> adds keywords', () => {
        const roll = new Rollup(createExampleRollup());

        //patch to v1, unset keywords
        roll.schema = 1;
        _.unset(roll, 'project.metadata.keywords');
        _.forEach(roll.blocks, block => _.unset(block, 'metadata.keywords'));

        expect(Rollup.validate(roll, false)).to.equal(false);

        Rollup.upgrade(roll);
        expect(Rollup.validate(roll, false)).to.equal(true);
      });

      it('v2 -> adds block attribution', () => {
        const roll = new Rollup(createExampleRollup());

        //patch to v2, unset attribution
        roll.schema = 2;
        _.forEach(roll.blocks, block => _.unset(block, 'attribution'));

        expect(Rollup.validate(roll, false)).to.equal(false);

        Rollup.upgrade(roll);
        expect(Rollup.validate(roll, false)).to.equal(true);
      });
    });

    describe('classify()', () => {
      it('creates models of projects and blocks', () => {
        const roll = Rollup.classify(createExampleRollup());

        assert(roll.project instanceof Project, 'should be project model');
        assert(_.every(roll.blocks, block => block instanceof Block), 'blocks should be models');
        assert(roll instanceof Rollup, 'should be rollup model');
      });

      it('skips / accomodates models of projects / blocks', () => {
        const project = new Project();
        const block = new Block({
          projectId: project.id,
        });

        const roll = Rollup.classify({
          project,
          blocks: {
            [block.id]: block,
          },
        });

        assert(roll.project instanceof Project, 'should be project model');
        assert(_.every(roll.blocks, block => block instanceof Block), 'blocks should be models');
        assert(roll instanceof Rollup, 'should be rollup model');
      });
    });

    describe('clone()', () => {
      it('cloneBlock() clones a block, returns array, unsets projectId', () => {
        const roll = Rollup.classify(createExampleRollup());
        const leaf = _.find(roll.blocks, block => block.components.length === 0 && Object.keys(block.options).length === 0);

        const clones = roll.cloneBlock(leaf.id);

        assert(Array.isArray(clones), 'should be array');
        expect(clones.length).to.equal(1);

        const clone = clones[0];
        expect(clone.projectId).to.equal(null);
        expect(clone.parents.length).to.equal(1);

        const comparison = { ...clone,
          id: leaf.id,
          projectId: leaf.projectId,
          parents: [],
        };
        expect(comparison).to.eql(leaf);
      });

      it('cloneBlock() clones components', () => {
        const roll = Rollup.classify(createExampleRollup());
        const construct = roll.blocks[roll.project.components[0]];
        const components = roll.getComponents(construct.id);

        const clones = roll.cloneBlock(construct.id);

        expect(clones.length).to.equal(Object.keys(components).length);

        const constructClone = clones[0];

        //rough check that it comes first
        expect(constructClone.components.length).to.equal(construct.components.length);
        assert(_.every(constructClone.components, componentId => _.find(clones, { id: componentId })), 'component Ids should be remapped');

        assert(_.every(clones, block => block instanceof Block), 'blocks should be models');
        assert(_.every(clones, block => block.projectId === null), 'blocks should have no project Id');
        assert(_.every(clones, block => !_.find(roll.blocks, { id: block.id })), 'all ids should be different');
      });

      it('cloneBlock() clones options', () => {
        const roll = Rollup.classify(createListRollup());
        const construct = roll.blocks[roll.project.components[0]];
        const components = roll.getComponents(construct.id);
        assert(Object.keys(components).length > 0, 'should have components');

        const listBlock = components[construct.components[0]];
        const options = roll.getOptions(listBlock.id);
        assert(Object.keys(options).length > 0, 'should have options');

        const clones = roll.cloneBlock(construct.id);

        expect(clones[0].components.length).to.equal(construct.components.length);
        assert(_.every(clones[0].components, componentId => _.find(clones, { id: componentId })), 'component Ids should be remapped');

        const listBlockClone = _.find(clones, { id: clones[0].components[0] });
        expect(Object.keys(listBlockClone).length).to.equal(Object.keys(listBlock).length);

        assert(_.every(clones, block => block instanceof Block), 'blocks should be models');
        assert(_.every(clones, block => block.projectId === null), 'blocks should have no project Id');
        assert(_.every(clones, block => !_.find(roll.blocks, { id: block.id })), 'all ids should be different');
      });

      it('clones the whole project, and returns a rollup', () => {
        const roll = Rollup.classify(createExampleRollup());
        const clone = roll.clone(testUserId);

        assert(clone.project instanceof Project, 'should be project model');
        assert(_.every(clone.blocks, block => block instanceof Block), 'blocks should be models');
        assert(clone instanceof Rollup, 'should be rollup model');

        assert(roll.project.id !== clone.project.id, 'should have new project id');
        assert(_.every(clone.blocks, block => block.projectId === clone.project.id), 'blocks should have new project Id');
        assert(_.every(clone.blocks, block => !roll.blocks[block.id]), 'all ids should be different');

        expect(Object.keys(clone.blocks).length).to.equal(Object.keys(roll.blocks).length);
      });
    });
  });
});
