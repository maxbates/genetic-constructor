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
import path from 'path';
import invariant from 'invariant';

const makePath = (...paths) => path.resolve('/tmp/', ...paths);

export const filePath = 'file';
export const sequencePath = 'sequence';
export const projectFilesPath = 'files';

//All files are put in the /tmp/ folder in local development
export const createStorageUrl = (...urls) => {
  const dev = ((process.env.NODE_ENV === 'test') ? 'test/' : '');
  return makePath(dev, ...urls);
};

// FILES / JOBS
// jobs are passed to /tmp/ when passed from client, rather than put in S3 directly by client, and then streamed to both job + S3

//todo - does this need namespacing, or enforce its an md5 / uuid?
//dont want to allow overriding / race conditions of common names
export const createFilePath = (md5) => {
  return createStorageUrl(filePath, md5);
};

//SEQUENCE

export const createSequencePath = (md5) => {
  return createStorageUrl(sequencePath, md5);
};

// PROJECT FILES

export const createProjectFilesDirectoryPath = (projectId, ...rest) => {
  invariant(projectId, 'Project ID required');
  return createStorageUrl(projectFilesPath, projectId, ...rest);
};

export const createProjectFilePath = (projectId, namespace, fileName) => {
  invariant(namespace, 'must pass a directory name (extension key)');
  return createProjectFilesDirectoryPath(projectId, namespace, fileName);
};
