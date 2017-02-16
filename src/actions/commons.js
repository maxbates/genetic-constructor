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

import * as ActionTypes from '../constants/ActionTypes';
import * as commons from '../middleware/commons';

/**
 * Retrieve a published project, either latest or a specific version
 * @function
 * @param projectId
 * @param [version]
 * @returns {promise}
 * @resolve {Array<snapshots>|snapshot|null} Array of snapshots if no verison, or specific snapshot if version passed, or null if not published
 * @reject error fetching
 */
export const commonsRetrieveProject = (projectId, version) =>
  (dispatch, getState) =>
    commons.commonsRetrieve(projectId, version)
    .then((project) => {
      dispatch({
        type: ActionTypes.COMMONS_RETRIEVE_PROJECT,
        project,
      });
      return project;
    });

/**
 * Get all published snapshots of a project
 * @function
 * @param projectId
 * @return {Promise}
 * @resolve {Array<snapshot>} published snapshots
 */
export const commonsRetrieveProjectVersions = projectId =>
  (dispatch, getState) =>
  commons.commonsRetrieve(projectId, 'versions')
  .then((snapshots) => {
    dispatch({
      type: ActionTypes.COMMONS_RETRIEVE_PROJECT_VERSIONS,
      snapshots,
    });
    return snapshots;
  });

/**
 * Query the commons, fetching snapshots for latest version of each project matching query
 * @function
 * @param {Object} query in form { tags: {}, keywords: [] }
 * @returns Promise
 * @resolve {Array<snapshot>} snapshots matching the query
 */
export const commonsQuery = query =>
  (dispatch, getState) =>
    commons.commonsQuery(query)
    .then((snapshots) => {
      dispatch({
        type: ActionTypes.COMMONS_QUERY,
        snapshots,
      });
      return snapshots;
    });
