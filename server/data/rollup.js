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
 * Utilities for saving + retrieving + querying rollups.
 *
 * Rollups are the form by which a project is transferred between client and server, and abstractly how projects are saved.
 *
 * Rollups take the form:
 *
 * {
 *   project: <projectManifest>,
 *    blocks: <blockMap>
 * }
 * @module rollup
 */
import invariant from 'invariant';
import { errorInvalidModel, errorDoesNotExist } from '../utils/errors';
import * as persistence from './persistence';
import { validateBlock, validateProject } from '../utils/validation';
import { getAllBlocksInProject } from './querying';
import * as sequencePersistence from './persistence/sequence';
import { mapValues, values } from 'lodash';
import DebugTimer from '../utils/DebugTimer';
import { getSequencesFromMap } from '../../src/utils/sequenceMd5';

/**
 * Given a rollup, get all the sequences for blocks in the form: { blockId : sequence }
 * @param rollup
 * @returns rollup, with sequence map: { project: {}, blocks: {}, sequences: { <blockId>: 'ACAGTCGACTGAC' } }
 */
export const getSequencesGivenRollup = (rollup) => {
  const blockIdsToMd5s = mapValues(rollup.blocks, (block, blockId) => block.sequence.md5);

  return getSequencesFromMap(blockIdsToMd5s, (seqMd5) => sequencePersistence.sequenceGet(seqMd5))
    .then(sequences => Object.assign(rollup, { sequences }));
};

// if withSequences === true, adds field `sequences` to roll
// e.g. { project: {}, blocks: {}, sequences: { blockId: 'ACAGTCGACTGAC } }
export const getProjectRollup = (projectId, withSequences = false) => {
  //get project explicitly first so can handle errors of project not more granularly
  return persistence.projectGet(projectId)
    .then(project => {
      if (!project) {
        return Promise.reject(errorDoesNotExist);
      }

      return getAllBlocksInProject(projectId)
        .then(blocks => {
          return {
            project,
            blocks,
          };
        });
    })
    .then(roll => {
      if (withSequences !== true) {
        return roll;
      }

      return getSequencesGivenRollup(roll);
    });
};

export const writeProjectRollup = (projectId, rollup, userId, bypassValidation = false) => {
  const timer = new DebugTimer(`rollup.write ${projectId} (${userId})`, { disabled: true });

  invariant(projectId, 'must pass a projectId');
  invariant(rollup && rollup.project && rollup.blocks, 'rollup must not be empty');
  invariant(typeof rollup.blocks === 'object', 'rollup expects blocks to be an object');
  invariant(typeof userId !== 'undefined', 'userID is necessary to create a project from rollup');

  const { project, blocks } = rollup;

  if (projectId !== project.id) {
    return Promise.reject('rollup project ID does not match');
  }

  //need to check existence + create here, avoid race of project setup vs. block write
  return persistence.projectExists(projectId)
    .catch(err => {
      timer.time('init project creation');
      //if the project doesn't exist, let's make it
      if (err === errorDoesNotExist) {
        return persistence.projectCreate(projectId, project, userId);
      }
      return Promise.reject(err);
    })
    .then(() => {
      timer.time('project setup');
      //validate all the blocks and project before we save, unless forcibly bypass
      if (process.env.NODE_ENV !== 'dev' && bypassValidation !== true) {
        const projectValid = validateProject(project);
        const blocksValid = values(blocks).every(block => validateBlock(block));
        if (!projectValid || !blocksValid) {
          return Promise.reject(errorInvalidModel);
        }
        timer.time('validated');
      }
    })
    //bypass validation on writes, since checking above anyway
    .then(() => Promise.all([
      persistence.projectWrite(projectId, project, userId, true),
      persistence.blocksWrite(projectId, blocks, true, true),
    ]))
    .then(() => {
      timer.end('files written');
      return rollup;
    });
};

//helper
const getBlockInRollById = (id, roll) => roll.blocks[id];

//given block ID and rollup, gets all options
//returns object
const getOptionsGivenRollup = (id, roll) => {
  const block = getBlockInRollById(id, roll);
  const { options } = block;

  return Object.keys(options)
    .map(optionId => getBlockInRollById(optionId, roll))
    .reduce((acc, option) => Object.assign(acc, { [option.id]: option }), {});
};

//given a rollup and rootId, recursively gets components of root block (and root block itself)
//returns object
const getComponentsRecursivelyGivenRollup = (rootId, projectRollup, acc = {}) => {
  const root = getBlockInRollById(rootId, projectRollup);

  if (!root) {
    console.error(`couldnt find ${rootId} in rollup ${projectRollup.project.id}`);
    throw new Error(errorDoesNotExist);
  }

  acc[rootId] = root;

  //recurse
  root.components.forEach(compId => getComponentsRecursivelyGivenRollup(compId, projectRollup, acc));

  return acc;
};

//returns object { components: <map> , options: <map> }
export const getContentsRecursivelyGivenRollup = (rootId, rollup) => {
  const components = getComponentsRecursivelyGivenRollup(rootId, rollup);

  const options = Object.keys(components)
    .map(compId => components[compId])
    .filter(comp => comp.rules.list === true)
    .reduce((optionsAcc, component) => {
      const componentOptions = getOptionsGivenRollup(component.id, rollup);
      return Object.assign(optionsAcc, componentOptions);
    }, {});

  return {
    components,
    options,
  };
};

export const getContents = (rootId, projectId) => {
  return getProjectRollup(projectId)
    .then(rollup => getContentsRecursivelyGivenRollup(rootId, rollup));
};

/**
 * @description Recursively get children of a block (and returns block itself)
 * @param rootId {ID} root to get components of
 * @param projectId {ID=} Id of project, internal use (or force one)
 * @returns {object} with keys of blocks
 */
export const getComponents = (rootId, projectId) => {
  return getContents(rootId, projectId)
    .then(({ components }) => components);
};

/**
 * @description Recursively get all options of a block and its components. Does not include block itself
 * @param rootId {ID} root to get components of
 * @param projectId {ID=} Id of project, internal use (or force one)
 * @returns {object} with keys of blocks
 */
export const getOptions = (rootId, projectId) => {
  return getContents(rootId, projectId)
    .then(({ options }) => options);
};
