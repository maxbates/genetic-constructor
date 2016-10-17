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
} from '../../../../server/utils/fileSystem';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';

import * as filePaths from '../../../../server/utils/filePaths';
import * as versioning from '../../../../server/data/versioning';
import * as persistence from '../../../../server/data/persistence';
import * as s3 from '../../../../server/data/persistence/s3';

//todo - can probably de-dupe many of these setup / before() clauses, they are pretty similar

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', function persistenceTests() {
      //skip test suite if using s3 for tests
      before(() => {
        if (s3.useRemote) {
          this.skip();
        }
      });

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

        const blockSequence = 'acgtacgtacgatcgatcgac';
        const sequenceMd5 = md5(blockSequence);
        const sequenceFilePath = filePaths.createSequencePath(sequenceMd5);

        before(() => {
          return directoryDelete(projectPath)
            .then(() => directoryMake(projectPath))
            .then(() => directoryMake(projectDataPath))
            .then(() => directoryMake(blockDataPath))
            .then(() => fileWrite(projectManifestPath, projectData))
            .then(() => fileWrite(blockManifestPath, blockFileContents))
            .then(() => fileWrite(sequenceFilePath, blockSequence, false));
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

        it('sequenceExists() checks if sequence file exists', () => {
          return persistence.sequenceExists(sequenceMd5);
        });

        it('sequenceGet() returns the sequence as a string', () => {
          return persistence.sequenceGet(sequenceMd5)
            .then(result => expect(result).to.equal(blockSequence));
        });

        it('sequenceGet() rejects for md5 with no sequence', () => {
          const fakeMd5 = md5('nothingness');
          return persistence.sequenceGet(fakeMd5)
            .then(result => assert(false))
            .catch(err => expect(err).to.equal(errorDoesNotExist));
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

        before(() => {
          return persistence.projectCreate(projectId, projectData, userId)
            .then(() => persistence.blockWrite(projectId, blockData));
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

        const blockSequence = 'aaaaaccccccggggttttt';
        const sequenceMd5 = md5(blockSequence);
        const sequenceFilePath = filePaths.createSequencePath(sequenceMd5);

        const projectPatch = { metadata: { description: 'fancy pantsy' } };
        const blockPatch = { rules: { role: 'promoter' } };

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
          return persistence.blockWrite(projectId, blockData)
            .then(result => assert(result));
        });

        it('blockWrite() validates the block', () => {
          const invalidData = { my: 'data' };
          //start with write to reset
          return persistence.blockWrite(projectId, blockData)
            .then(() => persistence.blockWrite(blockId, invalidData, projectId))
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
          return persistence.blockWrite(projectId, overwrite)
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(overwriteFileContents));
        });

        it('blockWrite() does not make the project commit', () => {
          return versioning.log(projectRepoDataPath).then(firstResults => {
            const overwrite = merge({}, blockData, blockPatch);
            return persistence.blockWrite(projectId, overwrite)
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
          return persistence.blockWrite(projectId, blockData)
            .then(() => persistence.blockMerge(projectId, blockId, blockPatch))
            .then(result => expect(result).to.eql(merged))
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(mergedFileContents));
        });

        it('blockMerge() validates the block', () => {
          const invalidData = { metadata: 'impossible' };
          return persistence.blockMerge(projectId, blockId, invalidData)
            .then(() => assert(false))
            .catch(err => expect(err).to.equal(errorInvalidModel));
        });

        it('sequenceWrite() sets the sequence string', () => {
          return persistence.sequenceWrite(sequenceMd5, blockSequence)
            .then(() => fileRead(sequenceFilePath, false))
            .then(result => expect(result).to.equal(blockSequence));
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
            .then(() => persistence.blockWrite(projectId, blockData))
            .then(() => fileRead(blockManifestPath))
            .then(result => expect(result).to.eql(blockFileContents))
            .then(() => persistence.blocksDelete(projectId, blockId))
            .then(() => fileExists(blockManifestPath))
            .then(() => fileRead(blockManifestPath))
            .then(contents => expect(contents).to.eql({}));
        });

        it('blockDelete() does not create a commit', () => {
          return persistence.projectWrite(projectId, projectData, userId)
            .then(() => persistence.blockWrite(projectId, blockData))
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

      describe('versioning', () => {
        const userId = testUserId;

        let versionLog;
        let versions;
        const nonExistentSHA = '795c5751c8e0b0c9b5993ec81928cd89f7eefd27';
        const projectData = new Project(updateProjectWithAuthor());
        const projectId = projectData.id;
        const projectRepoDataPath = filePaths.createProjectDataPath(projectId);
        const newProject = projectData.merge({ projectData: 'new stuff' });

        const blockData = Block.classless({ projectId });
        const blockId = blockData.id;
        const newBlock = merge({}, blockData, { blockData: 'new data' });

        const blockSequence = 'acgcggcgcgatatatatcgcgcg';
        const sequenceMd5 = md5(blockSequence);

        before(() => {
          return persistence.projectCreate(projectId, projectData, userId) //3
            .then(() => persistence.blockWrite(projectId, blockData))
            .then(() => persistence.projectSave(projectId, userId)) //2
            .then(() => persistence.projectWrite(projectId, newProject, userId))
            .then(() => persistence.projectSave(projectId, userId)) //1
            .then(() => persistence.blockWrite(projectId, newBlock))
            .then(() => persistence.projectSave(projectId, userId)) //0
            .then(() => versioning.log(projectRepoDataPath))
            .then(log => {
              versionLog = log;
              versions = versionLog.map(commit => commit.sha);
            });
        });

        it('projectExists() rejects if invalid version', () => {
          return persistence.projectExists(projectId, 'invalidSHA')
            .then(result => assert(false, 'should not resolve'))
            .catch(err => assert(err === errorDoesNotExist, 'wrong error type -> function errored...'));
        });

        it('projectExists() rejects if version does not exist', () => {
          return persistence.projectExists(projectId, nonExistentSHA)
            .then(result => assert(false, 'should not resolve'))
            .catch(err => assert(err === errorDoesNotExist, 'wrong error type -> function errored...'));
        });

        it('projectExists() resolves if version exists', () => {
          return persistence.projectExists(projectId, versions[1]);
        });

        it('projectGet() rejects on if given invalid version', () => {
          return persistence.projectGet(projectId, nonExistentSHA)
            .then(result => assert(false, 'should not resolve'))
            .catch(err => assert(err === errorDoesNotExist, 'wrong error type -> function errored...'));
        });

        it('projectGet() resolves to correct file when given version', () => {
          return persistence.projectGet(projectId, versions[2])
            .then(project => expect(project).to.eql(projectData));
        });

        it('projectGet() defaults to latest version', () => {
          return persistence.projectGet(projectId)
            .then(project => expect(project).to.eql(Object.assign({}, newProject, {
              version: versions[0],
              lastSaved: versionLog[0].time
            })));
        });

        it('blockExists() rejects on invalid version', () => {
          return persistence.blocksExist(projectId, nonExistentSHA, blockId)
            .then(result => assert(false, 'should not resolve'))
            .catch(err => assert(err === errorDoesNotExist, 'wrong error type -> function errored...'));
        });

        it('blockExists() accepts a version', () => {
          return persistence.blocksExist(projectId, versions[2], blockId);
        });

        it('blockGet() accepts a version, gets version at that time', () => {
          return persistence.blocksGet(projectId, versions[2], blockId)
            .then(blockMap => blockMap[blockId])
            .then(block => expect(block).to.eql(blockData));
        });

        it('blockGet() defaults to latest version', () => {
          return persistence.blocksGet(projectId, false, blockId)
            .then(blockMap => blockMap[blockId])
            .then(block => expect(block).to.eql(newBlock));
        });

        it('sequenceWrite() does not create commit even if given blockId and projectId', () => {
          return persistence.sequenceWrite(sequenceMd5, blockSequence, blockId, projectId)
            .then(() => versioning.log(projectRepoDataPath))
            .then(log => {
              expect(log.length).to.equal(versionLog.length);
            });
        });
      });
    });
  });
});
