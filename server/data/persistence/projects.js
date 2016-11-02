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
import { pick, merge, values, forEach } from 'lodash';
import { errorDoesNotExist, errorNoPermission, errorInvalidModel } from '../../utils/errors';
import { validateId, validateBlock, validateProject } from '../../utils/validation';
import DebugTimer from '../../utils/DebugTimer';
import { dbHeadRaw, dbGet, dbPost, dbDelete, dbPruneResult } from '../middleware/db';

//TODO - CONSISTENT NAMING. MANY OF THESE OPERATIONS ARE REALLY ROLLUPS
//we have classes for blocks and projects, and this persistence module conflates the two. lets use rollup to be consistent. rename after this stuff is working...

/*********
 Helpers
 *********/
//maybe can deprecate these helpers, and just use the exported functions

//todo - this should resolve to false... need to update usages
//resolves to latest version
const _projectExists = (projectId, version) => {
  if (Number.isInteger(version)) {
    //todo - should use projectVersions module instead
  }

  return dbHeadRaw(`projects/${projectId}`)
    .then(resp => {
      return parseInt(resp.headers.get('Latest-Version'), 10);
    })
    .catch(resp => {
      if (resp.status === 404) {
        return Promise.reject(errorDoesNotExist);
      }

      console.log('error retrieving project HEAD');
      return Promise.reject(resp);
    });
};

//this only called when the project doesn't exist in projectWrite()
//should not be called if the project already exists
const _projectCreate = (projectId, userId, project = {}) => {
  //is there any other setup we want to do on creation?
  return dbPost(`projects/`, userId, project, {}, { id: projectId });
};

const _projectWrite = (projectId, userId, project = {}) => {
  return dbPost(`projects/${projectId}`, userId, project);
};

//todo - should check metadata and force version + lastSaved onto project
const _projectRead = (projectId, version) => {
  if (Number.isInteger(version)) {
    //todo - should use projectVersions module instead
  }

  return dbGet(`projects/${projectId}`)
    .then(dbPruneResult);
};

const _projectDelete = (projectId, userId) => {
  return dbDelete(`projects/${projectId}`);
};

/*********
 API
 *********/

//LIST

//actually gets rollups
export const getUserProjects = (userId) => {
  //dbGet returns { data, id, ... }
  return dbGet(`projects/owner/${userId}`)
    .then((projectInfos) => projectInfos.map(info => info.data))
    .catch(err => {
      if (err === errorDoesNotExist) {
        return [];
      }
      console.log('unexpected error getting users projects');
      return Promise.reject(err);
    });
};

export const getUserProjectIds = (userId) => {
  invariant(userId, 'user id required for getting project Ids');

  return getUserProjects(userId)
    .then(projects => {
      return projects.map(project => project.project.id);
    });
};

//EXISTS

export const projectExists = (projectId, version) => {
  return _projectExists(projectId, version);
};

//check access to a particular project
//ideally, would return a 403 on one call, rather than chaining two together
export const userOwnsProject = (userId, projectId, projectMustExist = false) => {
  return getUserProjectIds(userId)
    .then((projectIds) => {
      if (projectIds.indexOf(projectId) >= 0) {
        return true;
      }

      return projectExists(projectId)
        .then(project => Promise.reject(errorNoPermission))
        .catch(err => {
          //re-handle this from .then() above
          if (err === errorNoPermission) {
            return Promise.reject(errorNoPermission);
          }

          if (err === errorDoesNotExist && !projectMustExist) {
            return true;
          }

          if (err === errorDoesNotExist && projectMustExist) {
            return Promise.reject(errorDoesNotExist);
          }

          console.log('unexpected error checking project access');
          console.error(err);
          return Promise.reject(errorDoesNotExist);
        });
    });
};

//GET
//resolve with null if does not exist

//todo - use version module explicitly to get a version
export const projectGet = (projectId, version) => {
  return _projectRead(projectId, version)
    .catch(err => {
      console.log('got error reading');

      //todo - how to handle versioning error?
      if (err === errorDoesNotExist && !version) {
        return Promise.reject(errorDoesNotExist);
      }

      //let the error fall through, or uncaught error
      console.log('(persistence.projectGet) error reading project ' + projectId, err);
      return Promise.reject(err);
    });
};

//todo - use version module explicitly to get a version
//returns map, where blockMap.blockId === undefined if was missing
export const blocksGet = (projectId, version = false, ...blockIds) => {
  return projectGet(projectId, version)
    .then(roll => {
      if (!blockIds.length) {
        return roll.blocks;
      }
      return pick(roll.blocks, blockIds);
    });
};

//todo - use version module explicitly to get a version
//prefer blocksGet, this is for atomic checks
//rejects if the block is not present, and does not return a map (just the block), or null if doesnt exist
export const blockGet = (projectId, version = false, blockId) => {
  return projectGet(projectId, version)
    .then(roll => {
      const block = roll.blocks[blockId];
      if (!block) {
        return Promise.resolve(null);
      }
      return block;
    });
};

//SET (WRITE + MERGE)

