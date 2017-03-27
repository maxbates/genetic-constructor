import { assert, expect } from 'chai';
import sha1 from 'sha1';
import * as actions from '../../src/actions/blocks';
import * as projectActions from '../../src/actions/projects';
import blocksReducer from '../../src/reducers/blocks';
import { simpleStore } from '../store/mocks';
import configureStore from '../../src/store/configureStore';
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';
import { testUserId } from '../constants';

describe('Actions', () => {
  describe('Blocks', () => {
    let store;
    let project;

    before(() => {
      store = configureStore();
      project = store.dispatch(projectActions.projectCreate());
    });

    describe('Creating', () => {
      it('blockCreate() adds a block', () => {
        const created = store.dispatch(actions.blockCreate());
        const inStore = store.getState().blocks[created.id];

        expect(inStore).to.eql(created);
      });
    });

    describe('Setting ID', () => {
      const extraProjectId = Project.classless().id;
      let block;
      let list;

      before(() => {
        block = store.dispatch(actions.blockCreate());
        list = store.dispatch(actions.blockCreate({
          projectId: project.id,
          rules: { list: true },
        }));
      });

      //all the suites rely on ID setting of this test, so lets just run it first
      it('projectAddConstruct() should set projectId', () => {
        store.dispatch(projectActions.projectAddConstruct(project.id, block.id));
        expect(store.getState().blocks[block.id].projectId).to.equal(project.id);
      });

      it('blockAddComponent() should set projectId', () => {
        const child = store.dispatch(actions.blockCreate());
        store.dispatch(actions.blockAddComponent(block.id, child.id));

        expect(store.getState().blocks[child.id].projectId).to.equal(project.id);
      });

      it('blockAddComponent() should error if wrong project ID', () => {
        expect(() => {
          const child = store.dispatch(actions.blockCreate({ projectId: extraProjectId }));
          store.dispatch(actions.blockAddComponent(block.id, child.id));
        }).to.throw();
      });

      it('blockOptionsAdd() should set ID', () => {
        const option = store.dispatch(actions.blockCreate());
        store.dispatch(actions.blockOptionsAdd(list.id, option.id));
        expect(store.getState().blocks[option.id].projectId).to.equal(project.id);
      });

      it('blockOptionsAdd() should error if wrong project ID', () => {
        expect(() => {
          const option = store.dispatch(actions.blockCreate({ projectId: extraProjectId }));
          store.dispatch(actions.blockOptionsAdd(list.id, option.id));
        }).to.throw();
      });
    });

    describe('Frozen', () => {
      let block;
      let list;
      let frozenBlock;

      before(() => {
        block = store.dispatch(actions.blockCreate({
          projectId: project.id,
        }));
        list = store.dispatch(actions.blockCreate({
          projectId: project.id,
          rules: { list: true },
        }));
        frozenBlock = store.dispatch(actions.blockCreate({
          rules: { frozen: true },
        }));
      });

      it('blockAddComponent() should error if block is frozen', () => {
        expect(() => {
          store.dispatch(actions.blockAddComponent(block.id, frozenBlock.id));
        }).to.throw();
      });

      it('blockOptionsAdd() should error if block is frozen', () => {
        expect(() => {
          store.dispatch(actions.blockOptionsAdd(list.id, frozenBlock.id));
        }).to.throw();
      });
    });

    describe('Cloning', () => {
      let block;
      let list;

      before(() => {
        block = store.dispatch(actions.blockCreate({
          projectId: project.id,
        }));
        list = store.dispatch(actions.blockCreate({
          projectId: project.id,
          rules: { list: true },
        }));
      });

      it('blockClone() should unset projectId in clone', () => {
        expect(store.getState().blocks[block.id].projectId).to.equal(project.id);
        const clone = store.dispatch(actions.blockClone(block.id, null));
        expect(store.getState().blocks[block.id].projectId).to.equal(project.id);
        expect(store.getState().blocks[clone.id].projectId).to.equal(null);
      });

      it('blockClone should clone frozen things too', () => {
        const option = store.dispatch(actions.blockCreate());
        store.dispatch(actions.blockOptionsAdd(list.id, option.id));
        store.dispatch(actions.blockFreeze(option.id));
        const clone = store.dispatch(actions.blockClone(list.id));
        assert(Object.keys(clone.options).indexOf(option.id) < 0, 'frozen block should have cloned');
      });

      it('blockClone() simply clones if there is no projectId', () => {
        const block = store.dispatch(actions.blockCreate());
        const clone = store.dispatch(actions.blockClone(block.id));
        expect(clone.parents.length).to.equal(0);
      });

      it('blockClone() simply clones if pass parentInfo = null and unsets projectId', () => {
        const block = store.dispatch(actions.blockCreate({ projectId: project.id }));
        const clone = store.dispatch(actions.blockClone(block.id, null));
        expect(clone.parents.length).to.equal(0);
        expect(clone).to.eql(Object.assign({}, block, { id: clone.id, projectId: null }));
      });

      it('blockClone() throws if projectId is defined but project not in the store, and trying to add to ancestry', () => {
        const block = store.dispatch(actions.blockCreate({ projectId: (new Project()).id }));
        expect(() => store.dispatch(actions.blockClone(block.id))).to.throw();
      });

      it('blockClone() adds ancestor if project is defined', () => {
        const block = store.dispatch(actions.blockCreate({ projectId: project.id }));
        const clone = store.dispatch(actions.blockClone(block.id));

        expect(clone.parents.length).to.equal(1);
        expect(clone.parents[0].id).to.equal(block.id);
        expect(clone.parents[0]).to.eql({
          id: block.id,
          projectId: project.id,
          owner: project.owner,
          version: project.version,
          created: clone.parents[0].created,
        });
      });

      it('blockClone() clones a block with a new id + proper parents', () => {
        const projectVersion = 12;
        const clone = store.dispatch(actions.blockClone(block.id, {
          projectId: project.id,
          owner: testUserId,
          version: projectVersion,
        }));
        expect(clone.id).to.not.equal(block.id);
        expect(clone.parents.length).to.equal(1);
        expect(clone.parents).to.eql([{
          id: block.id,
          owner: testUserId,
          projectId: project.id,
          version: projectVersion,
          created: clone.parents[0].created,
        }]);

        const comparable = Object.assign({}, clone, {
          id: block.id,
          projectId: project.id,
          parents: [],
        });

        expect(comparable).to.eql(block);
      });

      it('blockClone() deep clones by default, and updates children IDs', () => {
        const grandchildA1 = store.dispatch(actions.blockCreate());
        const grandchildA2 = store.dispatch(actions.blockCreate());
        const childA = store.dispatch(actions.blockCreate({
          components: [grandchildA1.id, grandchildA2.id],
        }));
        const childB = store.dispatch(actions.blockCreate());
        const root = store.dispatch(actions.blockCreate({
          components: [childA.id, childB.id],
        }));

        const projectVersion = 23;
        //stub project ID for now because requires reliance on focus / projects store if we put it in storeBlock directly
        const projectIdStub = (new Project()).id;
        const storePreClone = store.getState().blocks;
        const rootClone = store.dispatch(actions.blockClone(root.id, {
          projectId: projectIdStub,
          owner: testUserId,
          version: projectVersion,
        }));
        const stateAfterClone = store.getState().blocks;

        expect(Object.keys(storePreClone).length + 5).to.equal(Object.keys(stateAfterClone).length);
        expect(rootClone.parents).to.eql([{
          id: root.id,
          owner: testUserId,
          projectId: projectIdStub,
          version: projectVersion,
          created: rootClone.parents[0].created,
        }]);

        const children = rootClone.components.map(componentId => stateAfterClone[componentId]);
        const cloneA = children[0];
        expect(cloneA.parents).to.eql([{
          id: childA.id,
          owner: testUserId,
          projectId: projectIdStub,
          version: projectVersion,
          created: cloneA.parents[0].created,
        }]);
        expect(cloneA.components.length).to.equal(2);

        const grandchildren = cloneA.components.map(componentId => stateAfterClone[componentId]);
        expect(grandchildren[0].parents).to.eql([{
          id: grandchildA1.id,
          owner: testUserId,
          projectId: projectIdStub,
          version: projectVersion,
          created: grandchildren[0].parents[0].created,
        }]);
      });

      it('blockClone() infers parent from what is cloned');
    });

    describe('Sequence', () => {
      const sequence = 'acgtacgtacgt';
      let sequenceBlock;

      before(() => {
        sequenceBlock = store.dispatch(actions.blockCreate({
          projectId: project.id,
        }));
      });

      it('blockSetSequence() validates the sequence', () => {
        store.dispatch(actions.blockSetSequence(sequenceBlock.id, 'ACACTGKJXXAHSF'))
        .then(() => assert(false, 'should not happen'))
        .catch((err) => expect(err).to.be.defined);
      });

      it('blockSetSequence() sets the length', () => {
        store.dispatch(actions.blockSetSequence(sequenceBlock.id, sequence))
        .then(() => {
          const newBlock = store.getState().blocks[sequenceBlock.id];
          expect(newBlock.sequence.length).to.equal(sequence.length);
        });
      });

      it('blockGetSequence() returns sequnce promise', () => {
        store.dispatch(actions.blockGetSequence(sequenceBlock.id))
        .then((seq) => {
          expect(seq).to.equal(sequence);
        });
      });
    });

    describe('Ownership', () => {
      it('block actions should fail if the user does not own the project');
    });
  });
});
