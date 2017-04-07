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
import debug from 'debug';

import { errorDoesNotExist } from '../../errors/errorConstants';
import { dbHead, dbGet, dbPost, dbDelete } from '../middleware/db';
import { projectGet } from './projects';
import { projectVersionGet } from './projectVersions';
import internalUserLookup from '../../user/internalUserLookup';

const logger = debug('constructor:data:persistence:snapshots');

// Snapshotting is special information about a version.

//note - the UUID is non-revokable. If UUID is passed to the client, do not provide the client a way to look up by UUID. The UUID provides faster lookups, so exposing for use interally (e.g. commons)
const transformDbVersion = result => ({
  snapshotUUID: result.uuid,
  projectUUID: result.projectUUID,
  projectId: result.projectId,
  version: parseInt(result.projectVersion, 10),
  type: result.type,
  keywords: result.keywords,
  tags: result.tags,
  message: result.message,
  created: (new Date(result.createdAt)).valueOf(),
  updated: (new Date(result.updatedAt)).valueOf(),
  owner: result.owner,
});

export const SNAPSHOT_TYPE_USER = 'SNAPSHOT_USER';
export const SNAPSHOT_TYPE_ORDER = 'SNAPSHOT_ORDER';

export const defaultMessage = 'Project Snapshot';

const defaultSnapshotBody = {
  message: defaultMessage,
  tags: {},
  keywords: [],
};

/**
 * Query snapshots, returning a list of snapshots
 * @param {Object} query Required to have at least one tag or one keyword, in form: { tags: {}, keywords: [] }
 * @param [projectId] Can limit to a project
 * @param [userId] Can limit to a user
 * @throws if tags is empty
 */
export const snapshotQuery = (query = {}, projectId = null, userId = null) => {
  logger(`[snapshotQuery] ${JSON.stringify(query)}`);
  invariant(typeof query === 'object', 'must pass object');

  const haveTags = query.tags && Object.keys(query.tags).length;
  const haveKeywords = Array.isArray(query.keywords) && query.keywords.length;

  invariant(haveKeywords || haveTags, 'must pass either tags and/or keys');

  //if have keywords, use keywords endpoint (tags endpoint does not support keywords)
  if (haveKeywords) {
    return dbPost(`snapshots/keywords${projectId ? `?project=${projectId}` : ''}`, userId, null, {}, query)
    .then(results => results.map(transformDbVersion));
  }

  //if just tags, use the tags endpoint, and only pass the tags
  return dbPost(`snapshots/tags${projectId ? `?project=${projectId}` : ''}`, userId, null, {}, query.tags)
  .then(results => results.map(transformDbVersion));
};

/**
 * Get list of all snapshots for a project
 * @param projectId
 */
export const snapshotList = (projectId) => {
  logger(`[snapshotList] ${projectId}`);
  invariant(projectId, 'projectId required');

  return dbGet(`snapshots/${projectId}`)
  .then(results => results.map(transformDbVersion));
};

/**
 * Check if a snapshot exists, returns UUID if it does
 * @param projectId
 * @param version
 * @returns Promise
 * @resolve snapshotUUID
 * @reject doesnt exist
 */
export const snapshotExists = (projectId, version) => {
  logger(`[snapshotExists] ${projectId} @ ${version}`);
  invariant(projectId && Number.isInteger(version) && version >= 0, 'must pass projectId and version');

  const passedVersion = Number.isInteger(version) && version >= 0;

  return dbHead(`snapshots/${projectId}${passedVersion ? `?projectVersion=${version}` : ''}`)
  .then(resp => resp.headers.get('Latest-Snapshot'));
};

/**
 * Retrieve a snapshot for a given project and version
 * @param projectId
 * @param version
 * @returns Promise
 * @resolve snapshot
 * @reject errorDoesNotExist
 */
export const snapshotGet = (projectId, version) => {
  logger(`[snapshotGet] ${projectId} @ ${version}`);
  invariant(projectId && Number.isInteger(version) && version >= 0, 'must pass projectId and version');

  return dbGet(`snapshots/${projectId}?version=${version}`)
  //the db server returns an array, but there can only be one
  .then(results => (Array.isArray(results) && results.length > 0) ? results[0] : Promise.reject(errorDoesNotExist))
  .then(transformDbVersion);
};

