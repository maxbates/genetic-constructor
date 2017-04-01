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

import { headersGet, headersPost, headersDelete } from './utils/headers';
import { jobPath, jobFilePath } from './utils/paths';
import rejectingFetch from './utils/rejectingFetch';

const contentTypeTextHeader = { headers: { 'Content-Type': 'text/plain' } };

// JOBS

// { jobId }
export const jobCreate = (projectId, type, data) =>
  rejectingFetch(jobPath(projectId, type), headersPost(JSON.stringify(data)))
  .then(resp => resp.json());

// { complete, failure, job, result, jobId }
export const jobGet = (projectId, jobId) =>
  rejectingFetch(jobPath(projectId, jobId), headersGet())
  .then(resp => resp.json());

export const jobPoll = (projectId, jobId, waitTime = 30000) => {
  let interval;
  const promise = new Promise((resolve, reject) => {
    interval = setInterval(() => {
      jobGet(projectId, jobId)
      .then((result) => {
        if (!result || result.complete !== true) {
          return;
        }

        clearInterval(interval);

        if (result.failure) {
          return reject(result);
        }

        return resolve(result);
      })
      .catch(reject);
    }, waitTime);
  });

  promise.cancelPoll = () => clearInterval(interval);

  return promise;
};

export const jobCancel = (projectId, jobId) =>
  rejectingFetch(jobPath(projectId, jobId), headersDelete())
  .then(resp => resp.json());

// FILES

export const jobFileRead = (projectId, namespace, fileName) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');
  invariant(!!fileName && typeof fileName === 'string', 'file name is required');

  return rejectingFetch(jobFilePath(projectId, namespace, fileName), headersGet(contentTypeTextHeader));
};

//returns the name of the file + url etc.
export const jobFileWrite = (projectId, namespace, contents) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');
  invariant(typeof contents === 'string', 'must pass contents as string');

  const filePath = jobFilePath(projectId, namespace);

  return rejectingFetch(filePath, headersPost(contents, contentTypeTextHeader))
  .then(resp => resp.json());
};

export const jobFileList = (projectId, namespace) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');

  //todo - don't require namespace. will need to update router
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');

  return rejectingFetch(jobFilePath(projectId, namespace, ''), headersGet())
  .then(resp => resp.json());
};

//once a job is complete, fetch the result, expected to be a rollup
export const jobGetResult = (projectId, namespace) =>
  jobFileRead(projectId, namespace, 'result')
  .then(resp => resp.json());
