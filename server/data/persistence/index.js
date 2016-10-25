/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
/**
 * Interface for checking existence / creating / replacing / merging / deleting instances
 * @module persistence
 */
import invariant from 'invariant';
import path from 'path';
import { merge, values, forEach } from 'lodash';
import { errorDoesNotExist, errorAlreadyExists, errorInvalidModel } from '../../utils/errors';
import { validateBlock, validateProject, validateOrder } from '../../utils/validation';
import * as filePaths from '../middleware/filePaths';
import * as versioning from '../git-deprecated/git';
import * as commitMessages from '../git-deprecated/commitMessages';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
  fileMerge,
  directoryMake,
  directoryDelete,
  directoryMove,
} from '../middleware/fileSystem';
import * as permissions from '../permissions';
import DebugTimer from '../../utils/DebugTimer';

//todo - deprecate this file, in favor of /projects folder

/*********
 Helpers
 *********/

// EXISTENCE

const _projectExists = (projectId, sha) => {
  const manifestPath = filePaths.createProjectManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);

  if (!sha) {
    return fileExists(manifestPath);
  }
  return versioning.versionExists(projectDataPath, sha);
};

//this is kinda expensive, so shouldnt just call it all the time all willy-nilly
const _blocksExist = (projectId, sha = false, ...blockIds) => {
  invariant(blockIds.length > 0, 'must pass block ids');

  const manifestPath = filePaths.createBlockManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const relativePath = path.relative(projectDataPath, manifestPath);

  if (!sha) {
    return fileRead(manifestPath)
      .then(blocks => {
        if (blockIds.every(blockId => !!blocks[blockId])) {
          return Promise.resolve(true);
        }
        return Promise.reject(errorDoesNotExist);
      });
  }

  return versioning.checkout(projectDataPath, relativePath, sha)
    .then(string => JSON.parse(string))
    .then(blocks => blockIds.every(blockId => !!blocks[blockId]));
};

const _orderExists = (orderId, projectId) => {
  const manifestPath = filePaths.createOrderManifestPath(orderId, projectId);
  return fileExists(manifestPath);
};

// READING

const _projectRead = (projectId, sha) => {
  const manifestPath = filePaths.createProjectManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const relativePath = path.relative(projectDataPath, manifestPath);

  if (!sha) {
    return fileRead(manifestPath);
  }

  //todo - should forcibly assign sha version to the project
  return versioning.checkout(projectDataPath, relativePath, sha)
    .then(string => JSON.parse(string));
};

//if any block doesnt exist, then it just comes as undefined in the map
const _blocksRead = (projectId, sha = false, ...blockIds) => {
  const manifestPath = filePaths.createBlockManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const relativePath = path.relative(projectDataPath, manifestPath);

  if (!sha) {
    return fileRead(manifestPath)
      .then(blocks => {
        return blockIds.length ?
          blockIds.reduce((acc, blockId) => Object.assign(acc, { [blockId]: blocks[blockId] }), {}) :
          blocks;
      });
  }

  //untested
  console.warn('untested - getting blocks with a sha');
  return versioning.checkout(projectDataPath, relativePath, sha)
    .then(string => JSON.parse(string))
    .then(blocks => {
      return blockIds.length ?
        blockIds.reduce((acc, blockId) => Object.assign(acc, { [blockId]: blocks[blockId] }), {}) :
        blocks;
    });
};

const _orderRead = (orderId, projectId) => {
  const manifestPath = filePaths.createOrderManifestPath(orderId, projectId);
  return fileRead(manifestPath);
};

// SETUP

const _projectSetup = (projectId, userId) => {
  const timer = new DebugTimer('projectSetup ' + projectId, { disabled: true });

  const projectPath = filePaths.createProjectPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const orderDirectory = filePaths.createOrderDirectoryPath(projectId);
  const blockDirectory = filePaths.createBlockDirectoryPath(projectId);
  const blockManifestPath = filePaths.createBlockManifestPath(projectId);
  const fileDirectory = filePaths.createProjectFilesDirectoryPath(projectId);

  return directoryMake(projectPath)
    .then(() => Promise.all([
      directoryMake(projectDataPath),
      directoryMake(orderDirectory),
      directoryMake(blockDirectory),
      directoryMake(fileDirectory),
    ]))
    .then(() => {
      timer.time('directories made');
      return Promise.all([
        fileWrite(blockManifestPath, {}), //write an empty file in case try to merge with it
        permissions.createProjectPermissions(projectId, userId),
      ]);
    })
    .then(() => {
      timer.time('initial files written');
      return versioning.initialize(projectDataPath, userId);
    })
    .then((path) => {
      timer.end('versioned');
      return path;
    });
};

const _orderSetup = (orderId, projectId) => {
  const orderDirectory = filePaths.createOrderPath(orderId, projectId);
  return directoryMake(orderDirectory);
};