/**
 * Create a snapshot of a project @ version
 * @param projectId
 * @param userId
 * @param [version] If no version provided, snapshot latest
 * @param [body] Snapshot information. Merges with default: { message: 'Project Snapshot', tags: {}, keywords: [] }
 * @param [type]
 * @returns Promise
 * @resolve snapshot
 */
export const snapshotWrite = (
  projectId,
  userId,
  version,
  body,
  type = SNAPSHOT_TYPE_USER,
) => {
  //version optional, defaults to latest
  invariant(projectId && userId, 'must pass projectId, userId');
  invariant((!version && version !== 0) || Number.isInteger(version), 'version must be a number');

  //get the project an user objects, so can enforce tags.author and tags.project = project.metadata.name
  //todo - perf - this sucks. its slow. is there faster way, while enforce these tags (author, projectName) will be present (always)
  //tricky since may create snapshot somewhere and then expose later, and need to ensure these fields are available
  return Promise.all([
    (Number.isInteger(version) ? projectVersionGet(projectId, version) : projectGet(projectId)),
    internalUserLookup(userId),
  ])
  .then(([project, user]) => {
    const snapshotBody = _.defaultsDeep({}, body, defaultSnapshotBody);

    invariant(typeof snapshotBody.message === 'string', 'message must be a string');
    invariant(typeof snapshotBody.tags === 'object' && !Array.isArray(snapshotBody.tags), 'tags must be object');
    invariant(Array.isArray(snapshotBody.keywords) && snapshotBody.keywords.every(word => typeof word === 'string'), 'keywords must be array of strings');
    invariant(typeof type === 'string', 'type must be a string');

    //assign author, projectName, number of base pairs to the snapshot
    Object.assign(snapshotBody.tags, {
      author: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : 'Anonymous',
      projectName: project.project.metadata.name || 'Untitled Project',
      basePairs: _.reduce(project.blocks, (acc, block) => acc + (block.sequence.length || 0), 0),
    });

    logger(`[snapshotWrite] writing @ V${Number.isInteger(version) ? version : '[latest]'} on ${projectId} - ${snapshotBody.message}`);

    const postBody = {
      projectId,
      type,
      ...snapshotBody,
    };

    if (Number.isInteger(version)) {
      postBody.projectVersion = version;
    }

    //signature is weird - no data to pass, just several body parameters
    return dbPost('snapshots/', userId, {}, {}, postBody)
    .then(transformDbVersion);
  });
};

/**
 * Update a snapshot. You can update the message, tags, and type.
 *
 * Note - the DB server might complain about uniqueness violation, but does merge successfully.
 * @param projectId
 * @param userId
 * @param version Version is required to merge
 * @param [body={}] //todo - should replace, not merge, tags - so can remove. update usage to big map with the option
 * @param [type]
 * @returns Promise
 * @resolve merged snapshot
 * @rejects if the snapshot doesnt exist
 */
export const snapshotMerge = (
  projectId,
  userId,
  version,
  body = {},
  type,
) => {
  invariant(typeof body === 'object', 'snapshot body must be an object');

  return snapshotGet(projectId, version)
  .then((snapshot) => {
    //prefer new things if defined, otherwise default to snapshot (which must have defaults)
    const newMessage = body.message || snapshot.message;
    const newTags = Object.assign({}, snapshot.tags, body.tags);
    const newKeywords = _.compact(snapshot.keywords.concat(body.keywords));
    const newType = type || snapshot.type;

    logger(`[snapshotMerge] updating @ V${version} on ${projectId} - ${newMessage}, ${newType}, ${JSON.stringify(newTags)}`);

    const newBody = {
      message: newMessage,
      tags: newTags,
      keywords: newKeywords,
    };

    return snapshotWrite(projectId, userId, version, newBody, newType);
  });
};

//if want to support - need to do by uuid, so need to fetch via projectId + version and delete that way, or list and delete
export const snapshotDelete = (projectId, version) => {
  logger(`[snapshotDelete] deleting ${projectId} @ ${version}`);
  invariant(Number.isInteger(version), 'version is required');

  return snapshotExists(projectId, version)
  .then(uuid => dbDelete(`snapshots/uuid/${uuid}`))
  .then(json => true);
};

/* KEYWORDS */

/**
 * Get counts of each keyword
 * @param {Object} [filters] All optional: { projectId, keywords: [], tags: {} }
 * @param [userId]
 */
export const snapshotGetKeywordMap = (filters = {}, userId = null) => {
  logger('[snapshotGetKeywordMap]');
  return dbPost('snapshots/kwm', userId, {}, [], filters);
};
