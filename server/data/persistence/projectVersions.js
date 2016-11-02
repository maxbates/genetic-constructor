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
import uuid from 'node-uuid';
import { errorDoesNotExist, errorInvalidModel } from '../../utils/errors';
import { dbHeadRaw, dbGet, dbPost, dbDelete, dbPruneResult } from '../middleware/db';

// note that versions are already generated on project writing
// Snapshotting is special information about a version.

//todo - consistent messaging + message types, user tags, timestamps
//todo - update middleware on client, expecting commit SHA, to expect version

const dummyVersionPayload = () => ({
  type: 'whatever',             // SNAPSHOT ONLY (from user)
  tags: {},                     // SNAPSHOT ONLY (from user)
  version: -1,                  // version
  owner: uuid.v1(),             // owner
  time: Date.now(),             // createdAt
});

const transformDbVersion = (result) => ({
  version: parseInt(result.version, 10),
  time: result.createdAt,
  owner: result.owner,
});

//todo - resolve to false if it doesnt exist -- match projectExists() signature
export const projectVersionExists = (projectId, version) => {
  return dbHeadRaw(`projects/${projectId}?version=${version}`)
    .then(() => true);
};

export const projectVersionGet = (projectId, version) => {
  return dbGet(`projects/${projectId}?version=${version}`)
    .then(dbPruneResult);
};

export const projectVersionList = (projectId) => {
  return dbGet(`projects/versions/${projectId}`)
    .then(results => results.map(transformDbVersion));
};

// SNAPSHOTS

//this creates a *major* version and should include some metadata
export const projectSnapshot = (projectId, userId, type = 'USER', message = '', tags = {}) => {
  //todo - write this, once it exists
  return dbPost(`projects/snapshot/${projectId}`);

  //todo - ensure it returns a commit-like response w/ version (check previous usages of git.snapshot()) - time, version, etc.
};

export const projectSnapshotList = (projectId, userId) => {
  //todo - write this
  return dbGet(`projects/snapshot/${projectId}`);

  //todo - ensure it returns a commit-like response w/ version (check previous usages of git.snapshot()) - time, version, etc.
};

