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
import express from 'express';
import textParser from 'body-parser';
import {
  errorNoIdProvided,
  errorInvalidModel,
  errorInvalidRoute,
  errorDoesNotExist,
  errorCouldntFindProjectId,
  errorVersioningSystem,
  errorFileNotFound,
} from './../utils/errors';
import * as filePaths from '../utils/filePaths';
import * as fileSystem from '../utils/fileSystem';

const router = express.Router(); //eslint-disable-line new-cap

router.route('/:extension/:file')
  .all((req, res, next) => {
    const { projectId } = req;
    const { extension, file } = req.params;

    const folderPath = filePaths.createProjectFilesDirectoryPath(projectId, extension);
    const filePath = filePaths.createProjectFilePath(projectId, extension, file);

    Object.assign(req, {
      extension,
      filePath,
      folderPath,
    });
    next();
  })
  .get((req, res, next) => {
    const { filePath } = req;

    fileSystem.fileRead(filePath, false)
      .then(data => res.send(data))
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send(errorDoesNotExist);
        }
        console.log('project file get err', err, err.stack);
        next(err);
      });
  })
  .post((req, res, next) => {
    const { projectId, user, extension, folderPath, filePath } = req;

    //assuming contents to be string
    let buffer = '';
    req.on('data', data => {
      buffer += data;
    });
    req.on('end', () => {
      fileSystem.directoryMake(folderPath)
        .then(() => fileSystem.fileWrite(filePath, buffer, false))
        .then(() => res.send(req.originalUrl))
        .catch((err) => {
          console.log('project file post err', err, err.stack);
          next(err);
        });
    });
  })
  .delete((req, res, next) => {
    const { filePath } = req;

    fileSystem.fileDelete(filePath)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

router.route('/:extension')
  .all((req, res, next) => {
    const { projectId } = req;
    const { extension } = req.params;
    const folderPath = filePaths.createProjectFilesDirectoryPath(projectId, extension);

    Object.assign(req, {
      extension,
      folderPath,
    });
    next();
  })
  .get((req, res, next) => {
    const { projectId, extension, folderPath } = req;

    fileSystem.directoryContents(folderPath)
      .then(contents => res.json(contents))
      .catch(err => res.status(404).send(errorFileNotFound));
  });

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
