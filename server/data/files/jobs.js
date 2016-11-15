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
import uuid from 'node-uuid';
import * as s3 from '../middleware/s3';
import * as filePaths from '../middleware/filePaths';
import * as agnosticFs from './agnosticFs';

/* S3 Credentials, when in production */

export const bucketName = 'bionano-gctor-jobs';

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
}

// IO platform dependent paths

const getFilePath = (...paths) => {
  invariant(paths.length > 0, 'need to pass a path');

  return s3.useRemote ?
    paths.join('/') :
    filePaths.createJobFilePath(...paths);
};

export const jobFileRead = (namespace, path) => {
  invariant(namespace, 'need to pass a namespace');
  invariant(path, 'need to pass a namespace + path');

  const filePath = getFilePath(namespace, path);
  return agnosticFs.fileRead(s3bucket, filePath);
};

//note signature - filename is optional
export const jobFileWrite = (namespace, contents, fileName) => {
  invariant(typeof contents === 'string' || Buffer.isBuffer(contents), 'must pass contents as string or buffer');
  invariant(namespace, 'need to pass a namespace');

  const name = fileName || uuid.v4();
  const filePath = getFilePath(namespace, name);
  return agnosticFs.fileWrite(s3bucket, filePath, contents);
};

export const jobFileDelete = (namespace, path) => {
  invariant(namespace, 'need to pass a namespace');
  invariant(path, 'need to pass a namespace + path');

  const filePath = getFilePath(path);
  return agnosticFs.fileDelete(s3bucket, filePath);
};

//do we want to support listing? need a namespace then...
