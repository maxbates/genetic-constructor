import { assert, expect } from 'chai';
import { merge } from 'lodash';
import { testUserId } from '../../constants';
import Block from '../../../src/models/Block';
import Project from '../../../src/models/Project';
import * as rollup from '../../../server/data/rollup';
import * as persistence from '../../../server/data/persistence';
import * as querying from '../../../server/data/querying';

import { numberBlocksInRollup, createExampleRollup } from '../../utils/rollup';

describe('Server', () => {
  describe('Data', () => {
    describe('Rollup', () => {
      const userId = testUserId;
      const roll = createExampleRollup();
      const project = roll.project;
      const projectId = project.id;
      const blockKeys = Object.keys(roll.blocks);
      const block1 = roll.blocks[blockKeys[0]];
      const block2 = roll.blocks[blockKeys[3]];
      const parentId = blockKeys.find(blockId => {
        const block = roll.blocks[blockId];
        return block.components.length === 3;
      });

      before(() => {
        return persistence.projectCreate(projectId, project, userId);
      });

      it('createRollupFromArray() has structure { project: project, blocks: { <blockId>: block } }', () => {
        expect(roll.project).to.eql(project);
        assert(typeof roll.blocks === 'object', 'blocks shoudl be object');
        expect(Object.keys(roll.blocks).length).to.equal(numberBlocksInRollup);
      });

      it('writeProjectRollup() writes a whole rollup', () => {
        return rollup.writeProjectRollup(projectId, roll, userId)
          .then(() => Promise
            .all([
              persistence.projectGet(projectId),
              persistence.blocksGet(projectId, false, block1.id).then(map => map[block1.id]),
              persistence.blocksGet(projectId, false, block2.id).then(map => map[block2.id]),
            ])
            .then(([gotProject, gotA, gotE]) => {
              expect(gotProject).to.eql(project);
              expect(gotA).to.eql(block1);
              expect(gotE).to.eql(block2);
            })
          );
      });

      it('getProjectRollup() returns rollup given an ID', () => {
        return rollup.getProjectRollup(projectId)
          .then(roll => {
            expect(roll.project).to.eql(project);
            expect(Object.keys(roll.blocks).length).to.equal(numberBlocksInRollup);
          });
      });

      //this test is a little facetious, as now rollup creation is responsible for updating blocks in manifest
      it('writeProjectRollup() overwrites, discarding old blocks', () => {
        const blockG = Block.classless({ projectId });
        const parent = roll.blocks[parentId];
        const newComponentsParent = parent.components.slice();
        const popped = newComponentsParent.pop(); //remove F
        newComponentsParent.push(blockG.id); //add G
        const newParent = Object.assign({}, parent, { components: newComponentsParent });

        const newRoll = merge({}, roll, {
          blocks: {
            [parentId]: newParent,
            [blockG.id]: blockG,
          },
        });
        delete newRoll.blocks[popped];

        return rollup.writeProjectRollup(projectId, newRoll, userId)
          .then(() => Promise
            .all([
              persistence.projectGet(projectId),
              persistence.blockGet(projectId, false, parentId),
            ])
            .then(([gotProject, gotParent]) => {
              expect(gotProject).to.eql(project);
              expect(gotParent).to.eql(newParent);
            })
            .then(() => querying.getAllBlockIdsInProject(projectId))
            .then(ids => expect(ids.length).to.equal(numberBlocksInRollup))
          );
      });

      it('writeProjectRollup rejects if a block is invalid', (done) => {
        const badBlock = Object.assign(Block.classless(), { parents: { sha: 'invalidSha' } });
        const badRoll = createExampleRollup();
        Object.assign(badRoll.blocks, { [badBlock.id]: badBlock });

        return rollup.writeProjectRollup(projectId, badRoll, userId)
          .catch(err => {
            done();
          });
      });

      it('writeProjectRollup rejects if project is invalid', (done) => {
        const badProject = Object.assign(Project.classless(), { parents: { sha: 'invalidSha' } });
        const badRoll = createExampleRollup();
        badRoll.project = badProject;

        return rollup.writeProjectRollup(projectId, badRoll, userId)
          .catch(err => {
            done();
          });
      });
    });
  });
});
