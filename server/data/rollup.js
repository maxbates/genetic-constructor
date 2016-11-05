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
import { errorDoesNotExist } from '../utils/errors';
import * as sequencePersistence from './persistence/sequence';
import * as projectPersistence from './persistence/projects';
import { mapValues } from 'lodash';
import { getSequencesFromMap } from '../../src/utils/sequenceMd5';

/**
 * Given a rollup, get all the sequences for blocks in the form: { blockId : sequence }
 * @param rollup
 * @returns rollup, with sequence map: { project: {}, blocks: {}, sequences: { <blockId>: 'ACAGTCGACTGAC' } }
 */
//todo - would be nice to just make this an option in projectGet directly?
export const getSequencesGivenRollup = (rollup) => {
  const blockIdsToMd5s = mapValues(rollup.blocks, (block, blockId) => block.sequence.md5);

  return getSequencesFromMap(blockIdsToMd5s, (seqMd5) => sequencePersistence.sequenceGet(seqMd5))
    .then(sequences => Object.assign(rollup, { sequences }));
};

////// HELPERS ///////
//todo - move to a rollup class

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

/**
 * @description Recursively get contents (components + children) of a block (and returns block itself)
 * @param rootId {ID} root to get components of
 * @param projectId {ID=} Id of project, internal use (or force one)
 * @returns {object} { components: {}, options: {} }
 */
export const getContents = (rootId, projectId) => {
  return projectPersistence.projectGet(projectId)
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
