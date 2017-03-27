import { expect, assert } from 'chai';
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
    });

  });
});
