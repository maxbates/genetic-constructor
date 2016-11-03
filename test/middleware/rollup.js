import chai from 'chai';
import * as api from '../../src/middleware/projects';
import * as snapshotApi from '../../src/middleware/snapshots';
import { merge, range } from 'lodash';
import { testUserId } from '../constants';
import Block from '../../src/models/Block';

import * as commitMessages from '../../server/data/git-deprecated/commitMessages';
import * as filePaths from '../../server/data/middleware/filePaths';
import * as versioning from '../../server/data/git-deprecated/git';
import * as projectPersistence from '../../server/data/persistence/projects';
import { createExampleRollup } from '../_utils/rollup';

const { assert, expect } = chai;

describe('Middleware', () => {
  describe('Rollup', () => {
    //create a test project to load
    const userId = testUserId;
    const roll = createExampleRollup();
    const project = roll.project;
    const projectId = project.id;

    before(() => projectPersistence.projectWrite(projectId, roll, userId));

    it('listProjects() lists available projects', () => {
      return api.listProjects()
        .then(projects => {
          const found = projects.find(proj => proj.id === projectId);
          expect(found).to.be.defined;
          expect(found).to.eql(project);
        });
    });

    it('loadProject() loads a project rollup', () => {
      return api.loadProject(projectId)
        .then(gotRoll => {
          expect(gotRoll.project).to.eql(project);
          assert(Object.keys(gotRoll.blocks).every(blockId => {
            return !!roll.blocks[blockId];
          }));
        });
    });

    it('saveProject() saves a project and blocks, can be loaded by persistence, adds version, updated, authors', () => {
      const roll = createExampleRollup();
      const project = roll.project;
      const projectId = project.id;
      const blockKeys = Object.keys(roll.blocks);
      const block1 = roll.blocks[blockKeys[0]];
      const block2 = roll.blocks[blockKeys[3]];

      return api.saveProject(projectId, roll)
        .then((versionInfo) => Promise
          .all([
            projectPersistence.projectGetManifest(projectId),
            projectPersistence.blocksGet(projectId, false, block1.id).then(map => map[block1.id]),
            projectPersistence.blocksGet(projectId, false, block2.id).then(map => map[block2.id]),
          ])
          .then(([gotProject, got1, got2]) => {
            expect(gotProject).to.eql(merge({}, project, {
              version: versionInfo.version,
              metadata: {
                updated: versionInfo.time,
                authors: [testUserId],
              },
            }));
            expect(got1).to.eql(block1);
            expect(got2).to.eql(block2);
          }));
    });

    //todo - this test needs a major redo

    it('saveProject() creates a commit', () => {
      const a_roll = createExampleRollup();
      const a_projectId = a_roll.project.id;
      const b_roll = Object.assign(createExampleRollup(), { project: a_roll.project });

      const a_path = filePaths.createProjectDataPath(a_projectId);
      let a_log;

      throw new Error('write this test over');

      return api.saveProject(a_projectId, a_roll)
        .then(() => versioning.log(a_path))
        .then(log => {
          a_log = log;
        })
        .then(() => api.saveProject(a_projectId, b_roll))
        .then(() => versioning.log(a_path))
        .then(log => {
          assert(typeof log.length === 'number', 'log error in wrong format, got ' + log);
          expect(a_log.length + 1).to.equal(log.length);
        });
    });

    it('snapshot() creates a snapshot commit, returns the sha', () => {
      const roll = createExampleRollup();
      const project = roll.project;
      const projectId = project.id;
      const commitMessage = 'my fancy message';

      return snapshotApi.snapshot(projectId, commitMessage, roll)
        .then(commit => {
          assert(commit.message.indexOf(commitMessages.SNAPSHOT) >= 0, 'wrong commit message type, shoudl be snapshot');
          assert(commit.message.indexOf(commitMessage) >= 0, 'commit message missing');
        });
    });

    it('can save a huge project (10mb or so)', () => {
      const roll = createExampleRollup();
      const project = roll.project;

      const newBlocks = range(1000).map(() => new Block())
        .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});

      merge(roll.blocks, newBlocks);

      return api.saveProject(project.id, roll);
    });
  });
});
