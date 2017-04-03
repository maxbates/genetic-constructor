import { expect, assert } from 'chai';
import _ from 'lodash';
import Block from '../../../src/models/Block';
import Project from '../../../src/models/Project';
import { testUserId } from '../../constants';

describe('Model', () => {
  describe('Block', () => {
    describe('Clone', () => {
      let block;
      beforeEach(() => {
        block = new Block();
      });

      const dummyProject = new Project({ owner: testUserId });

      it('clone() should add to history', () => {
        block = block.setProjectId(dummyProject.id);
        assert(block.parents.length === 0, 'should have no parents');

        const cloned = block.clone({ owner: testUserId, version: 0 });

        expect(cloned.id).to.not.equal(block.id);
        assert(cloned.parents.length === 1, 'should have parent');
        expect(cloned.parents[0].projectId).to.equal(dummyProject.id);
        expect(cloned.parents[0].id).to.equal(block.id);
        expect(cloned.projectId).to.eql(null);

        const grandchild = cloned.clone({ owner: testUserId, version: 0 });

        expect(grandchild.id).to.not.equal(block.id);
        expect(grandchild.id).to.not.equal(cloned.id);
        assert(grandchild.parents.length === 2, 'should have 2 parents');

        //newest parent first
        expect(grandchild.parents[0].projectId).to.equal(null);
        expect(grandchild.parents[0].id).to.equal(cloned.id);

        expect(grandchild.parents[1].projectId).to.equal(dummyProject.id);
        expect(grandchild.parents[1].id).to.equal(block.id);
      });

      it('clone(null) should change the ID, or add to history', () => {
        const frozen = block.setFrozen(true);
        const cloned = frozen.clone(null);
        assert(cloned !== frozen, 'should not be the same instance');
        assert(cloned.id !== frozen.id, 'should not have same id ' + cloned.id + ' ' + frozen.id);
      });

      it('clone() should unfreeze', () => {
        const frozen = block.setFrozen(true);
        const cloned = frozen.clone(null);
        assert(!cloned.isFrozen(), 'should not be frozen after cloning');
      });

      it('clone() with overrides should override the initial object', () => {
        const oldName = 'oldness';
        const newName = 'newness';
        const overwrite = {
          metadata: { name: newName },
        };
        const overWriteCheck = _.merge({}, overwrite);

        const source = new Block({
          metadata: {
            name: oldName,
          },
        });
        const clone = source.clone(null, overwrite);

        expect(source.metadata.name).to.equal(oldName);
        expect(clone.metadata.name).to.equal(newName);
        expect(overwrite).to.eql(overWriteCheck);
      });

      it('clone() with empty array should override to empty array, not merge', () => {
        const source = new Block({
          components: [1, 2, 3].map(() => (new Block()).id),
        });
        const clone = source.clone(null, {
          components: [],
        });
        expect(clone.components).to.eql([]);
      });
    });
  });
});
