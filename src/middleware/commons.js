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

//import Rollup from '../models/Rollup';
import { headersDelete, headersGet, headersPost } from './utils/headers';
import { commonsApiPath } from './utils/paths';
import rejectingFetch from './utils/rejectingFetch';

const defaultSnapshotBody = {
  message: 'Publish Project',
  tags: {},
  keywords: [],
};

// query in the form { tags: {}, keywords: [] }
// collapse to only get latest snapshot for given project
// projectId to limit to a project
// default, list everything public
export const commonsQuery = (query = {}, collapse = true, projectId = null) => {
  const stringified = JSON.stringify({ query, collapse, projectId });

  return rejectingFetch(commonsApiPath('query'), headersPost(stringified))
  .then(resp => resp.json());
};

export const commonsRetrieve = (projectId, version) => {
  invariant(projectId, 'Project ID required to retrieve');

  return rejectingFetch(commonsApiPath(projectId, version), headersGet())
  .then(resp => resp.json());
};

export const commonsRetrieveVersions = (projectId) => {
  invariant(projectId, 'Project ID required to retrieve versions');

  return rejectingFetch(commonsApiPath(projectId, 'versions'), headersGet())
  .then(resp => resp.json());
};

// Publish an existing version
export const commonsPublishVersion = (projectId, version, body = defaultSnapshotBody) => {
  invariant(projectId, 'Project ID required to publish');
  invariant(Number.isInteger(version), 'Version required to publish specific version');

  const stringified = JSON.stringify(body);

  return rejectingFetch(commonsApiPath(projectId, version), headersPost(stringified))
  .then(resp => resp.json());
};

//Unpublish either a whole project (no version given), or a specific version (version given)
export const commonsUnpublish = (projectId, version) => {
  invariant(projectId, 'Project ID required to publish');
  invariant(version === undefined || Number.isInteger(version), 'version must be a number');

  return rejectingFetch(commonsApiPath(projectId, version), headersDelete())
  .then(resp => resp.json());
};

export const commonsProjectByName = (name) => {
  const stringified = JSON.stringify({ name });

  return rejectingFetch(commonsApiPath('search'), headersPost(stringified))
  .then(resp => resp.json());
};