//should return commit-like information (not just the project)
export const projectWrite = (projectId, roll = {}, userId, bypassValidation = false) => {
  const timer = new DebugTimer('projectWrite ' + projectId, { disabled: true });

  invariant(projectId && validateId(projectId), 'must pass a projectId to write project');
  invariant(typeof roll === 'object', 'project is required');
  invariant(typeof roll.project === 'object' && typeof roll.blocks === 'object', 'must pass rollup with project and blocks');
  invariant(!!userId, 'userID is necessary write project');

  //do we want to require userId? if so, need to update all block writing etc. to include userId in call, since block writing goes through this function
  //invariant(userId, 'user id is required to write project');

  //todo - when do we not want to overwrite project / blocks? verify not corrupting e.g. EGF project or tests

  //todo - assign fields version + lastSaved to match old projectSave()
  //can optimistically set them, and then make sure the version is the same after save, and overwrite if necessary
  //need to make sure dont write the wrong version
  //may want to force overwrite when we do projectGet() in case something wrong was in the DB

  merge(roll.project, {
    id: projectId,
    metadata: {
      authors: [userId], // (future) - merge author IDs, not just assign
    },
  });

  //force projectId, and ensure block Id matches block data
  forEach(roll.blocks, (block, blockId) => Object.assign(block, { id: blockId, projectId }));

  timer.time('models updated');

  if (process.env.NODE_ENV !== 'dev' && bypassValidation !== true) {
    const projectValid = validateProject(roll.project);
    const blocksValid = values(roll.blocks).every(block => validateBlock(block));
    if (!projectValid || !blocksValid) {
      return Promise.reject(errorInvalidModel);
    }
    timer.time('validated');
  }

  //if it doesn't exist, create the project
  return projectExists(projectId)
    .then(() => {
      return _projectWrite(projectId, userId, roll);
    })
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return _projectCreate(projectId, userId, roll);
      }
      return Promise.reject(err);
    })
    //receieves { data, version, id, owner, updatedAt, createdAt }
    .then(data => {
      timer.end('project written');
      return data;
    });
};

//merge a rollup
export const projectMerge = (projectId, project, userId) => {
  return projectGet(projectId)
    .then(oldProject => {
      const merged = merge({}, oldProject, project, { project: { id: projectId } });
      return projectWrite(projectId, merged, userId);
    });
};

//overwrite all blocks
export const blocksWrite = (projectId, userId, blockMap, overwrite = true) => {
  invariant(typeof projectId === 'string' && validateId(projectId), 'projectId must be string');
  invariant(typeof userId === 'string', 'userId must be a string');
  invariant(typeof blockMap === 'object', 'block map must be object');

  return projectGet(projectId)
    .then(roll => {
      //to overwrite the blocks passed, but not the whole blockMap / project
      if (overwrite === 'patch') {
        return Object.assign(roll, { blocks: Object.assign(roll.blocks, blockMap) });
      }
      if (overwrite === true) {
        return Object.assign(roll, { blocks: blockMap });
      }
      return merge(roll, { blocks: blockMap });
    }).then(roll => {
      return projectWrite(projectId, roll, userId)
      //return the roll
        .then(info => info.data);
    });
};

//merge all blocks
export const blocksMerge = (projectId, userId, blockMap) => {
  return blocksWrite(projectId, userId, blockMap, false);
};

export const blocksPatch = (projectId, userId, blockMap) => {
  return blocksWrite(projectId, userId, blockMap, 'patch');
};

//DELETE

export const projectDelete = (projectId, userId, forceDelete = false) => {
  if (forceDelete === true) {
    return _projectDelete(projectId, userId)
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
      return _projectDelete(projectId, userId);
    })
    //no need to commit... its deleted (and permissions out of scope of data folder)
    .then(() => projectId);
};

//should not be exposed on router... easy to get into a bad state
export const blocksDelete = (projectId, userId, ...blockIds) => {
  return blocksGet(projectId)
    .then(blockMap => {
      blockIds.forEach(blockId => {
        delete blockMap[blockId];
      });
      return blocksWrite(projectId, userId, blockMap);
    })
    .then(() => blockIds);
};

// PROJECT MANIFEST

export const projectGetManifest = (projectId, sha) => {
  return projectGet(projectId, sha)
    .then(result => result.project);
};

export const projectWriteManifest = (projectId, manifest = {}, userId, overwrite = true) => {
  invariant(projectId && validateId(projectId), 'must pass valid projectId');
  invariant(typeof manifest === 'object', 'project manifest must be object');
  invariant(typeof userId === 'string', 'must pass userId to write project manifest');

  //force project ID on whatever we're writing
  Object.assign(manifest, { id: projectId });

  //check valid before projectGet if we're overwriting
  if (overwrite && !validateProject(manifest)) {
    return Promise.reject(errorInvalidModel);
  }

  return projectGet(projectId)
    .then(roll => {
      const updated = (overwrite !== true) ?
        merge({}, roll, { project: manifest }) :
        Object.assign({}, roll, { project: manifest });

      //now, check if we merged
      if (!overwrite && !validateProject(updated.project)) {
        return Promise.reject(errorInvalidModel);
      }

      //projectWrite will return version etc., want to pass manifest
      return projectWrite(projectId, updated, userId)
        .then(info => info.data.project);
    });
};

export const projectMergeManifest = (projectId, manifest, userId) => {
  return projectWriteManifest(projectId, manifest, userId, false);
};
