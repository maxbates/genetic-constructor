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
import bodyParser from 'body-parser';
import {
  errorInvalidRoute,
  errorDoesNotExist,
  errorFileNotFound,
} from './../utils/errors';
import * as filePaths from '../utils/filePaths';
import * as fileSystem from '../utils/fileSystem';
import * as s3 from './persistence/s3';

const router = express.Router(); //eslint-disable-line new-cap
const textParser = bodyParser.text();

/* S3 Credentials, when in production */

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket('bionano-gctor-files');
}

//permission checking currently handled by data router (user has access to project)

//todo - S3 access control ???? Necessary if all requests go through application server?

router.route('/:namespace/:file')
  .all((req, res, next) => {
    const { projectId } = req;
    const { namespace, file } = req.params;

    let filePath;
    let folderPath;

    if (s3.useRemote) {
      folderPath = `${projectId}/${namespace}`;
      filePath = `${folderPath}/${file}`;
    } else {
      folderPath = filePaths.createProjectFilesDirectoryPath(projectId, namespace);
      filePath = filePaths.createProjectFilePath(projectId, namespace, file);
    }

    Object.assign(req, {
      namespace,
      filePath,
      folderPath,
    });

    next();
  })
  .get((req, res, next) => {
    const { filePath } = req;

    const promise = s3.useRemote ?
      s3.stringGet(s3bucket, filePath) :
      fileSystem.fileRead(filePath, false);

    promise
      .then(data => res.send(data))
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send(errorDoesNotExist);
        }
        console.log('project file get err', err, err.stack);
        next(err);
      });
  })
  .post(textParser, (req, res, next) => {
    const { folderPath, filePath } = req;
    const content = req.body;

    //todo - should return version (especially s3) -- how to handle for local

    const promise = s3.useRemote
      ?
      s3.stringPut(s3bucket, filePath, content)
      :
      fileSystem.directoryMake(folderPath)
        .then(() => fileSystem.fileWrite(filePath, content, false));

    promise
      .then(() => res.send(req.originalUrl))
      .catch((err) => {
        console.log('project file post err', err, err.stack);
        next(err);
      });
  })
  .delete((req, res, next) => {
    const { filePath } = req;

    const promise = s3.useRemote
      ?
      s3.objectDelete(s3bucket, filePath)
      :
      fileSystem.fileDelete(filePath);

    promise
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

router.route('/:namespace')
  .all((req, res, next) => {
    const { projectId } = req;
    const { namespace } = req.params;

    let folderPath;

    if (s3.useRemote) {
      folderPath = `${projectId}/${namespace}`;
    } else {
      folderPath = filePaths.createProjectFilesDirectoryPath(projectId, namespace);
    }

    Object.assign(req, {
      namespace,
      folderPath,
    });

    next();
  })
  .get((req, res, next) => {
    const { folderPath } = req;

    //todo - verify the contents returned are the same

    const promise = s3.useRemote
      ?
      s3.folderContents(s3bucket, folderPath)
        .then(files => files.map(file => file.name))
      :
      fileSystem.directoryContents(folderPath);

    promise
      .then(contents => res.json(contents))
      .catch(err => res.status(404).send(errorFileNotFound));
  });

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
