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
import _ from 'lodash';

import * as ActionTypes from '../constants/ActionTypes';
import * as commons from '../middleware/commons';
import Rollup from '../models/Rollup';
import Snapshot from '../models/Snapshot';
import * as blockActions from '../actions/blocks';
import * as projectActions from '../actions/projects';

/**
 * Publish a a particular version of a project, creating a public snapshot.
 * @function
 * @param {UUID} projectId
 * @param {number} version project version, or null to default to latest
 * @param {object} body { message, tags = {}, keywords = [] }
 * @returns {Promise}
 * @resolve {number} version for snapshot
 * @reject {string|Response} Error message
 */
export const commonsPublish = (projectId, version, body = {}) => (dispatch, getState) => {
  invariant(projectId, 'must pass projectId');
  invariant(Number.isInteger(version), 'must pass version');

  const project = getState().projects[projectId];
  const userId = getState().user.userid;

  invariant(project.owner === userId, 'must be owner to unpublish');

  return commons.commonsPublishVersion(projectId, version, body)
  .then((rawSnapshot) => {
    if (!rawSnapshot) {
      return null;
    }

    const snapshot = new Snapshot(rawSnapshot);
    const { version } = snapshot;

    dispatch({
      type: ActionTypes.COMMONS_PUBLISH,
      projectId,
      snapshot,
      version,
    });
    return version;
  });
};

/**
 * Retrieve a published project, either latest or a specific version
 * @function
 * @param projectId
 * @param [version] if falsy, default to latest
 * @param [shouldStash=false] Automatically stash the project and blocks in the store
 * @returns {promise}
 * @resolve {Rollup} Array of snapshots if no verison, or specific snapshot if version passed, or null if not published
 * @reject error fetching
 */
export const commonsRetrieveProject = (projectId, version, shouldStash = false) =>
  (dispatch, getState) =>
    commons.commonsRetrieve(projectId, version)
    .then((roll) => {
      const project = Rollup.classify(roll);
      dispatch({
        type: ActionTypes.COMMONS_RETRIEVE_PROJECT,
        project,
      });

      if (shouldStash === true) {
        dispatch(projectActions.projectStash(project.project));
        dispatch(blockActions.blockStash(..._.values(project.blocks)));
      }

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
    .then((rawSnapshots) => {
      const snapshots = rawSnapshots.map(rawSnapshot => new Snapshot(rawSnapshot));
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
    .then((rawSnapshots) => {
      const snapshots = rawSnapshots.map(rawSnapshot => new Snapshot(rawSnapshot));
      dispatch({
        type: ActionTypes.COMMONS_QUERY,
        snapshots,
      });
      return snapshots;
    });

/**
 * Unpublish a snapshot or entire project
 * @param projectId
 * @param [version] If provided, unpublish that verison. Othewise, unpublish the entire project
 * @return {Promise}
 * @resolve {Snapshot} updated (unpublished) snapshot
 * @throws if user does not own project
 */
export const commonsUnpublish = (projectId, version) =>
  (dispatch, getState) => {
    const project = getState().projects[projectId];
    const userId = getState().user.userid;

    invariant(project.owner === userId, 'must be owner to unpublish');

    return commons.commonsUnpublish(projectId, version)
    .then((rawSnapshot) => {
      const snapshot = new Snapshot(rawSnapshot);
      dispatch({
        type: ActionTypes.COMMONS_UNPUBLISH,
        snapshot,
        projectId,
        version,
      });
      return snapshot;
    });
  };
