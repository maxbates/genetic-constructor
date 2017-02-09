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
import { noteFailure, noteSave } from '../store/saveState';
import { headersGet, headersPost } from './utils/headers';
import { dataApiPath } from './utils/paths';
import rejectingFetch from './utils/rejectingFetch';

const defaultSnapshotBody = {
  message: 'Project Snapshot',
  tags: {},
  keywords: [],
};

//todo - separate snapshotting a version and posting rollup to snapshot

/**
 * makes a snapshot rather than just a version
 * @param projectId
 * @param [version] recommended, otherwise defaults to latest if no rollup passed
 * @param [body={}] Snapshot information: { message, tags, keywords }
 * @param [rollup=null] optional, will be saved if provided
 * @returns the snapshot wth version, message
 */
export const snapshot = (projectId, version = null, body = {}, rollup = null) => {
  invariant(projectId, 'Project ID required to snapshot');
  if (rollup) {
    Rollup.validate(rollup, true, true);
  }

  const snapshotBody = Object.assign({}, defaultSnapshotBody, body, { rollup });

  invariant(typeof snapshotBody.message === 'string', 'message must be string');
  invariant(typeof snapshotBody.tags === 'object', 'tags must be object');
  invariant(Array.isArray(snapshotBody.keywords), 'keywords must be array');

  const stringified = JSON.stringify(snapshotBody);
  const url = dataApiPath(`snapshots/${projectId}${Number.isInteger(version) ? `/${version}` : ''}`);

  return rejectingFetch(url, headersPost(stringified))
  .then(resp => resp.json())
  .then((snapshot) => {
    const { version } = snapshot;
    noteSave(projectId, version);
    return snapshot;
  })
  .catch((err) => {
    noteFailure(projectId, err);
    return Promise.reject(err);
  });
};

/**
 * List snapshots for a project
 * @param projectId
 */
export const snapshotList = (projectId) => {
  invariant(projectId, 'Project ID required to snapshot');

  const url = dataApiPath(`snapshots/${projectId}`);

  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};

//future - when needed
//export const snapshotQuery = (tags, projectId) => {}

/**
 * Retrieve a information about a snapshot
 * @param projectId
 * @param version
 */
export const snapshotGet = (projectId, version) => {
  invariant(projectId, 'Project ID required to snapshot');
  invariant(Number.isInteger(version), 'version is necessary');

  const url = dataApiPath(`snapshots/${projectId}/${version}`);

  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};

//future -  when needed
//note - need to distinguish between types of snapshots. Probably only want to let them delete the explicit ones they made (not orders, etc.)
//export const snapshotDelete = (projectId, version) => {}

/**
 * get map of keywords used across all projects
 */
export const snapshotsListKeywords = () => {
  const url = dataApiPath('snapshots/keywords');

  return rejectingFetch(url, headersGet())
  .then(resp => resp.json());
};
