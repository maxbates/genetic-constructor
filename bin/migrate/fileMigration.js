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

//

import path from 'path';
import fetch from 'isomorphic-fetch';
import fs from 'fs';
import _ from 'lodash';
import { defaultUser } from '../../server/auth/local';

import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as s3 from '../../server/data/middleware/s3';
import * as projectFiles from '../../server/data/files/projectFiles';

import batchPromises from './batchPromises';
import { storagePath, projectPath, AUTH_API } from './config';

//if (!s3.useRemote) {
  //throw new Error('must use S3 - pass s3 credentials to propcess');
//}

const files = {};

console.log('checking all projects in ', projectPath);

//get all the project IDs
const projects = fs.readdirSync(projectPath)
//skip .DS_Store
  .filter(dir => dir[0] !== '.');

console.log('checking projects with files...');

//go through projects, determine if / list files
_.forEach(projects, projectId => {
  const projectFilesPath = path.resolve(projectPath, projectId, 'data', 'files');
  let extensions;

  try {
    extensions = fs.readdirSync(projectFilesPath);
  } catch (err) {
    console.log('no files in project ' + projectId);
    return;
  }

  files[projectId] = {};

  _.forEach(extensions, extension => {
    const projectFilesExtensionPath = path.resolve(projectFilesPath, extension);

    let fileList;
    try {
      fileList = fs.readdirSync(projectFilesExtensionPath);
    } catch (err) {
      console.log('no files in for extension ' + extension);
      return;
    }

    files[projectId][extension] = fileList;
  });
});

console.log(files);

const extensions = _.uniq(_.flatten(_.map(files, (extensionObj, projectId) => Object.keys(extensionObj))));
const fileNames = _.uniq(_.flattenDeep(_.map(files, (extensionObj, projectId) => _.values(extensionObj))));
console.log('extensions', extensions);
console.log('fileNames', fileNames);

// move project files into s3

/*
batchPromises(_.map(files, (fileNames, projectId) => () => {
  console.log('writing files for project ' + projectId);

  //we only want to write GSL files... nothing else has made project files
  const acceptable = ['project.gsl'];
  const toWrite = _.union(fileNames, acceptable);

  console.log('writing:', toWrite);

  return Promise.all(toWrite.map(fileName => projectFiles.projectFile)
}))
  .then(() => {
    console.log('project files migrated');
  })
  .catch(err => {
    console.log(err, err.stack);
    throw err;
  });
*/
// todo - update the projects so they know about their files - will need to include versioning information on the write
//should make sure the project atually exists in the database, and should only add once

//todo - check importers and see how they expect these to exist? may just need to copy by file name (maybe handle projectId)
// move imported files (now, job files)
// namespace by projectId - will need to check projects' block.source.id ???
// appropriate namespacing (Genbank, CSV) -> import


