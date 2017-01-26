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

import Rollup from '../models/Rollup';
import { headersDelete, headersGet, headersPost } from './utils/headers';
import { commonsApiPath } from './utils/paths';
import rejectingFetch from './utils/rejectingFetch';

export const commonsRetrieve = (projectId, version) => {
  invariant(projectId, 'Project ID required to publish');

  const url = commonsApiPath(projectId, version);

  return rejectingFetch(url, headersGet())
  .then(resp => resp.json());
};

//snapshot and publish rollup in one go
export const commonsPublish = (rollup) => {
  Rollup.validate(rollup, true, true);

  return rejectingFetch(commonsApiPath(rollup.project.id));
};

// Publish an existing version
export const commonsPublishVersion = (projectId, version, message, tags = {}) => {
  invariant(projectId, 'Project ID required to publish');
  invariant(version, 'Version required to publish specific version');

  const url = commonsApiPath(projectId, version);
  const stringified = JSON.stringify({
    message,
    tags,
  });

  return rejectingFetch(url, headersPost(stringified))
  .then(resp => resp.json());
};

//Unpublish either a whole project (no version given), or a specific version (version given)
export const commonsUnpublish = (projectId, version) => {
  invariant(projectId, 'Project ID required to publish');
  invariant(version, 'Version required to publish specific version');

  const url = commonsApiPath(projectId, version);

  return rejectingFetch(url, headersDelete())
  .then(resp => resp.json());
};

export const commonsQuery = (query = {}) => {
  const url = commonsApiPath('query');
  const stringified = JSON.stringify(query);

  return rejectingFetch(url, headersPost(stringified))
  .then(resp => resp.json());
};
