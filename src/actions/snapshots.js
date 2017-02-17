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

/**
 * Create a snapshot
 * Snapshots are saves of the project at an important point, creating an explicit commit with a user-specified message.
 * @function
 * @param {UUID} projectId
 * @param {number} version project version, or null to default to latest
 * @param {object} body { message, tags = {}, keywords = [] }
 * @returns {Promise}
 * @resolve {number} version for snapshot
 * @reject {string|Response} Error message
 */
export const snapshotProject = (projectId, version = null, body = {}) =>
  (dispatch, getState) => {
    invariant(projectId, 'must pass projectId');
    invariant(Number.isInteger(version), 'must pass version');

    return snapshots.snapshot(projectId, version, body)
    .then((snapshot) => {
      if (!snapshot) {
        return null;
      }

      const { version } = snapshot;
      dispatch({
        type: ActionTypes.SNAPSHOT_PROJECT,
        projectId,
        snapshot,
        version,
      });
      return version;
    });
  };

/**
 * Get snapshots for a given project
 * @function
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
 * Query user's snapshots
 * @function
 * @param {Object} query in form { tags: {}, keywords: [] }
 * @returns Promise
 * @resolve {Array<snapshot>} snapshots matching the query
 */
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
