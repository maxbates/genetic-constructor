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
import { merge, values, forEach } from 'lodash';
import { errorDoesNotExist, errorAlreadyExists, errorInvalidModel } from '../../utils/errors';
import { validateBlock, validateProject, validateOrder } from '../../utils/validation';
import DebugTimer from '../../utils/DebugTimer';

/*********
 Helpers
 *********/

const _projectExists = (projectId, version) => {
  //todo
};

//resolve if all blockIds exist, rejects if not
//this is kinda expensive, so shouldnt just call it all the time all willy-nilly
const _blocksExist = (projectId, version = false, ...blockIds) => {
  invariant(blockIds.length > 0, 'must pass block ids');
  //todo
};

const _projectRead = (projectId, version) => {
  //todo
};

//if any block doesnt exist, then it just comes as undefined in the map
const _blocksRead = (projectId, version = false, ...blockIds) => {
  //todo
};

const _projectWrite = (projectId, project = {}) => {
  //todo
};

const _blocksWrite = (projectId, blockMap = {}, overwrite = false) => {
  //todo
};

const _projectSetup = (projectId, userId) => {
  //todo
};

const _projectDelete = (projectId, userId) => {
  //todo
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

//todo - update use, so can see if exists, and setup if not
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

//CREATE

export const projectCreate = (projectId, project, userId) => {
  invariant(typeof userId !== 'undefined', 'user id is required');

  //force the user as author of the project
  merge(project, { metadata: { authors: [userId] } });

  return projectAssertNew(projectId)
    .then(() => _projectSetup(projectId, userId))
    .then(() => _projectWrite(projectId, project))
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

//merge a single block
//to write a single block... but in general you should write many at once using blocksMerge / blocksWrite
export const blockMerge = (projectId, blockId, patch) => {
  return blocksGet(projectId, false, blockId)
    .then(blockMap => {
      const oldBlock = blockMap[blockId];
      const merged = merge({}, oldBlock, patch, {
        projectId,
        id: blockId,
      });

      if (!validateBlock(merged)) {
        return Promise.reject(errorInvalidModel);
      }

      return blocksMerge(projectId, { [merged.id]: merged });
    })
    .then(blockMap => blockMap[blockId]);
};

//deprecate
//write/overwrite a single block
//prefer blocksWrite / blocksMerge, but for atomic operations this is ok (or when want to just write on block)
export const blockWrite = (projectId, block) => {
  if (!validateBlock(block)) {
    return Promise.reject(errorInvalidModel);
  }

  return blocksGet(projectId)
    .then(blockMap => {
      //get the whole map, and overwrite the one we're interested in
      Object.assign(blockMap, { [block.id]: block });
      return blocksWrite(projectId, blockMap);
    })
    .then(blockMap => blockMap[block.id]);
};

//DELETE

//todo - change signature to require UserId (update all usages)
export const projectDelete = (projectId, forceDelete = false) => {
  if (forceDelete === true) {
    //todo - return projectId
  }

  return projectExists(projectId)
    .then(() => projectGet(projectId))
    .then(project => {
      if (project && project.isSample) {
        return Promise.reject('cannot delete sample projects');
      }
    })
    .then(() => {
      //todo - pass userId
      _projectDelete(projectId);
    })
    //no need to commit... its deleted (and permissions out of scope of data folder)
    .then(() => projectId);
};

//deprecate
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

//SAVE
//todo - should this stuff go into versioning? what are the dependencies?

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
