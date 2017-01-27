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

import debug from 'debug';
import invariant from 'invariant';
import _ from 'lodash';

import * as projectPersistence from './projects';
import * as projectVersions from './projectVersions';
import * as snapshots from './snapshots';
import { errorNotPublished, errorDoesNotExist } from '../../utils/errors';

const logger = debug('constructor:data:persistence:commons');

export const COMMONS_TAG = 'COMMONS_TAG';

const snapshotIsPublished = snapshot => snapshot.tags[COMMONS_TAG];

//NB - mutates the json directly
//maybe makes sense to put this in the Rollup class itself? Esp. If client needs it.
const lockProjectDeep = (roll) => {
  //freeze project
  roll.project.rules.frozen = true;

  //freeze blocks
  _.forEach(roll.blocks, (block) => { block.rules.frozen = true; });
  return roll;
};

/**
 * Check if a project @ version is published, or if any version is published
 * @param projectId
 * @param {number} version
 * @resolve to the snapshot at version passed, or latest published version
 * @reject not public (errorNotPublished) , doesnt exist (errorDoesNotExist)
 */
export const checkProjectPublic = (projectId, version) => {
  //if version given, check the particular version
  if (Number.isInteger(version)) {
    logger(`[checkProjectPublic] checking public snapshot: ${projectId} @ ${version}`);

    return snapshots.snapshotGet(projectId, version)
    .then(snapshot => {
      if (snapshotIsPublished(snapshot)) {
        return snapshot;
      }
      return Promise.reject(errorNotPublished);
    });
  }

  //otherwise, check if any version is public, and return that snapshot
  logger(`[checkProjectPublic] checking any public snapshot: ${projectId}`);

  return snapshots.snapshotQuery({ [COMMONS_TAG]: true }, projectId)
  .then(results => {
    if (!results || !results.length) {
      return Promise.reject(errorNotPublished);
    }
    return _.maxBy(results, 'version');
  });
};

//on queries, only take the latest version of each project
const reduceSnapshotsToLatestPerProject = snapshots =>
  _.chain(snapshots)
  .groupBy('projectId')
  .mapValues((projectSnapshots, projectId) => _.maxBy(projectSnapshots, 'version'))
  .values()
  .value();

/**
 * Query the commons
 * Prune each project to the latest version only
 * @param {Object} tags
 */
export const commonsQuery = (tags = {}) => {
  const query = { ...tags, [COMMONS_TAG]: true };
  return snapshots.snapshotQuery(query)
  .then(reduceSnapshotsToLatestPerProject);
};

/**
 * Get the published snapshots for a given project
 * @param projectId
 * @return {Array} Array of snapshots
 */
export const commonsRetrieveVersions = projectId =>
  snapshots.snapshotList(projectId)
  .then(snapshots => _.filter(snapshots, snapshotIsPublished));

/**
 * Retrieve a project from the commons
 * If no version passed, gets the latest version
 * @param projectId
 * @param version
 * @param {Boolean} [lockProject=true] set project and block rules to frozen
 * @returns {Promise}
 * @resolve the project, fully frozen
 * @reject errorNoPermission, errorDoesNotExist
 */
export const commonsRetrieve = (projectId, version, lockProject = true) =>
  checkProjectPublic(projectId, version)
  .then(snapshot => projectVersions.projectVersionByUUID(snapshot.projectUUID))
  .then(roll => lockProject === true ? lockProjectDeep(roll) : roll);

// Publish a project at particular version
// version -> assert exists and mark public, body = snapshot info
// !version -> create public snapshot, body = rollup
export const commonsPublishVersion = (projectId, userId, version, message, tags) => {
  //todo
  //handle snapshot exists or doesn't exist
};

//given a rollup, create a new version, and snapshot publishing it
export const commonsPublish = (projectId, userId, roll, message, tags) => {
  //todo
  //handle snapshot exists or doesn't exist
};

// Unpublish a project (mark snapshot as non-public, do not delete)
// version -> should just mark as non-public, not remove the snapshot
// !version -> remove public from all snapshots
export const commonsUnpublish = (projectId, userId, version) => {
  //todo
};

//custom permissions middleware
//given a project and a verison, check if its public
export const checkProjectPublicMiddleware = (req, res, next) => {
  const { projectId, version } = req;

  invariant(projectId, '[checkProjectPublicMiddleware] project ID required on request');

  checkProjectPublic(projectId, version)
  .then(() => next())
  .catch(err => res.status(403).send(err));
};
