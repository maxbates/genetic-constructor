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
import * as s3 from '../middleware/s3';
import * as filePaths from '../middleware/filePaths';
import * as agnosticFs from './agnosticFs';

/* S3 Credentials, when in production */

export const bucketName = 'bionano-gctor-files';

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
}

// IO platform dependent paths

const getFilePath = (projectId, namespace, fileName) => {
  return s3.useRemote ?
    `${projectId}/${namespace}/${fileName}` :
    filePaths.createProjectFilePath(projectId, namespace, fileName);
};

const getFolderPath = (projectId, namespace) => {
  return s3.useRemote ?
    `${projectId}/${namespace}` :
    filePaths.createProjectFilesDirectoryPath(projectId, namespace);
};

// IO

export const projectFileRead = (projectId, namespace, fileName) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'namespace key is required');
  invariant(fileName, 'file name is required');

  const filePath = getFilePath(projectId, namespace, fileName);

  return agnosticFs.fileRead(s3bucket, filePath);
};

export const projectFileWrite = (projectId, namespace, fileName, contents) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'namespace key is required');

  const filePath = getFilePath(projectId, namespace, fileName);

  return agnosticFs.fileWrite(s3bucket, filePath, contents);
};

export const projectFileDelete = (projectId, namespace, fileName) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'namespace key is required');
  invariant(fileName, 'file name is required');

  const filePath = getFilePath(projectId, namespace, fileName);

  return agnosticFs.fileDelete(s3bucket, filePath);
};

export const projectFilesList = (projectId, namespace) => {
  invariant(projectId, 'projectId is required');

  //todo - suport skipping namespace. need to change format or results (will have slashes)
  //will have to update project file router to account for no namespace
  invariant(namespace, 'must pass a namespace');

  const folderPath = getFolderPath(projectId, namespace);

  return agnosticFs.fileList(s3bucket, folderPath);
};
