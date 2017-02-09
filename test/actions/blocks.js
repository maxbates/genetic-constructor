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
    //simple store focuses on block actions exclusively. setting projectId on block would require project store.
    describe('Simple Store', () => {
      const storeBlock = new Block();
      const grandchildA1 = new Block();
      const grandchildA2 = new Block();
      const childA = new Block({
        components: [grandchildA1.id, grandchildA2.id],
      });
      const childB = new Block();
      const root = new Block({
        components: [childA.id, childB.id],
      });
      const cloneStoreInitial = {
        [storeBlock.id]: storeBlock,
        [root.id]: root,
        [childA.id]: childA,
        [childB.id]: childB,
        [grandchildA1.id]: grandchildA1,
        [grandchildA2.id]: grandchildA2,
      };
      const blockStore = simpleStore(cloneStoreInitial, blocksReducer, 'blocks');

      it('blockCreate() adds a block', () => {
        const created = blockStore.dispatch(actions.blockCreate());
        const inStore = blockStore.getState().blocks[created.id];

        expect(inStore).to.eql(created);
      });

      describe('Cloning', () => {
        it('blockClone() removes the projectId', () => {
          const clone = blockStore.dispatch(actions.blockClone(storeBlock.id, {
            owner: testUserId,
            version: 0,
          }));

          expect(storeBlock.projectId).to.be.defined;
          expect(clone.projectId).to.eql(null);
        });

        it('blockClone() clones a block with a new id + proper parents', () => {
          const projectVersion = 12;
          //stub project ID for now because requires reliance on focus / projects store if we put it in storeBlock directly
          const projectIdStub = (new Project()).id;
          const clone = blockStore.dispatch(actions.blockClone(storeBlock.id, {
            projectId: projectIdStub,
            owner: testUserId,
            version: projectVersion,
          }));
          expect(clone.id).to.not.equal(storeBlock.id);
          expect(clone.parents.length).to.equal(1);
          expect(clone.parents).to.eql([{
            id: storeBlock.id,
            owner: testUserId,
            projectId: projectIdStub,
            version: projectVersion,
            created: clone.parents[0].created, //hack, but can't get exact time otherwise
          }]);

          const comparable = Object.assign({}, clone, {
            id: storeBlock.id,
            projectId: null,
            parents: [],
          });

          //hack - can't set projectId on storeBlock since can't use simpleStore.
          delete comparable.projectId;
          expect(comparable).to.eql(storeBlock);
        });

        it('blockClone() deep clones by default, and updates children IDs', () => {
          const projectVersion = 23;
          //stub project ID for now because requires reliance on focus / projects store if we put it in storeBlock directly
          const projectIdStub = (new Project()).id;
          const storePreClone = blockStore.getState().blocks;
          const rootClone = blockStore.dispatch(actions.blockClone(root.id, {
            projectId: projectIdStub,
            owner: testUserId,
            version: projectVersion,
          }));
          const stateAfterClone = blockStore.getState().blocks;

          expect(Object.keys(storePreClone).length + 5).to.equal(Object.keys(stateAfterClone).length);
          expect(rootClone.parents).to.eql([{
            id: root.id,
            owner: testUserId,
            projectId: projectIdStub,
            version: projectVersion,
            created: rootClone.parents[0].created, //hack, but can't get exact time otherwise
          }]);

          const children = rootClone.components.map(componentId => stateAfterClone[componentId]);
          const cloneA = children[0];
          expect(cloneA.parents).to.eql([{
            id: childA.id,
            owner: testUserId,
            projectId: projectIdStub,
            version: projectVersion,
            created: cloneA.parents[0].created, //hack, but can't get exact time otherwise
          }]);
          expect(cloneA.components.length).to.equal(2);

          const grandchildren = cloneA.components.map(componentId => stateAfterClone[componentId]);
          expect(grandchildren[0].parents).to.eql([{
            id: grandchildA1.id,
            owner: testUserId,
            projectId: projectIdStub,
            version: projectVersion,
            created: grandchildren[0].parents[0].created, //hack, but can't get exact time otherwise
          }]);
        });

        it('blockClone() infers parent from what is cloned');
      });

      describe('Sequence', () => {
        const sequence = 'acgtacgtacgt';

        it('blockSetSequence() sets the length', () => {
          blockStore.dispatch(actions.blockSetSequence(storeBlock.id, sequence))
          .then(() => {
            const newBlock = blockStore.getState().blocks[storeBlock.id];
            expect(newBlock.sequence.length).to.equal(sequence.length);
          });
        });

        it('blockSetSequence() validates the sequence', () => {
          blockStore.dispatch(actions.blockSetSequence(storeBlock.id, 'ACACTGKJXXAHSF'))
          .then(() => assert(false, 'should not happen'))
          .catch((err) => expect(err).to.be.defined);
        });
      });
    });

    describe('Real Store', () => {
      let store;
      let frozenBlock;
      let block;
      let project;
      let list;
      const extraProjectId = Project.classless().id;

      before(() => {
        store = configureStore();
        frozenBlock = store.dispatch(actions.blockCreate({
          rules: { frozen: true },
        }));
        block = store.dispatch(actions.blockCreate());
        project = store.dispatch(projectActions.projectCreate());
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

      describe('Setting ID', () => {
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
        it('blockAddComponent() should not error if block is frozen', () => {
          expect(() => {
            store.dispatch(actions.blockAddComponent(block.id, frozenBlock.id));
          }).to.not.throw();
        });

        it('blockOptionsAdd() should not error if block is frozen', () => {
          expect(() => {
            store.dispatch(actions.blockOptionsAdd(list.id, frozenBlock.id));
          }).to.not.throw();
        });
      });

      describe('Cloning', () => {
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
      });
    });
  });
});
