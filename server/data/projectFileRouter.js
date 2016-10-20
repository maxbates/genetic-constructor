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
import * as projectFiles from './persistence/projectFiles';

const router = express.Router(); //eslint-disable-line new-cap
const textParser = bodyParser.text();

/* S3 Credentials, when in production */

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket('bionano-gctor-files');
}

//permission checking currently handled by data router (user has access to project)

//todo - S3 access control ???? Necessary if all requests go through application server?

router.route('/:namespace/:file/:version?')
  .all((req, res, next) => {
    // const { projectId } = req; //already on the request
    const { namespace, file, version } = req.params;

    Object.assign(req, {
      namespace,
      file,
      version,
    });

    next();
  })
  .get((req, res, next) => {
    //todo - support for getting old versions
    //const params = (req.version && req.version !== 'latest') ? { VersionId: req.version } : {};

    const { projectId, namespace, file } = req;

    projectFiles.projectFileRead(projectId, namespace, file)
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
    const { projectId, namespace, file } = req;
    const content = req.body;

    projectFiles.projectFileWrite(projectId, namespace, file, content)
      .then(resp => {
        const payload = {
          VersionId: resp.VersionId,
        };
        res.send(payload);
      })
      .catch((err) => {
        console.log('project file post err', err, err.stack);
        next(err);
      });
  })
  .delete((req, res, next) => {
    const { projectId, namespace, file } = req;

    projectFiles.projectFileDelete(projectId, namespace, file)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

router.route('/:namespace')
  .all((req, res, next) => {
    // const { projectId } = req; //already on request
    const { namespace } = req.params;

    Object.assign(req, {
      namespace,
    });

    next();
  })
  .get((req, res, next) => {
    const { projectId, namespace } = req;

    projectFiles.projectFileList(projectId, namespace)
      .then(contents => res.json(contents))
      .catch(err => res.status(404).send(errorFileNotFound));
  });

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
