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
//import '../../extensions/blast/jobProcessor';

const jobManager = new JobManager('jobs');
const logger = debug('constructor:jobs:processor');

// fixme - handling across queues is is lame
// requires extensions to know about job queue (or import bull directly)
// how to ensure a processor is set up?
// storing state on server
// need to listen across all queues, since storing state on server
// if server dies, job will be lost since never resolves
// a promise is required for every job running, between initiate + resolution

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

  //todo - delegate to extension? or just hard-code?
  //want to be able to run remotely
  //job needs to be able to complete itself (can return promise)
  //job should write files to S3

  //fixme - importing a separate processor does not work...
  manager.setProcessor((job, done) => {
    done(null, 'yay blast');
  });

  manager.onAddJob((job) => {
    console.log(`[${jobType}] ${job.jobId} - started`);
  }, true);

  //when the job completes at the appropriate queue, resolve here
  manager.onComplete((job, result) => {
    console.log(`[${jobType}] ${job.jobId} - complete`);
    console.log(result);
    completeJob(job.jobId, result);
  }, true);

  manager.queue.on('stalled', function (job) {
    // Job that was considered stalled. Useful for debugging job workers that crash or pause the event loop.
    console.log(`[${jobType}] ${job.jobId} - stalled`);
    completeJob(job.jobId, new Error('job stalled'));
  }, true);

  //when the job fails, reject with error
  manager.onFail((job, err) => {
    console.log(`[${jobType}] ${job.jobId} - failed`);
    completeJob(job.jobId, new Error(err));
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

  //special handling for queue 'test'
  if (type === 'test') {
    job.progress(100);
    return Promise.resolve(data);
  }

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
  .catch(err => {
    console.log(err);
    completeJob(jobId, err);
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
