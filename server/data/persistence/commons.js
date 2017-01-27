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

export const SNAPSHOT_TYPE_PUBLISH = 'SNAPSHOT_PUBLISH';
export const COMMONS_TAG = 'COMMONS_TAG';

export const defaultMessage = 'Published Project';

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

//given list of snapshots, e.g. on queries, only take the latest version of each project
const reduceSnapshotsToLatestPerProject = snapshots =>
  _.chain(snapshots)
  .groupBy('projectId')
  .mapValues((projectSnapshots, projectId) => _.maxBy(projectSnapshots, 'version'))
  .values()
  .value();

/**
 * Check if a project @ version is published, or if any version is published
 * @param projectId
 * @param {number} version
 * @resolve to the snapshot at version passed, or latest published version
 * @reject not public (errorNotPublished) , doesnt exist (errorDoesNotExist)
 */
export const checkProjectPublic = (projectId, version) => {
  invariant(version === undefined || Number.isInteger(version), 'version must be a number');
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

/**
 * Publish a project at particular version
 * assert exists and mark public, update snapshot info
 *
 * If the snapshot already existed, do not change the type.
 * @param projectId
 * @param userId
 * @param version
 * @param message
 * @param tags
 * @returns {Promise}
 * @resolve snapshot
 */
export const commonsPublishVersion = (projectId, userId, version, message, tags = {}) => {
  invariant(projectId, 'projectId required');
  invariant(userId, 'userId required');
  invariant(Number.isInteger(version), 'version required');

  const newTags = { ...tags, [COMMONS_TAG]: true };

  //try to update the existing snapshot, without changing the type
  return snapshots.snapshotMerge(projectId, userId, version, message, newTags)
  //if snapshot doesn't exist, make a new + public one
  .catch((err) => {
    //if we got a different error, pass it through
    if (err !== errorDoesNotExist) {
      return Promise.reject(err);
    }

    const newMessage = message || defaultMessage;

    return snapshots.snapshotWrite(projectId, userId, version, newMessage, newTags, SNAPSHOT_TYPE_PUBLISH);
  });
};

/**
 * Publish a project, given a rollup for its newest state
 * Writes the project, creates a public snapshot
 *
 * If the snapshot already existed, do not change the type.
 * @param projectId
 * @param userId
 * @param roll
 * @param message
 * @param tags
 * @returns {Promise}
 * @resolve snapshot
 */
export const commonsPublish = (projectId, userId, roll, message, tags) => {
  invariant(projectId, 'projectId required');
  invariant(userId, 'userId required');

  //will properly validate roll when attempt to write
  invariant(roll && roll.project && roll.blocks, 'roll is required');

  return projectPersistence.projectWrite(projectId, roll)
  .then(writtenRoll => {
    const newTags = { ...tags, [COMMONS_TAG]: true };
    return snapshots.snapshotWrite(projectId, userId, writtenRoll, message, newTags, SNAPSHOT_TYPE_PUBLISH);
  });
};

/**
 * Unpublish a project (mark snapshot as non-public, do not delete)
 * !version -> remove public from all snapshots
 * version -> mark the snapshot as non-public.
 *
 * In the future, we may want to delete the snapshot, rather than just mark it unpublished. The snapshot type can be checked on unpublishing - depending on whether it is SNAPSHOT_TYPE_PUBLISH, the snapshot can be just be marked non-public or be deleted entirely.
 *
 * @param projectId
 * @param userId
 * @param [version]
 * @return Promise
 * @resolve if version passed, the updated snapshot. if no version passed, all the remaining snapshots for the project.
 * @reject if doesnt exist
 */
export const commonsUnpublish = (projectId, userId, version) => {
  invariant(projectId, 'projectId required');
  invariant(userId, 'userId required');
  invariant(version === undefined || Number.isInteger(version), 'version must be a number');

  const tagOverride = { [COMMONS_TAG]: false };

  //if version is passed, unpublish just that version
  if (Number.isInteger(version)) {
    return snapshots.snapshotMerge(projectId, userId, version, undefined, tagOverride);
  }

  //otherwise, unpublish all snapshots of the project
  return snapshots.snapshotList(projectId)
  .then(projectSnapshots => Promise.all(projectSnapshots.map(snapshot =>
    snapshots.snapshotMerge(projectId, userId, snapshot.version, snapshot.message, tagOverride),
  )));
};

//custom permissions middleware
//given a project and a verison, check if its public
export const checkProjectPublicMiddleware = (req, res, next) => {
  const { projectId, version } = req;

  invariant(projectId, '[checkProjectPublicMiddleware] project ID required on request');

  checkProjectPublic(projectId, version)
  .then(() => next())
  .catch(next);
};
