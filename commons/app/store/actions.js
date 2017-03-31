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

import invariant from 'invariant';
import { keyBy } from 'lodash';
import * as actionTypes from './actionTypes';

/**
 * Add projects (rollups)
 * @param {Array<Rollup>} projects
 */
export const stashProjects = projects => {
  invariant(Array.isArray(projects), 'projects must be array');

  return {
    type: actionTypes.STASH_PROJECTS,
    projects: keyBy(projects, proj => proj.project.id),
  };
};

/**
 * Add snapshots
 * @param {Array<Snapshot>} snapshots
 */
export const stashSnapshots = snapshots => {
  invariant(Array.isArray(snapshots), 'must pass array of snapshots');

  return {
    type: actionTypes.STASH_SNAPSHOTS,
    snapshots,
  };
};

/**
 * Set user id
 * @param {string} user
 */
export const setUser = user => ({
  type: actionTypes.SET_USER,
  user,
});
