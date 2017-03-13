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

import debug from 'debug';
import JobManager from './JobManager';
import * as jobFiles from '../files/jobs';

//TESTING - blast not as an extension
//todo - spin up on separate thread
import '../../extensions/blast/jobProcessor';

if (process.env.NODE_ENV === 'test') {
  require('./testJobProcessor.js');
}

/*
 NOTES

 have a delegator job queue so:
 - unified way to handle jobs in-out
 - all job data + results are qritten to S3 automatically
 - jobs can run remotely, write to s3 etc on their own
 - jobs complete themselves (return a promise)

 CAVEAT handling across queues is kinda lame

 - *kinda* storing state on server (onJobComplete callback)
 - (extensions) requires extensions to know about job queue (or import bull directly)
 - (test) how to ensure a processor is set up?
 - (comms) need to listen across all queues, since storing state on server
 - (memory) a promise is required for every job running, between initiate + resolution
 */

const jobManager = new JobManager('jobs');
const logger = debug('constructor:jobs:processor');

//map jobId to resolve function, resolve when the job completes
const jobResolutionMap = {};

//when job at remote queue finishes, resolve / reject at jobResolutionMap
const completeJob = (jobId, result) => {
  if (typeof jobResolutionMap[jobId] === 'function') {
    jobResolutionMap[jobId](result);
  }
};

// map of job type to queue
// one queue per type of extension, expects that the extension has its own queue to process the jobs
// future - dynamic, based on extensions
const jobTypeToQueue = ['blast'].reduce((map, jobType) => {
  const manager = new JobManager(jobType);

  manager.onAddJob((job) => {
    console.log(`[${jobType}] ${job.jobId} - started`);
  }, true);

  //when the job completes at the appropriate queue, resolve here
  manager.onComplete((job, result) => {
    console.log(`[${jobType}] ${job.jobId} - complete`);
    console.log(result);
    completeJob(job.jobId, result);
  }, true);

  manager.queue.on('stalled', (job) => {
    // Job that was considered stalled. Useful for debugging job workers that crash or pause the event loop.
    console.log(`[${jobType}] ${job.jobId} - stalled`);
    completeJob(job.jobId, Promise.reject(new Error('job stalled')));
  }, true);

  //when the job fails, reject with error
  manager.onFail((job, err) => {
    console.log(`[${jobType}] ${job.jobId} - failed`);
    completeJob(job.jobId, Promise.reject(new Error(err)));
  }, true);

  map[jobType] = manager;
  return map;
}, {});

//'jobs' queue used to delegate to other queues
jobManager.setProcessor((job) => {
  const jobId = job.jobId;
  const { type, data } = job.data;
  const { projectId } = job.opts;

  console.log('got a job!', type, jobId, projectId);

  const queueManager = jobTypeToQueue[type];

  if (!queueManager) {
    throw new Error(`task ${type} not recognized`);
  }

  //save the data in s3, but not blocking
  jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(data, null, 2), 'data');

  return new Promise((resolve) => {
    const taskJobId = JobManager.createJobId();

    //add a resolution function, for when the job is done
    jobResolutionMap[taskJobId] = resolve;

    //delegate the job
    queueManager.createJob(data, { jobId: taskJobId });
  })
  .catch((err) => {
    console.log(err);
    completeJob(jobId, Promise.reject(err));
  });
});

//when jobs in 'jobs' queue complete, save the result
jobManager.onComplete((job, result) => {
  const jobId = job.jobId;
  const { type } = job.data;
  const { projectId } = job.opts;

  console.log('job finished', type, jobId, projectId);
  console.log(result);

  //save the result in s3
  jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(result, null, 2), 'result');
});