// WRITING

const _projectWrite = (projectId, project = {}) => {
  const manifestPath = filePaths.createProjectManifestPath(projectId);
  return fileWrite(manifestPath, project);
};

const _blocksWrite = (projectId, blockMap = {}, overwrite = false) => {
  const manifestPath = filePaths.createBlockManifestPath(projectId);
  invariant(typeof blockMap === 'object', 'must pass a map of block ids to blocks');

  return (overwrite === true) ?
    fileWrite(manifestPath, blockMap) :
    fileMerge(manifestPath, blockMap);
};

const _orderWrite = (orderId, order = {}, projectId) => {
  const manifestPath = filePaths.createOrderManifestPath(orderId, projectId);
  return fileWrite(manifestPath, order);
};

const _orderRollupWrite = (orderId, rollup, projectId) => {
  const orderPath = filePaths.createOrderProjectManifestPath(orderId, projectId);
  return fileWrite(orderPath, rollup);
};

// COMMITS

//expects a well-formed commit message from commitMessages.js
const _projectCommit = (projectId, userId, message) => {
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const commitMessage = !message ? commitMessages.messageProject(projectId) : message;
  return versioning.commit(projectDataPath, commitMessage, userId)
    .then(sha => versioning.getCommit(projectDataPath, sha));
};

/*********
 API
 *********/

//EXISTS

export const projectExists = (projectId, sha) => {
  return _projectExists(projectId, sha);
};

//resolve if all blockIds exist, rejects if not
export const blocksExist = (projectId, sha = false, ...blockIds) => {
  return _blocksExist(projectId, sha, ...blockIds);
};

export const orderExists = (orderId, projectId) => {
  return _orderExists(orderId, projectId);
};

const projectAssertNew = (projectId) => {
  return projectExists(projectId)
    .then(() => Promise.reject(errorAlreadyExists))
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(projectId);
      }
      return Promise.reject(err);
    });
};

/*
 const blockAssertNew = (blockId, projectId) => {
 return blocksExist(projectId, false, blockId)
 .then(() => Promise.reject(errorAlreadyExists))
 .catch((err) => {
 if (err === errorDoesNotExist) {
 return Promise.resolve(blockId);
 }
 return Promise.reject(err);
 });
 };
 */

const orderAssertNew = (orderId, projectId) => {
  return orderExists(orderId, projectId)
    .then(() => Promise.reject(errorAlreadyExists))
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(orderId);
      }
      return Promise.reject(err);
    });
};

//GET
//resolve with null if does not exist

export const projectGet = (projectId, sha) => {
  return _projectRead(projectId, sha)
    .catch(err => {
      console.log('(persistence.projectGet) error reading project ' + projectId, err);
      if (err === errorDoesNotExist && !sha) {
        return Promise.resolve(null);
      }
      //let the versioning error fall through, or uncaught error
      return Promise.reject(err);
    });
};

//returns map, where blockMap.blockId === undefined if was missing
export const blocksGet = (projectId, sha = false, ...blockIds) => {
  return _blocksRead(projectId, sha, ...blockIds)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
};

//prefer blocksGet, this is for atomic checks
//rejects if the block is not present, and does not return a map (just the block), or null if doesnt exist
export const blockGet = (projectId, sha = false, blockId) => {
  return _blocksRead(projectId, sha, blockId)
    .then(blockMap => {
      const block = blockMap[blockId];
      if (!block) {
        return Promise.resolve(null);
      }
      return block;
    });
};

export const orderGet = (orderId, projectId) => {
  return _orderRead(orderId, projectId)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
};

//CREATE

export const projectCreate = (projectId, project, userId) => {
  invariant(typeof userId !== 'undefined', 'user id is required');

  //force the user as author of the project
  merge(project, { metadata: { authors: [userId] } });

  return projectAssertNew(projectId)
    .then(() => _projectSetup(projectId, userId))
    .then(() => _projectWrite(projectId, project))
    //MAY keep this initial commit message, even when not auto-commiting for all atomic operations
    //since create is a different operation than just called projectWrite / projectMerge
    //.then(() => _projectCommit(projectId, userId, commitMessages.messageCreateProject(projectId)))
    .then(() => project);
};

//SET (WRITE + MERGE)

export const projectWrite = (projectId, project = {}, userId, bypassValidation = false) => {
  const timer = new DebugTimer('projectWrite ' + projectId, { disabled: true });

  invariant(typeof project === 'object', 'project is required');
  invariant(userId, 'user id is required to write project');

  //todo (future) - merge author IDs, not just assign
  const authors = [userId];

  const idedProject = merge({}, project, {
    id: projectId,
    metadata: {
      authors,
    },
  });

  if (bypassValidation !== true && !validateProject(idedProject)) {
    return Promise.reject(errorInvalidModel);
  }

  //create directory etc. if doesn't exist
  return projectExists(projectId)
    .catch(() => _projectSetup(projectId, userId))
    .then(() => {
      timer.time('setup');
      return _projectWrite(projectId, idedProject);
    })
    //.then(() => _projectCommit(projectId, userId))
    .then(() => {
      timer.end('writing complete');
      return idedProject;
    });
};

