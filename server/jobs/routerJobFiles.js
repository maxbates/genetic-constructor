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
import bodyParser from 'body-parser';
import express from 'express';

import { errorDoesNotExist, errorFileNotFound, errorInvalidRoute } from '../errors/errorConstants';
import * as jobFiles from '../files/jobs';

const router = express.Router(); //eslint-disable-line new-cap

//todo - enforce :jobId is valid
// ensure genbank processing etc. URLs are valid

router.route('/:jobId/:file?')
.all((req, res, next) => {
  // const { projectId } = req; //already on the request
  const { jobId, file } = req.params;

  Object.assign(req, {
    jobId,
    file,
  });

  next();
})
.get((req, res, next) => {
  const { projectId, jobId, file } = req;

  jobFiles.jobFileRead(projectId, jobId, file)
  .then(data => res.send(data))
  .catch((err) => {
    if (err === errorDoesNotExist) {
      return res.status(404).send(errorDoesNotExist);
    }
    console.log('job file get err', err, err.stack);
    next(err);
  });
})
//note - cannot pass custom file name, you are returned one
.post(bodyParser.text(), (req, res, next) => {
  const { projectId, jobId } = req;
  const content = req.body;

  jobFiles.jobFileWrite(projectId, jobId, content)
  .then(result => res.send(result))
  .catch((err) => {
    console.log('project file post err', err, err.stack);
    next(err);
  });
})
.delete((req, res, next) => {
  const { projectId, jobId, file } = req;

  jobFiles.jobFileDelete(projectId, jobId, file)
  .then(() => res.status(200).send())
  .catch((err) => {
    console.log('project file delete err', err, err.stack);
    next(err);
  });
});

router.route('/:jobId')
.all((req, res, next) => {
  // const { projectId } = req; //already on request
  const { jobId } = req.params;

  Object.assign(req, {
    jobId,
  });

  next();
})
.get((req, res, next) => {
  const { projectId, jobId } = req;

  //future - support query where jobId is optional (need to update s3 support as well)

  jobFiles.jobFileList(projectId, jobId)
  .then((contents) => {
    //todo - move this to jobFileList itself
    const mapped = contents.map(filename => ({
      name: filename,
      Key: [projectId, jobId, filename].join('/'),
      url: jobFiles.makeJobFileLink(projectId, jobId, filename),
    }));
    res.json(mapped);
  })
  .catch(err => res.status(404).send(errorFileNotFound));
});

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
