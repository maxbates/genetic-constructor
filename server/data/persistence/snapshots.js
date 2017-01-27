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
import debug from 'debug';

import { errorDoesNotExist } from '../../utils/errors';
import { dbHeadRaw, dbGet, dbPost } from '../middleware/db';

const logger = debug('constructor:data:persistence:snapshots');

// Snapshotting is special information about a version.

//note - the UUID is non-revokable. If UUID is passed to the client, do not provide the client a way to look up by UUID. The UUID provides faster lookups, so exposing for use interally (e.g. commons)
const transformDbVersion = result => ({
  snapshotUUID: result.uuid,
  projectUUID: result.projectUUID,
  projectId: result.projectId,
  version: parseInt(result.projectVersion, 10),
  type: result.type,
  tags: result.tags,
  message: result.message,
  time: (new Date(result.createdAt)).valueOf(),
  owner: result.owner,
});

export const SNAPSHOT_TYPE_USER = 'SNAPSHOT_USER';
export const SNAPSHOT_TYPE_ORDER = 'SNAPSHOT_ORDER';
export const SNAPSHOT_TYPE_PUBLISH = 'SNAPSHOT_PUBLISH';

export const defaultMessage = 'Project Snapshot';

export const snapshotQuery = (tags = {}, projectId) => {
  logger(`[snapshotQuery] ${JSON.stringify(tags)}`);
  invariant(typeof tags === 'object', 'must pass object of tags');
  invariant(Object.keys(tags).length, 'must pass tags to query');

  return dbPost(`snapshots/tags${projectId ? `?project=${projectId}` : ''}`, null, null, {}, tags)
  .then(results => results.map(transformDbVersion));
};

export const snapshotList = (projectId) => {
  logger(`[snapshotList] ${projectId}`);
  invariant(projectId, 'projectId required');

  return dbGet(`snapshots/${projectId}`)
  .then(results => results.map(transformDbVersion));
};

//returns UUID of latest snapshot if exists
//does not allow passing tags
export const snapshotExists = (projectId, version) => {
  logger(`[snapshotExists] ${projectId} @ ${version}`);
  invariant(projectId && Number.isInteger(version) && version >= 0, 'must pass projectId and version');

  const passedVersion = Number.isInteger(version) && version >= 0;

  return dbHeadRaw(`snapshots/${projectId}${passedVersion ? `?projectVersion=${version}` : ''}`)
  .then(resp => resp.headers.get('Latest-Snapshot'));
};

export const snapshotGet = (projectId, version) => {
  logger(`[snapshotGet] ${projectId} @ ${version}`);
  invariant(projectId && Number.isInteger(version) && version >= 0, 'must pass projectId and version');

  return dbGet(`snapshots/${projectId}?version=${version}`)
  .then(results => (Array.isArray(results) && results.length > 0) ? results[0] : Promise.reject(errorDoesNotExist))
  .then(transformDbVersion);
};

export const snapshotWrite = (
  projectId,
  userId,
  version,
  message = defaultMessage,
  tags = {},
  type = SNAPSHOT_TYPE_USER,
) => {
  //version optional, defaults to latest
  invariant(projectId && userId, 'must pass projectId, userId');
  invariant((!version && version !== 0) || Number.isInteger(version), 'version must be a number');

  logger(`[snapshotWrite] writing @ V${Number.isInteger(version) ? version : '[latest]'} on ${projectId} - ${message}`);

  const body = {
    projectId,
    type,
    message,
    tags,
  };

  if (Number.isInteger(version)) {
    body.projectVersion = version;
  }

  //signature is weird - no data to pass, just several body parameters
  return dbPost('snapshots/', userId, {}, {}, body)
  .then(transformDbVersion);
};

export const snapshotMerge = (
  projectId,
  userId,
  version,
  message,
  tags = {},
  type,
) => snapshotGet(projectId, version)
.then(snapshot => {
  //prefer new things if defined, otherwise default to snapshot (which must have defaults)
  const newMessage = message || snapshot.message;
  const newType = type || snapshot.type;
  const newTags = { ...snapshot.tags, tags };

  logger(`[snapshotMerge] updating @ V${version} on ${projectId} - ${newMessage}, ${newType}, ${JSON.stringify(newTags)}`);

  return snapshotWrite(projectId, userId, version, newMessage, newTags, newType);
});

//if want to support - need to do by uuid, so need to fetch via projectId + version and delete that way, or list and delete
//export const snapshotDelete = (projectId, userId, version) => {};