//overwrite all blocks
export const blocksWrite = (projectId, blockMap, overwrite = true, bypassValidation = false) => {
  invariant(typeof projectId === 'string', 'projectId must be string');
  invariant(typeof blockMap === 'object', 'block map must be object');

  if (bypassValidation !== true && !values(blockMap).every(block => validateBlock(block))) {
    return Promise.reject(errorInvalidModel);
  }

  //force projectid
  forEach(blockMap, (block, blockId) => Object.assign(block, { projectId }));

  return _blocksWrite(projectId, blockMap, overwrite)
    .then(() => blockMap);
};

export const projectMerge = (projectId, project, userId) => {
  return projectGet(projectId)
    .then(oldProject => {
      const merged = merge({}, oldProject, project, { id: projectId });
      return projectWrite(projectId, merged, userId);
    });
};

//merge all blocks
export const blocksMerge = (projectId, blockMap) => {
  return blocksWrite(projectId, blockMap, false);
};

export const orderWrite = (orderId, order, projectId, roll) => {
  const idedOrder = Object.assign({}, order, {
    projectId,
    id: orderId,
  });

  if (!validateOrder(idedOrder)) {
    return Promise.reject(errorInvalidModel);
  }

  return orderAssertNew(orderId, projectId)
    .then(() => _orderSetup(orderId, projectId))
    .then(() => Promise.all([
      _orderWrite(orderId, idedOrder, projectId),
      _orderRollupWrite(orderId, roll, projectId),
    ]))
    .then(() => idedOrder);
};

//DELETE

export const projectDelete = (projectId, forceDelete = false) => {
  const projectPath = filePaths.createProjectPath(projectId);
  const trashPath = filePaths.createTrashPath(projectId);

  if (forceDelete === true) {
    return directoryDelete(projectPath)
      .then(() => projectId);
  }

  return projectExists(projectId)
    .then(() => projectGet(projectId))
    .then(project => {
      if (project && project.isSample) {
        return Promise.reject('cannot delete sample projects');
      }
    })
    .then(() => {
      // DEPRECATED - ACTUALLY DELETE
      //const projectPath = filePaths.createProjectPath(projectId);
      //return directoryDelete(projectPath);

      /*
       //DEPRECATED - CHANGE PERMISSIONS FILE
       //dont want to actually delete it.. just delete the permissions (move to a new file)
       const projectPermissionsPath = filePaths.createProjectPermissionsPath(projectId);
       const deletedOwnerPath = filePaths.createProjectPath(projectId, filePaths.permissionsDeletedFileName);
       return fileRead(projectPermissionsPath)
       .then(contents => {
       return fileWrite(projectPermissionsPath, [])
       //but also should track somewhere who used to own it...
       .then(() => fileWrite(deletedOwnerPath, contents));
       });
       */

      //MOVE TO TRASH FOLDER
      return directoryDelete(trashPath)
        .then(() => directoryMove(projectPath, trashPath));
    })
    //no need to commit... its deleted (and permissions out of scope of data folder)
    .then(() => projectId);
};

export const blocksDelete = (projectId, ...blockIds) => {
  return blocksGet(projectId)
    .then(blockMap => {
      blockIds.forEach(blockId => {
        delete blockMap[blockId];
      });
      return blocksWrite(projectId, blockMap);
    })
    .then(() => blockIds);
};

//not sure why you would do this...
export const orderDelete = (orderId, projectId) => {
  const orderPath = filePaths.createOrderManifestPath(orderId, projectId);
  return orderId(orderId, projectId)
    .then(() => fileDelete(orderPath))
    .then(() => orderId);
};

//SAVE

//e.g. autosave
export const projectSave = (projectId, userId, messageAddition) => {
  const timer = new DebugTimer('projectSave ' + projectId, { disabled: true });
  const message = commitMessages.messageSave(projectId, messageAddition);
  return _projectCommit(projectId, userId, message)
    .then(commit => {
      //not only create the commit, but then save the project so that is has the right commit (but dont commit again)
      //but still return the commit
      timer.time('committed');
      return projectMerge(projectId, {
        version: commit.sha,
        lastSaved: commit.time,
      }, userId)
        .then(() => {
          timer.end('merged');
          return commit;
        });
    });
};

//explicit save aka 'snapshot'
export const projectSnapshot = (projectId, userId, messageAddition) => {
  const message = commitMessages.messageSnapshot(projectId, messageAddition);
  return _projectCommit(projectId, userId, message);
};
