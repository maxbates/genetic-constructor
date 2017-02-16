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
import * as snapshots from '../middleware/snapshots';
import * as commons from '../middleware/commons';

/**
 * Get snapshots for a given project
 * @param projectId
 * @return {Promise}
 * @resolve {Array<snapshot>} Array of snapshots
 */
export const snapshotsList = projectId =>
  (dispatch, getState) =>
    snapshots.snapshotList(projectId)
    .then(snapshots => {
      dispatch({
        type: ActionTypes.SNAPSHOT_LIST,
        snapshots,
      });
      return snapshots;
    });

/**
 * Retrieve a published project, either latest or a specific version
 * @function
 * @param projectId
 * @param [version]
 * @returns {promise}
 * @resolve {Array<snapshots>|snapshot|null} Array of snapshots if no verison, or specific snapshot if version passed, or null if not published
 * @reject error fetching
 */
export const snapshotsCommonsRetrieveProject = (projectId, version) =>
  (dispatch, getState) =>
    commons.commonsRetrieve(projectId, version)
    .then(roll => {
      //todo - dispatch to projects and blocks
      throw new Error('todo - handle retrieval');

      dispatch({
        type: ActionTypes.COMMONS_RETRIEVE_PROJECT,
        snapshots,
      });
      return roll;
    });

export const snapshotsQuery = query =>
  (dispatch, getState) =>
    snapshots.snapshotQuery(query)
    .then(snapshots => {
      dispatch({
        type: ActionTypes.SNAPSHOT_QUERY,
        snapshots,
      });
      return snapshots;
    });


export const snapshotsCommonsQuery = query =>
  (dispatch, getState) =>
    commons.commonsQuery(query)
    .then(snapshots => {
      dispatch({
        type: ActionTypes.COMMONS_QUERY,
        snapshots,
      });
      return snapshots;
    });
