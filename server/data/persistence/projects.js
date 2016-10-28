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
import { errorDoesNotExist, errorInvalidModel } from '../../utils/errors';
import { validateBlock, validateProject } from '../../utils/validation';
import DebugTimer from '../../utils/DebugTimer';
import { dbGet, dbPost, dbDelete, dbPruneResult } from '../middleware/db';

//TODO - CONSISTENT NAMING. MANY OF THESE OPERATIONS ARE REALLY ROLLUPS
//we have classes for blocks and projects, and this persistence module conflates the two. lets use rollup to be consistent. rename after this stuff is working...

/*********
 Helpers
 *********/
//maybe can deprecate these helpers, and just use the exported functions

//todo - this should resolve to false... need to update usages
//todo - a HEAD point might be useful here - get lastModified, version, etc.
const _projectExists = (projectId, version) => {
  if (!!version) {
    //todo
  }

  return dbGet(`projects/${projectId}`)
    .then(() => true)
    .catch(err => (err === errorDoesNotExist) ? Promise.reject(errorDoesNotExist) : Promise.reject(err));
};

const _projectCreate = (projectId, userId, project = {}) => {
  //is there any other setup we want to do on creation?

  return dbPost(`projects/`, userId, project, {}, { id: projectId });
};

const _projectWrite = (projectId, userId, project = {}) => {
  return dbPost(`projects/${projectId}`, userId, project);
};

const _projectRead = (projectId, version) => {
  if (!!version) {
    //todo
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

export const getUserProjectIds = (userId) => {
  return dbGet(`projects/owner/${userId}`)
    .then((projectInfos) => projectInfos.map(info => info.id));
};

//EXISTS

export const projectExists = (projectId, sha) => {
  return _projectExists(projectId, sha);
};

//GET
//resolve with null if does not exist

export const projectGet = (projectId, sha) => {
  return _projectRead(projectId, sha)
    .catch(err => {
      //todo - how to handle versioning error?
      if (err.status === 404 && !sha) {
        //todo - this should reject with appropriate error
        //return Promise.reject(errorDoesNotExist);
        return Promise.resolve(null);
      }

      //let the error fall through, or uncaught error
      console.log('(persistence.projectGet) error reading project ' + projectId, err);
      return Promise.reject(err);
    });
};

//returns map, where blockMap.blockId === undefined if was missing
export const blocksGet = (projectId, sha = false, ...blockIds) => {
  return projectGet(projectId, sha)
    .then(roll => {
      return pick(roll.blocks, blockIds);
    });
};

//prefer blocksGet, this is for atomic checks
//rejects if the block is not present, and does not return a map (just the block), or null if doesnt exist
export const blockGet = (projectId, sha = false, blockId) => {
  return projectGet(projectId, sha)
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
//todo - expect rollup. This effectively is rollup.writeProjectRollup() v2
export const projectWrite = (projectId, roll = {}, userId, bypassValidation = false) => {
  const timer = new DebugTimer('projectWrite ' + projectId, { disabled: true });

  invariant(typeof roll === 'object', 'project is required');
  invariant(typeof roll.project === 'object' && typeof roll.blocks === 'object', 'must pass rollup with project and blocks');

  //do we want to require userId? if so, need to update all block writing etc. to include userId in call, since block writing goes through this function
  //invariant(userId, 'user id is required to write project');

  //todo - when do we not want to overwrite project / blocks? verify not corrupting e.g. EGF project or tests

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

//overwrite all blocks
//todo - require UserId, pass to projectWrite ---- update usages
export const blocksWrite = (projectId, blockMap, overwrite = true, bypassValidation = false) => {
  invariant(typeof projectId === 'string', 'projectId must be string');
  invariant(typeof blockMap === 'object', 'block map must be object');

  return projectGet(projectId)
    .then(roll => {
      if (overwrite === true) {
        return Object.assign({}, roll, { blocks: blockMap });
      }
      return merge({}, roll, { blocks: blockMap });
    }).then(roll => {
      //todo - need userId
      return projectWrite(projectId, roll)
      //return the roll
        .then(info => info.data);
    });
};

export const projectMerge = (projectId, project, userId) => {
  return projectGet(projectId)
    .then(oldProject => {
      const merged = merge({}, oldProject, project, { project: { id: projectId } });
      return projectWrite(projectId, merged, userId);
    });
};

//merge all blocks
export const blocksMerge = (projectId, blockMap) => {
  return blocksWrite(projectId, blockMap, false);
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

// PROJECT MANIFEST

export const projectGetManifest = (projectId, sha) => {
  return projectGet(projectId, sha)
    .then(result => result.project);
};

export const projectWriteManifest = (projectId, manifest = {}, userId, overwrite = true, bypassValidation = false) => {
  invariant(projectId, 'must pass valid projectId');
  invariant(typeof manifest === 'object', 'project manifest must be object');
  invariant(typeof userId === 'string', 'must pass userId to write project manifest');

  return projectGet(projectId)
    .then(roll => {
      const updated = (overwrite === true) ?
        merge({}, roll, { project: manifest }) :
        Object.assign({}, roll, { project: manifest });

      Object.assign(updated.project, { id: projectId });

      invariant(validateProject(updated.project), 'project must be valid before writing it');

      //projectWrite will return version etc., want to pass manifest
      return projectWrite(updated)
        .then(info => info.data.project);
    });
};

export const projectMergeManifest = (projectId, manifest, userId) => {
  return projectWriteManifest(projectId, manifest, userId, false);
};
