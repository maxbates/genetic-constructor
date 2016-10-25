import { assert, expect } from 'chai';
import path from 'path';
import uuid from 'node-uuid';
import merge from 'lodash.merge';
import { updateProjectWithAuthor } from '../../../utils/userUtils';
import md5 from 'md5';
import { testUserId } from '../../../constants';
import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
  directoryExists,
  directoryMake,
  directoryDelete
} from '../../../../server/data/middleware/fileSystem';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';

import * as filePaths from '../../../../server/data/middleware/filePaths';
import * as versioning from '../../../../server/data/git-deprecated/git';
import * as persistence from '../../../../server/data/persistence';
import * as s3 from '../../../../server/data/middleware/s3';

//todo - can probably de-dupe many of these setup / before() clauses, they are pretty similar

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', function persistenceTests() {
      describe('existence + reading', () => {
        const projectName = 'persistenceProject';
        const projectData = new Project(updateProjectWithAuthor({ metadata: { name: projectName } }));
        const projectId = projectData.id;
        const projectPath = filePaths.createProjectPath(projectId);
        const projectDataPath = filePaths.createProjectDataPath(projectId);
        const projectManifestPath = path.resolve(projectDataPath, filePaths.manifestFilename);

        const blockName = 'blockA';
        const blockData = Block.classless({ projectId, metadata: { name: blockName } });
        const blockId = blockData.id;
        const blockFileContents = { [blockId]: blockData };
        const blockDataPath = filePaths.createBlockDirectoryPath(projectId);
        const blockManifestPath = filePaths.createBlockManifestPath(projectId);

        //skip test suite if not using s3
        before(function () {
          if (s3.useRemote) {
            this.skip();
          }

          return directoryDelete(projectPath)
            .then(() => directoryMake(projectPath))
            .then(() => directoryMake(projectDataPath))
            .then(() => directoryMake(blockDataPath))
            .then(() => fileWrite(projectManifestPath, projectData))
            .then(() => fileWrite(blockManifestPath, blockFileContents));
        });

        it('projectExists() rejects for non-extant project', (done) => {
          persistence.projectExists('notRealId')
            .then(() => assert(false))
            .catch(() => done());
        });

        it('projectExists() resolves for valid project', () => {
          return persistence.projectExists(projectId);
        });

        it('blockExists() resolves if block exists', () => {
          return persistence.blocksExist(projectId, false, blockId);
        });

        it('projectGet() returns null if doesnt exist', () => {
          return persistence.projectGet('notRealId')
            .then((result) => assert(result === null));
        });

        it('projectGet() returns project if does exist', () => {
          return persistence.projectGet(projectId)
            .then((result) => expect(result).to.eql(projectData));
        });

        it('blockGet() returns null if doesnt exist', () => {
          return persistence.blockGet(projectId, false, 'notRealId')
            .then((result) => {
              assert(result === null, 'should be null if block doesnt exist')
            });
        });

        it('blockGet() returns block if does exist', () => {
          return persistence.blockGet(projectId, false, blockId)
            .then((result) => expect(result).to.eql(blockData));
        });

        it('blocksGet() returns map with key undefined if doesnt exist', () => {
          const fakeId = 'notRealId';
          return persistence.blocksGet(projectId, false, fakeId)
            .then(blockMap => {
              assert(typeof blockMap === 'object', 'should return a map');
              assert(!blockMap[fakeId], 'value should not be defined');
            });
        });

        it('blocksGet() returns map with block defined as value if does exist', () => {
          return persistence.blocksGet(projectId, false, blockId)
            .then(blockMap => blockMap[blockId])
            .then((result) => expect(result).to.eql(blockData));
        });
      });

      describe('creation', () => {
        const userId = testUserId;

        const projectData = new Project(updateProjectWithAuthor());
        const projectId = projectData.id;
        const projectRepoDataPath = filePaths.createProjectDataPath(projectId);
        const projectManifestPath = filePaths.createProjectManifestPath(projectId);

        const blockData = Block.classless({ projectId });
        const blockId = blockData.id;
        const blockManifestPath = filePaths.createBlockManifestPath(projectId, blockId);

        //skip test suite if not using s3
        before(function () {
          if (s3.useRemote) {
            this.skip();
          }

          return persistence.projectCreate(projectId, projectData, userId)
            .then(() => persistence.blocksWrite(projectId, { [blockId]: blockData }));
        });

        it('projectCreate() creates a git repo for the project', () => {
          return fileExists(projectManifestPath)
            .then(result => assert(result))
            .then(() => fileRead(projectManifestPath))
            .then(result => expect(result).to.eql(projectData))
            .then(() => versioning.isInitialized(projectRepoDataPath))
            .then(result => assert(result === true));
        });

        it('projectCreate() creates a git commit for initialialization, but writing', () => {
          return versioning.log(projectRepoDataPath)
            .then(result => {
              //initialize, not first commit
              assert(result.length === 1, 'too many commits created');
            });
        });

        it('projectCreate() rejects if exists', () => {
          return persistence.projectCreate(projectId, {}, userId)
            .then(() => assert(false))
            .catch(err => expect(err).to.equal(errorAlreadyExists));
        });
      });

      describe('write + merge', () => {
        const userId = testUserId;

        const projectData = new Project(updateProjectWithAuthor());
        const projectId = projectData.id;
        const projectRepoDataPath = filePaths.createProjectDataPath(projectId);
        const projectManifestPath = filePaths.createProjectManifestPath(projectId);

        const blockData = Block.classless({ projectId });
        const blockId = blockData.id;
        const blockFileContents = { [blockId]: blockData };
        const blockManifestPath = filePaths.createBlockManifestPath(projectId);

        const projectPatch = { metadata: { description: 'fancy pantsy' } };
        const blockPatch = { rules: { role: 'promoter' } };

        //skip test suite if not using s3
        before(function () {
          if (s3.useRemote) {
            this.skip();
          }
        });

        it('projectWrite() creates repo if necessary', () => {
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => directoryExists(projectRepoDataPath))
            .then(result => assert(result, 'directory didnt exist!'))
            .then(() => versioning.isInitialized(projectRepoDataPath))
            .then(result => assert(result, 'was not initialized!'));
        });

        it('projectWrite() validates the project', () => {
          const invalidData = { my: 'data' };
          //start with write to reset
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => persistence.projectWrite(projectId, invalidData, userId))
            .then(() => assert(false, 'shouldnt happen'))
            .catch(err => expect(err).to.equal(errorInvalidModel))
            .then(() => fileRead(projectManifestPath))
            .then(result => expect(result).to.eql(projectData));
        });

        it('projectMerge() forces the ID', () => {
          const invalidData = { id: 'impossible' };
          const comparison = projectData;
          return persistence.projectMerge(projectId, invalidData, userId)
            .then(result => expect(result).to.eql(comparison));
        });

        it('projectWrite() overwrites the project', () => {
          const overwrite = projectData.merge(projectPatch);
          return persistence.projectWrite(projectId, overwrite, userId)
            .then(() => fileRead(projectManifestPath))
            .then(result => expect(result).to.eql(overwrite));
        });

        it('projectMerge() accepts a partial project', () => {
          const merged = merge({}, projectData, projectPatch);
          //start with write to reset
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => persistence.projectMerge(projectId, projectPatch, userId))
            .then(result => expect(result).to.eql(merged))
            .then(() => fileRead(projectManifestPath))
            .then(result => expect(result).to.eql(merged));
        });

        it('projectMerge() validates the project', () => {
          const invalidData = { metadata: 'impossible' };
          return persistence.projectMerge(projectId, invalidData, userId)
            .then(() => assert(false))
            .catch(err => expect(err).to.equal(errorInvalidModel));
        });

        it('blockWrite() creates block if necessary', () => {
          return persistence.blocksWrite(projectId, { [blockId]: blockData })
            .then(result => assert(result && result[blockId]));
        });

        it('blockWrite() validates the block', () => {
          const invalidData = { my: 'data' };
          //start with write to reset
          return persistence.blocksWrite(projectId, { [blockId]: blockData })
            .then(() => persistence.blocksWrite(projectId, { [blockId]: invalidData }))
            .then(() => assert(false, 'should not have written successfully'))
            .catch(err => {
              console.log(err);
              expect(err).to.equal(errorInvalidModel);
            })
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(blockFileContents));
        });

        it('blockWrite() ovewrwrites the block', () => {
          const overwrite = merge({}, blockData, blockPatch);
          const overwriteFileContents = { [blockId]: overwrite };
          return persistence.blocksWrite(projectId, { [blockId]: overwrite })
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(overwriteFileContents));
        });

        it('blockWrite() does not make the project commit', () => {
          return versioning.log(projectRepoDataPath).then(firstResults => {
            const overwrite = merge({}, blockData, blockPatch);
            return persistence.blocksWrite(projectId, { [blockId]: overwrite })
              .then(() => versioning.log(projectRepoDataPath))
              .then((secondResults) => {
                expect(secondResults.length).to.equal(firstResults.length);
              });
          });
        });

        it('blockMerge() accepts a partial block', () => {
          const merged = merge({}, blockData, blockPatch);
          const mergedFileContents = { [merged.id]: merged };
          //start with write to reset
          return persistence.blocksWrite(projectId, { [blockId]: blockData })
            .then(() => persistence.blocksMerge(projectId, { [blockId]: blockPatch }))
            .then(result => expect(result[blockId]).to.eql(merged))
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(mergedFileContents));
        });

        it('blockMerge() validates the block', () => {
          const invalidData = { metadata: 'impossible' };
          return persistence.blocksMerge(projectId, { [blockId]: invalidData })
            .then(() => assert(false))
            .catch(err => expect(err).to.equal(errorInvalidModel));
        });
      });

      describe('deletion', () => {
        const userId = testUserId;

        const projectData = new Project(updateProjectWithAuthor());
        const projectId = projectData.id;
        const projectRepoDataPath = filePaths.createProjectDataPath(projectId);
        const projectManifestPath = filePaths.createProjectManifestPath(projectId);
        const projectPermissionsPath = filePaths.createProjectPermissionsPath(projectId);
        const projectOldOwnersPath = filePaths.createProjectPath(projectId, filePaths.permissionsDeletedFileName);
        const trashPathProject = filePaths.createTrashPath(projectId);
        const trashPathProjectManifest = filePaths.createTrashPath(projectId, filePaths.projectDataPath, filePaths.manifestFilename);

        const blockData = Block.classless({ projectId });
        const blockId = blockData.id;
        const blockFileContents = { [blockId]: blockData };
        const blockManifestPath = filePaths.createBlockManifestPath(projectId, blockId);

        //skip test suite if not using s3
        before(function () {
          if (s3.useRemote) {
            this.skip();
          }
        });

        //hack(ish) - creating at beginning of each because chaining tests is hard, and beforeEach will encounter race condition

        it('projectDelete() moves the folder to the trash', () => {
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => fileRead(projectManifestPath))
            .then(result => expect(result).to.eql(projectData))
            .then(() => persistence.projectDelete(projectId))
            /*
             //for scenario of writing old permissions file
             .then(() => fileExists(projectManifestPath))
             .then(result => assert(true))
             .then(() => fileRead(projectPermissionsPath))
             .then(contents => assert(!contents.indexOf(userId) >= 0, 'user should not be present anymore'))
             .then(() => fileRead(projectOldOwnersPath))
             .then(contents => assert(contents.indexOf(userId) >= 0, 'user ID should be present'));
             */
            .then(() => directoryExists(trashPathProject))
            .then(() => fileRead(trashPathProjectManifest))
            .then(result => expect(result).to.eql(projectData));
        });

        it('blockDelete() deletes block', () => {
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => persistence.blocksWrite(projectId, { [blockId]: blockData }))
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(blockFileContents))
            .then(() => persistence.blocksDelete(projectId, blockId))
            .then(() => fileExists(blockManifestPath))
            .then(() => fileRead(blockManifestPath))
            .then(contents => expect(contents).to.eql({}));
        });

        it('blockDelete() does not create a commit', () => {
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => persistence.blocksWrite(projectId, { [blockId]: blockData }))
            .then(() => {
              return versioning.log(projectRepoDataPath)
                .then(firstResults => {
                  return persistence.blocksDelete(projectId, blockId)
                    .then(() => versioning.log(projectRepoDataPath))
                    .then((secondResults) => {
                      expect(secondResults.length).to.equal(firstResults.length);
                    });
                });
            });
        });
      });
    });
  });
});
