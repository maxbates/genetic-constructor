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
 * Utilities for querying the user information, wrapping file system queries etc.
 * @module querying
 */
import * as filePaths from './middleware/filePaths';
import * as versioning from './git-deprecated/git';
import invariant from 'invariant';
import { merge, filter, values } from 'lodash';
import { getUserProjects, getUserProjectIds } from './persistence/projects';

// key for no role rule
const untypedKey = 'none';

//todo - remove many of these functions - they are just persistence things, not really queries / migrate to new APIs

//search each permissions.json by user ID to find projects they have access to
export const listProjectsWithAccess = (userId) => {
  return getUserProjectIds(userId)
    .catch(resp => {
      console.error(new Error('error checking for initial acccess'));
      console.log(resp);
      return [];
    });
};

export const getAllProjectManifests = (userId) => {
  invariant(userId, 'user id is required to get list of manifests');

  return getUserProjects(userId)
    .then(projectInfos => projectInfos.map(info => info.data))
    .then(rolls => rolls.map(roll => roll.project));
};

//todo - update to new API
//todo - should go in versioning file, not a query
export const getProjectVersions = (projectId) => {
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  return versioning.log(projectDataPath);
};

//returns blockmap
export const getAllBlocks = (userId) => {
  return getUserProjects(userId)
    .then(projectInfos => projectInfos.map(info => info.data))
    .then(rolls => rolls.map(roll => roll.blocks))
    .then(projectBlockMaps => merge({}, ...projectBlockMaps));
};

export const getAllBlocksFiltered = (userId, ...filters) => {
  return getAllBlocks(userId)
    .then(blocks => filter(blocks, (block, key) => filters.every(filter => filter(block, key))));
};

const partsFilter = () => (block, key) => (!(block.components.length || Object.keys(block.options).length));
const roleFilter = (role) => (block, key) => (!role || role === untypedKey) ? !block.rules.role : block.rules.role === role;
const nameFilter = (name) => (block, key) => block.metadata.name === name;

export const getAllParts = (userId) => {
  return getAllBlocksFiltered(userId, partsFilter());
};

//todo - use DB query directly
export const getAllBlocksWithName = (userId, name) => {
  return getAllBlocksFiltered(userId, nameFilter(name));
};

//todo - use DB query directly
export const getAllPartsWithRole = (userId, role) => {
  return getAllBlocksFiltered(userId, partsFilter(), roleFilter(role));
};

//todo - use DB query directly
export const getAllBlockRoles = (userId) => {
  return getAllParts(userId)
    .then(blockMap => {
      const blocks = values(blockMap);
      const obj = blocks.reduce((acc, block) => {
        const rule = block.rules.role || untypedKey;

        if (acc[rule]) {
          acc[rule]++;
        } else {
          acc[rule] = 1;
        }
        return acc;
      }, {});
      return obj;
    });
};
