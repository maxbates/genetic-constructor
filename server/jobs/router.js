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

import { errorInvalidRoute } from '../errors/errorConstants';
import { projectIdParamAssignment, ensureReqUserMiddleware, userOwnsProjectMiddleware } from '../data/permissions';
import jobFileRouter from './routerJobFiles';
import JobManager from './JobManager';

//import the job processor so its in the app
import './jobQueueDelegator';

const jobManager = new JobManager('jobs');

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects,
  limit: 20 * 1024 * 1024,
});

/******** PARAMS ***********/

router.param('projectId', projectIdParamAssignment);

router.param('jobId', (req, res, next, id) => {
  try {
    JobManager.validateJobId(id);
    Object.assign(req, { jobId: id });
    next();
  } catch (err) {
    res.status(422).send(err);
  }
});

/******** MIDDLEWARE ***********/

//ensure req.user is set
router.use(ensureReqUserMiddleware);

/********** ROUTES ***********/

router.use('/file/:projectId', userOwnsProjectMiddleware, jobFileRouter);

//only use json parser for non-file routes
router.use(jsonParser);

router.route('/:projectId/:jobType')
.all(userOwnsProjectMiddleware)
.post((req, res, next) => {
  const { projectId } = req;
  const data = req.body;
  const type = req.params.jobType;

  const jobBody = {
    type,
    data,
  };

  const jobOptions = {
    projectId,
  };

  jobManager.createJob(jobBody, jobOptions)
  .then(job => res.status(200).send({
    projectId,
    type,
    jobId: job.jobId,
  }))
  .catch(next);
});

router.route('/:projectId/:jobId')
.all(userOwnsProjectMiddleware)
.get((req, res, next) =>
  jobManager.jobCompleted(req.jobId)
  .then(jobAndStatus => res.status(200).send(jobAndStatus))
  .catch(err => {
    if (err === null) {
      return res.status(404).send();
    }
    next(err);
  }))
.delete((req, res, next) =>
  jobManager.deleteJob(req.jobId)
  .then(() => res.status(200).send({
    jobId: req.jobId,
  }))
  .catch(next));

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
