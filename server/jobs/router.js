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

import { projectIdParamAssignment, ensureReqUserMiddleware, userOwnsProjectMiddleware } from '../data/permissions';
import jobFileRouter from './routerJobFiles';
import JobManager from './manager';

const jobManager = new JobManager('jobs');

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects,
  limit: 20 * 1024 * 1024,
});

/******** MIDDLEWARE ***********/

router.use(jsonParser);

//ensure req.user is set
router.use(ensureReqUserMiddleware);

/******** PARAMS ***********/

router.param('projectId', projectIdParamAssignment);

router.param('jobId', (req, res, next, id) => {
  Object.assign(req, { jobId: id });
  next();
});

/********** ROUTES ***********/

/* job files */
router.use('/file/:projectId', userOwnsProjectMiddleware, jobFileRouter);

router.route('/:jobId')
.get((req, res, next) =>
  jobManager.jobCompleted(req.jobId)
  .then(jobAndStatus => res.status(200).send(jobAndStatus))
  .catch(next))
.delete((req, res, next) =>
  jobManager.deleteJob(req.jobId)
  .then(() => res.status(200).send(req.jobId))
  .catch(next));

router.route('/')
.post((req, res, next) => {
  JobManager.validateJob(req.body);

  jobManager.createJob(req.body)
  .then((job) => res.status(200).send(job.jobId))
  .catch(next);
});

export default router;
