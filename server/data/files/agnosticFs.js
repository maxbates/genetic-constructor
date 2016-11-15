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
import * as fileSystem from '../middleware/fileSystem';

export const fileRead = (s3bucket, filePath, params) => {
  invariant(filePath, 'file name is required');

  return s3.useRemote ?
    s3.stringGet(s3bucket, filePath, params) :
    fileSystem.fileRead(filePath, false);
};

export const fileWrite = (s3bucket, filePath, contents, params) => {
  invariant(filePath, 'file name is required');
  invariant(contents, 'contents required');
  invariant(typeof contents === 'string', 'contents must be a string');

  if (s3.useRemote) {
    return s3.stringPut(s3bucket, filePath, contents, params);
  }

  const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
  invariant(folderPath, 'must have a prefix with / to get folder path');

  return fileSystem.directoryMake(folderPath)
    .then(() => fileSystem.fileWrite(filePath, contents, false))
    //hack - until we need to support versions for local development, this is not implemented
    .then(() => ({ VersionId: 'latest' }));
};

export const fileDelete = (s3bucket, filePath, params) => {
  invariant(filePath, 'file path is required');

  return s3.useRemote
    ?
    s3.itemDelete(s3bucket, filePath, params)
    :
    fileSystem.fileDelete(filePath);
};

export const fileList = (s3bucket, namespace, params) => {
  //todo - verify the contents returned are the same

  return s3.useRemote
    ?
    s3.folderContents(s3bucket, namespace, params)
      .then(files => files.map(file => file.name))
    :
    fileSystem.directoryContents(namespace);
};
