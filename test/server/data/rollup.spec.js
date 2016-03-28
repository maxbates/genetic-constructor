import { assert, expect } from 'chai';
import path from 'path';
import uuid from 'node-uuid';
import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../server/utils/errors';
import { fileExists, fileRead, fileWrite, fileDelete, directoryExists, directoryMake, directoryDelete } from '../../../server/utils/fileSystem';

import Block from '../../../src/models/Block';

import * as filePaths from '../../../server/utils/filePaths';
import * as rollup from '../../../server/data/rollup';
import * as persistence from '../../../server/data/persistence';
import * as querying from '../../../server/data/querying';

import { createExampleRollup } from '../../utils/rollup';

describe('Server', () => {
  describe('Data', () => {
    describe('Rollup', () => {
      const userId = uuid.v4();
      const roll = createExampleRollup();
      const project = roll.project;
      const projectId = project.id;
      const [blockP, blockA, blockB, blockC, blockD, blockE] = roll.blocks;
      before(() => {
        return persistence.projectCreate(projectId, project, userId);
      });

      it('createRollup() has structure { project: project, blocks: [...blocks] }', () => {
        expect(roll.project).to.eql(project);
        expect(roll.blocks.length).to.equal(6);
      });

      it('writeProjectRollup() writes a whole rollup', () => {
        return rollup.writeProjectRollup(projectId, roll, userId)
          .then(() => Promise
            .all([
              persistence.projectGet(projectId),
              persistence.blockGet(blockA.id, projectId),
              persistence.blockGet(blockE.id, projectId),
            ])
            .then(([gotProject, gotA, gotE]) => {
              expect(gotProject).to.eql(project);
              expect(gotA).to.eql(blockA);
              expect(gotE).to.eql(blockE);
            })
          );
      });

      it('getProjectRollup() returns rollup given an ID', () => {
        return rollup.getProjectRollup(projectId)
          .then(roll => {
            expect(roll.project).to.eql(project);
            expect(roll.blocks.length).to.equal(6);
          });
      });

      it('writeProjectRollup() discards old blocks', () => {
        const blockF = new Block();
        const newComponentsBlockA = blockA.components.slice();
        newComponentsBlockA.shift(); //remove C
        newComponentsBlockA.push(blockF.id); //add F
        const editBlockA = Object.assign({}, blockA, {components: newComponentsBlockA});

        const newRoll = rollup.createRollup(project, blockP, editBlockA, blockB, blockD, blockE, blockF);
        return rollup.writeProjectRollup(projectId, newRoll, userId)
          .then(() => Promise
            .all([
              persistence.projectGet(projectId),
              persistence.blockGet(blockA.id, projectId),
              persistence.blockGet(blockF.id, projectId),
              persistence.blockGet(blockC.id, projectId),
            ])
            .then(([gotProject, gotA, gotF, gotC]) => {
              expect(gotProject).to.eql(project);
              expect(gotA).to.eql(editBlockA);
              expect(gotF).to.eql(blockF);
              expect(gotC).to.eql(null);
            })
            .then(() => querying.getAllBlockIdsInProject(projectId))
            .then(ids => expect(ids.length).to.equal(6))
          );
      });
    });
  });
});