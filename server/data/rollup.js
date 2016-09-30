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
import { values } from 'lodash';

export const getProjectRollup = (projectId) => {
  //dont use Promise.all so we can handle errors of project not existing better
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
    });
};

export const writeProjectRollup = (projectId, rollup, userId, bypassValidation = false) => {
  //debug
  const start = process.hrtime();

  invariant(projectId, 'must pass a projectId');
  invariant(rollup && rollup.project && rollup.blocks, 'rollup must not be empty');
  invariant(typeof rollup.blocks === 'object', 'rollup expects blocks to be an object');

  const { project, blocks } = rollup;

  if (projectId !== project.id) {
    return Promise.reject('rollup project ID does not match');
  }

  return persistence.projectExists(projectId)
    .catch(err => {
      //if the project doesn't exist, let's make it
      if (err === errorDoesNotExist) {
        invariant(typeof userId !== 'undefined', 'userID is necessary to create a project from rollup');

        return persistence.projectCreate(projectId, project, userId);
      }
      return Promise.reject(err);
    })
    .then(() => {
      //validate all the blocks and project before we save, unless forcibly bypass
      if (process.env.NODE_ENV !== 'dev' && bypassValidation !== true) {
        const projectValid = validateProject(project);
        const blocksValid = values(blocks).every(block => validateBlock(block));
        if (!projectValid || !blocksValid) {
          return Promise.reject(errorInvalidModel);
        }
      }
    })
    //bypass validation on writes, since checking above anyway
    .then(() => Promise.all([
      persistence.projectWrite(projectId, project, userId, true),
      persistence.blocksWrite(projectId, blocks, true, true),
    ]))
    .then(() => {
      //debug
      if (process.env.NODE_ENV === 'test') {
        const mid = process.hrtime();
        const time = (mid[0] - start[0]) + ((mid[1] - start[1]) / Math.pow(10, 9));
        console.log('writing rollup for ' + userId + ' took ', time);
      }

      return rollup
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

//future - function which only returns the components of a project, not the list options? not sure what use case is though....
