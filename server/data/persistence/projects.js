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
import { dbHeadRaw, dbHead, dbGet, dbPost, dbDelete, dbPruneResult } from '../middleware/db';

//TODO - CONSISTENT NAMING. MANY OF THESE OPERATIONS ARE REALLY ROLLUPS
//we have classes for blocks and projects, and this persistence module conflates the two. lets use rollup to be consistent. rename after this stuff is working...

/*********
 Helpers
 *********/

//for project Get / Write
//expects data, version, id, createdAt, updatedAt
//note - makes testing a lot more complicated, since fields may change when written on server
const mergeMetadataOntoProject = (data) => {
  const transformedData = {
    data: data.data,
    id: data.id,
    version: parseInt(data.version, 10),
    updated: (new Date(data.updatedAt)).valueOf(),
    created: (new Date(data.createdAt)).valueOf(),
    owner: data.owner,
  };

  merge(transformedData.data, {
    project: {
      version: transformedData.version,
      metadata: {
        updated: transformedData.updated,
      },
    },
  });

  return transformedData;
};

/*********
 API
 *********/

//LIST

export const getUserLastProjectId = (userId) => {
  return dbHead(`projects/owner/${userId}`)
    .then(resp => resp.headers.get('Last-Project'));
};

//actually gets rollups
export const getUserProjects = (userId, fetchBlocks = false) => {
  //dbGet returns { data, id, ... }
  return dbGet(`projects/owner/${userId}?blocks=${fetchBlocks}`)
    .then((projectInfos) => projectInfos.map(dbPruneResult))
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

//todo - this should resolve to false... need to update usages (an dkeep snapshots, orders, etc. in sync)
//resolves to latest version
export const projectExists = (projectId, version) => {
  if (Number.isInteger(version)) {
    //todo - use versioning module
    invariant(false, 'no! use versioning module directly')
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

//check access to a particular project
//ideally, would return a 403 on one call, rather than chaining two together
//todo - move to a HEAD call
export const userOwnsProject = (userId, projectId) => {
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

          //we expect this if doesnt exist, just to be explicit
          if (err === errorDoesNotExist) {
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

export const projectGet = (projectId, version) => {
  if (Number.isInteger(version)) {
    //todo - use version module explicitly to get a version
    invariant(false, 'no! use versioning module directly')
  }

  return dbGet(`projects/${projectId}`)
    .then(mergeMetadataOntoProject)
    .then(dbPruneResult)
    .catch(err => {
      console.log('[projectGet] got error reading', err);

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

//todo - should userId be the first argument? update orders if so
// see mergeMetadataOntoProject() above to see what is returned
export const projectWrite = (projectId, roll = {}, userId, bypassValidation = false) => {
  const timer = new DebugTimer('projectWrite ' + projectId, { disabled: true });

  invariant(projectId && validateId(projectId), 'must pass a projectId to write project');
  invariant(typeof roll === 'object', 'project is required');
  invariant(typeof roll.project === 'object' && typeof roll.blocks === 'object', 'must pass rollup with project and blocks');
  invariant(!!userId, 'userID is necessary write project');

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
    .then(version => {
      //increment the latest version + 1 as version of this project
      //write the data in the database correctly to match the version
      //we can optimistically set this, since we will always be creating a new one with writes
      roll.project.version = version + 1;

      return dbPost(`projects/${projectId}`, userId, roll)
        .then(mergeMetadataOntoProject);
    })
    .catch((err) => {
      if (err === errorDoesNotExist) {
        //NB: should not be called if the project already exists
        //is there any other setup we want to do on creation?
        return dbPost(`projects/`, userId, roll, {}, { id: projectId })
          .then(mergeMetadataOntoProject);
      }
      return Promise.reject(err);
    })
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

const _projectDelete = (projectId, userId) => {
  return dbDelete(`projects/${projectId}`)
    .then(resp => resp.json());
};


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

export const projectGetManifest = (projectId, version) => {
  return projectGet(projectId, version)
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
