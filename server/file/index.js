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
/**
 * Simple router for arbitrary file saving / reading.
 *
 * Extensions may want to use this for persistence on the constructor server
 */
import express from 'express';
import { fileRead, fileWrite, directoryMake, fileDelete } from '../data/middleware/fileSystem';
import errorHandlingMiddleware from '../utils/errorHandlingMiddleware';

import { createFilePath } from '../data/middleware/filePaths';

const router = express.Router(); //eslint-disable-line new-cap

router.use(errorHandlingMiddleware);

router.route('/*')
  .all((req, res, next) => {
    const url = req.params[0];
    const filePath = createFilePath(url);
    const folderPath = filePath.substring(0, filePath.lastIndexOf('/') + 1);

    Object.assign(req, {
      filePath,
      folderPath,
    });
    next();
  })
  .get((req, res, next) => {
    const { filePath } = req;

    fileRead(filePath, false)
      .then(data => res.send(data))
      .catch(err => {
        console.log('file get err', err.stack);
        next(err);
      });
  })
  .post((req, res, next) => {
    const { filePath, folderPath } = req;

    //assuming contents to be string
    let buffer = '';

    //get data in parts
    req.on('data', data => {
      buffer += data;
    });

    //received all the data
    req.on('end', () => {
      //todo - should ensure there isn't a file preventing directory creation

      directoryMake(folderPath)
        .then(() => fileWrite(filePath, buffer, false))
        .then(() => res.send(req.originalUrl))
        .catch((err) => next(err));
    });
  })
  .delete((req, res, next) => {
    const { filePath } = req;

    fileDelete(filePath)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

export default router;
