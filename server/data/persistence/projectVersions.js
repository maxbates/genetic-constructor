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
import { dbGet, dbHead, dbPost, dbPruneResult } from '../middleware/db';
import { mergeMetadataOntoProject } from './projects';

// note that versions are already generated on project writing, so use projectWrite() to create one

const transformDbVersion = result => ({
  version: parseInt(result.version, 10),
  time: (new Date(result.createdAt)).valueOf(),
  owner: result.owner,
});

export const projectVersionExists = (projectId, version) =>
  dbHead(`projects/${projectId}?version=${version}`)
  .then(() => true);

export const projectVersionGetRaw = (projectId, version) =>
  dbGet(`projects/${projectId}?version=${version}`);

//returns project at a particular point in time
export const projectVersionGet = (projectId, version) =>
  projectVersionGetRaw(projectId, version)
  .then(mergeMetadataOntoProject)
  .then(dbPruneResult);

//list all versions of a project
export const projectVersionList = projectId =>
  dbGet(`projects/versions/${projectId}`)
  .then(results => results.map(transformDbVersion));

//do not expose outside app!
//will overwrite an existing project version
export const projectVersionWrite = (projectId, version, owner, data) => {
  invariant(projectId, 'projectId required');
  invariant(Number.isInteger(version), 'version is required');
  invariant(typeof owner === 'string', 'owner is required');

  dbPost(`projects/${projectId}?version=${version}&overwrite=true`, owner, data)
  .then(mergeMetadataOntoProject)
  .then(dbPruneResult);
};

//used e.g. in migration utilities
export const projectVersionByUUIDRaw = uuid =>
  dbGet(`projects/uuid/${uuid}`);

export const projectVersionByUUID = uuid =>
  projectVersionByUUIDRaw(uuid)
  .then(mergeMetadataOntoProject)
  .then(dbPruneResult);

export const projectVersionsByUUID = (uuids, withBlocks = true) => {
  invariant(Array.isArray(uuids), 'must pass array UUID');

  return dbPost(`search/projects/list?blocks=${withBlocks}`, null, uuids)
  .then(results => results.map(mergeMetadataOntoProject))
  .then(results => results.map(dbPruneResult));
};
