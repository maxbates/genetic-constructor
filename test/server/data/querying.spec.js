import { assert, expect } from 'chai';
import uuid from 'node-uuid';
import Block from '../../../src/models/Block';
import BlockSchema from '../../../src/schemas/Block';
import ProjectSchema from '../../../src/schemas/Project';
import * as fileSystem from '../../../server/data/middleware/fileSystem';
import * as filePaths from '../../../server/data/middleware/filePaths';
import * as rollup from '../../../server/data/rollup';
import * as querying from '../../../server/data/querying';
import { merge, values } from 'lodash';

import { createExampleRollup } from '../../_utils/rollup';

describe('Server', () => {
  describe('Data', () => {
    describe('Querying', () => {
      const terminatorBlockName = 'el terminado';

      const createCustomRollup = () => {
        const roll = createExampleRollup();
        const projectId = roll.project.id;
        const promoter = Block.classless({
          projectId,
          metadata: { name: 'promoter' },
          rules: { role: 'promoter' },
        });
        const terminator = Block.classless({
          projectId,
          metadata: { name: terminatorBlockName },
          rules: { role: 'terminator' },
        });
        merge(roll.blocks, { [promoter.id]: promoter, [terminator.id]: terminator });
        roll.project.components.push(promoter.id, terminator.id);
        return roll;
      };
      const numberBlocksInCustomRollup = Object.keys(createCustomRollup().blocks).length;

      const myUserId = uuid.v4();
      const myRolls = [1, 2, 3, 4].map(createCustomRollup);
      const myRollIds = myRolls.map(roll => roll.project.id);

      const otherUserId = uuid.v4();
      const otherRolls = [1, 2, 3].map(createCustomRollup);
      const otherRollIds = otherRolls.map(roll => roll.project.id);

      const randomUserId = uuid.v4();

      before(() => {
        return Promise.all([
          ...myRollIds.map((projectId, index) => {
            return rollup.writeProjectRollup(projectId, myRolls[index], myUserId);
          }),
          ...otherRollIds.map((projectId, index) => {
            return rollup.writeProjectRollup(projectId, otherRolls[index], otherUserId);
          }),
        ]);
      });

      it('before() should have written properly', () => {
        const directory = filePaths.createProjectsDirectoryPath();
        return fileSystem.directoryContents(directory)
          .then(contents => {
            assert(myRollIds.every(id => contents.indexOf(id) >= 0), 'my rolls not all written');
            assert(otherRollIds.every(id => contents.indexOf(id) >= 0), 'other rolls not all written');
          });
      });

      it('listProjectsWithAccess() limits by user ID', () => {
        return querying.listProjectsWithAccess(myUserId)
          .then(projects => {
            expect(projects.length).to.equal(myRollIds.length);
            assert(projects.every(projectId => myRollIds.indexOf(projectId) >= 0), 'wrong project was returned..');
          });
      });

      it('listProjectsWithAccess() doesnt fail when user has no projects', () => {
        return querying.listProjectsWithAccess(randomUserId)
          .then(projects => {
            expect(projects.length).to.equal(0);
          });
      });

      it('getAllProjectManifests() returns project manifests user can access', () => {
        return querying.listProjectsWithAccess(myUserId)
          .then(accessibleProjects => {
            return querying.getAllProjectManifests(myUserId)
              .then(manifests => {
                expect(manifests.length).to.equal(accessibleProjects.length);
                assert(manifests.every(manifest => ProjectSchema.validate(manifest, true)), 'manifests not in valid format');
              });
          });
      });

      it('getAllBlocks() get all blocks for a user ID', () => {
        return querying.getAllBlocks(myUserId)
          .then(blockMap => {
            const blocks = values(blockMap);
            expect(blocks.length).to.equal(myRolls.length * numberBlocksInCustomRollup);
            assert(blocks.every(block => BlockSchema.validate(block, true)), 'blocks not in valid format');
          });
      });

      it('getAllBlocksByType() can get all blocks of type', () => {
        return querying.getAllPartsWithRole(myUserId, 'promoter')
          .then(blockMap => {
            const blocks = values(blockMap);
            expect(blocks.length).to.equal(myRolls.length);
            assert(blocks.every(block => block.rules.role === 'promoter'), 'got block with wrong role type');
          });
      });

      it('getAllBlocksByType() can get all blocks by name', () => {
        return querying.getAllBlocksWithName(myUserId, terminatorBlockName)
          .then(blockMap => {
            const blocks = values(blockMap);
            expect(blocks.length).to.equal(myRolls.length);
            assert(blocks.every(block => block.metadata.name === terminatorBlockName), 'got block with wrong name');
          });
      });
    });
  });
});
