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
import { headersDelete, headersGet, headersPost, headersPut } from './utils/headers';
import { commonsApiPath } from './utils/paths';
import rejectingFetch from './utils/rejectingFetch';

export const commonsRetrieve = (projectId, version) => {
  invariant(projectId, 'Project ID required to publish');

  return rejectingFetch(commonsApiPath(projectId, version), headersGet())
  .then(resp => resp.json());
};

//snapshot and publish rollup in one go
export const commonsPublish = (rollup) => {
  Rollup.validate(rollup, true, true);

  return rejectingFetch(commonsApiPath(rollup.project.id), headersPut())
  .then(resp => resp.json());
};

// Publish an existing version
export const commonsPublishVersion = (projectId, version, message, tags = {}) => {
  invariant(projectId, 'Project ID required to publish');
  invariant(version, 'Version required to publish specific version');

  const stringified = JSON.stringify({
    message,
    tags,
  });

  return rejectingFetch(commonsApiPath(projectId, version), headersPost(stringified))
  .then(resp => resp.json());
};

//Unpublish either a whole project (no version given), or a specific version (version given)
export const commonsUnpublish = (projectId, version) => {
  invariant(projectId, 'Project ID required to publish');
  invariant(version, 'Version required to publish specific version');

  return rejectingFetch(commonsApiPath(projectId, version), headersDelete())
  .then(resp => resp.json());
};

//default, no tags, just list all the public stuff
export const commonsQuery = (tags = {}) => {
  const stringified = JSON.stringify(tags);

  return rejectingFetch(commonsApiPath('query'), headersPost(stringified))
  .then(resp => resp.json());
};
