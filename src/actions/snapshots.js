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
