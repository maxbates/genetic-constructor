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

import { errorDoesNotExist } from '../../server/utils/errors';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as s3 from '../../server/data/middleware/s3';
import * as projectFiles from '../../server/data/files/projectFiles';
import * as projectPersistence from '../../server/data/persistence/projects';

import Project from '../../src/models/Project';

import batchPromises from './batchPromises';
import { storagePath, projectPath, AUTH_API } from './config';

if (!s3.useRemote) {
  throw new Error('must use S3 - pass s3 credentials to propcess');
}

const extensionName = 'GC-GSL-Editor'; //this is the current extension name, all GSL files should go under it

//store all the files we want to migrate
const files = [];

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

  //get the files in the extension (expect there to only be one extension)
  //get the extensions in the project
  try {
    extensions = fs.readdirSync(projectFilesPath);
  } catch (err) {
    console.log('no files in project ' + projectId);
    return;
  }

  _.forEach(extensions, oldExtensionName => {
    const projectFilesExtensionPath = path.resolve(projectFilesPath, oldExtensionName);

    let fileList;
    try {
      fileList = fs.readdirSync(projectFilesExtensionPath);
    } catch (err) {
      console.log('no files in for extension ' + oldExtensionName);
      return;
    }

    //GSL files to migrate
    const gslFileName = 'project.gsl';
    const gslFileNameAlt = 'project.run.gsl';

    _.forEach([gslFileName, gslFileNameAlt], (fileName) => {
      if (fileList.indexOf(fileName) >= 0) {
        const filePath = path.resolve(projectFilesExtensionPath, fileName);
        //make sure we havent already added it e.g. if extensino name change while using
        if (files.findIndex(item => item.projectId === projectId && item.fileName === fileName) >= 0) {
          console.log('skipping file for projectId', filePath);
          return;
        }

        console.log('found file ' + fileName + ' for project ' + projectId);
        files.push({
          projectId,
          fileName,
          extensionName: extensionName, // the new extension name
          oldExtensionName, //the old extension name (should be namespaced into new extension name)
          filePath,
        });
      }
    });
  });
});

console.log(files);

// move project files into s3

batchPromises(_.map(files, (fileObject) => () => {
  const { filePath, oldExtensionName, extensionName, projectId } = fileObject;

  return fileSystem.fileRead(filePath, false)
    .catch(err => {
      console.log('error reading file', filePath);
      throw err;
    })
    .then(fileContents => {
      if (!fileContents) {
        console.log('no file contents, skipping', projectId, filePath);
        fileObject.skip = true;
        return;
      }

      return projectFiles.projectFileWrite(projectId, extensionName, gslFileName, fileContents)
        .then((fileInfo) => {
          console.log('wrote project file for project', oldExtensionName, fileInfo);
          Object.assign(fileObject, fileInfo);
        })
        .catch(err => {
          console.log('error writing file, but continuing', projectId);
          console.log(fileContents);
        });
    });
}))
  .then(() => {
    console.log('project files added to s3');
  })
  .catch(err => {
    console.log(err, err.stack);
    throw err;
  })
  //now update all the projects so they know about their files
  .then(() => {
    //group the files by their projectIds
    const grouped = _.groupBy(files, 'projectId');

    return batchPromises(_.map(grouped, (files, projectId) => () => {
      return projectPersistence.projectGetManifest(projectId)
        .then(manifest => {
          //scaffold
          const newManifest = new Project(manifest, false);

          //update with the files
          files.forEach(fileObj => {
            const { skip, fileName, extensionName, VersionId } = fileObj;
            //marked to skip if empty
            if (skip === true) {
              return Promise.resolve(null);
            }

            //patch the project
            newManifest.files.push({
              name: fileName,
              namespace: extensionName,
              version: VersionId,
            });
          });

          const userId = manifest.metadata.authors[0];

          return projectPersistence.projectWriteManifest(projectId, newManifest, userId)
            .catch(err => {
              console.log('error writing manifest: ' + projectId);
              console.log(err);
              throw err;
            });
        })
        .catch(err => {
          //if project doesnt exist, then whatever who cares
          if (err === errorDoesNotExist) {
            console.log('project did not exist, ignoring ' + projectId);
            return;
          }

          console.log('error updating manifest with fils');
          console.log(err.stack);
          throw err;
        });
    }));
  });
