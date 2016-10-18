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
import {
  errorInvalidRoute,
  errorDoesNotExist,
  errorFileNotFound,
} from './../utils/errors';
import * as filePaths from '../utils/filePaths';
import * as fileSystem from '../utils/fileSystem';

const router = express.Router(); //eslint-disable-line new-cap

//permission checking currently handled by data router, but need different access control for s3
//todo - S3 access control

router.route('/:namespace/:file')
  .all((req, res, next) => {
    const { projectId } = req;
    const { namespace, file } = req.params;

    const folderPath = filePaths.createProjectFilesDirectoryPath(projectId, namespace);
    const filePath = filePaths.createProjectFilePath(projectId, namespace, file);

    Object.assign(req, {
      namespace,
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
    const { folderPath, filePath } = req;

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

router.route('/:namespace')
  .all((req, res, next) => {
    const { projectId } = req;
    const { namespace } = req.params;
    const folderPath = filePaths.createProjectFilesDirectoryPath(projectId, namespace);

    Object.assign(req, {
      namespace,
      folderPath,
    });
    next();
  })
  .get((req, res, next) => {
    const { folderPath } = req;

    fileSystem.directoryContents(folderPath)
      .then(contents => res.json(contents))
      .catch(err => res.status(404).send(errorFileNotFound));
  });

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
