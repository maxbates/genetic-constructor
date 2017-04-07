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
import JobQueueManager from './JobQueueManager';
import * as jobFiles from '../files/jobs';
import { sequenceWriteManyChunksAndUpdateRollup } from '../data/persistence/sequence';
import { getServerExtensions } from '../extensions/registry';
import {
  FILE_NAME_INPUT,
  FILE_NAME_DATA,
  FILE_NAME_OUTPUT,
  FILE_NAME_RAW_RESULT,
  FILE_NAME_RESULT,
} from '../files/constants';
import Rollup from '../../src/models/Rollup';

/*
 NOTES
 jobs are nested:
 client -> REST -> JobQueueDelegator -> jobQueue[type]

 jobQueue is expected to write to the output, which is then downloaded and saved as the result for the parent (delegator) job

 -

 have a delegator job queue so:
 - unified way to handle jobs in-out
 - all job data + results are qritten to S3 automatically, and provision s3 bucket for them
 - jobs can run remotely, write to s3 etc on their own
 - jobs complete themselves (return a promise)
 - more unified handling of failure / stalling etc.

 CAVEAT handling across queues is kinda lame
 - storing state on server (onJobComplete callback)
 - if server restarts, state is lost. job will restart.
 - (extensions) requires extensions to know about job queue (or import bull directly)
 - (test) how to ensure a processor is set up?
 - (comms) need to listen across all queues, since storing state on server
 - (memory) a promise is required for every job running, between initiate + resolution
 */
//todo - need to durably set slave jobId -- when server restarts if job wasnt complete, the master-slave link is lost, and when a new job starts up, it starts a new slave. The first job never resolves. The client never knew about the second job.

const delegatorManager = new JobQueueManager('jobs');
const logger = debug('constructor:jobs:processor');

// JOB TRACKING + RESOLUTION

//map jobId to resolve function, resolve when the job completes
const jobResolutionMap = {};

//when job at remote queue finishes, resolve / reject at jobResolutionMap
//only calls the function if the job is in the map (e.g. more than one instance is up)
const attemptResolveJob = (jobId, result) => {
  if (typeof jobResolutionMap[jobId] === 'function') {
    jobResolutionMap[jobId](result);
  }
};

//when the job from the specific queue, finishes do some processing
//called by attemptResolveJob with (result)
//NB - result may be an error / rejection
const createSlaveJobCompleteHandler = (job, promiseResolver) => (result) => {
  const jobId = job.jobId;
  const { projectId } = job.opts;

  // jobs are expected to write their output to the output file
  // we expect this to be a rollup
  const getRawResultPromise = jobFiles.jobFileRead(projectId, jobId, FILE_NAME_OUTPUT)
  .catch(() => {
    logger(`slave: ${job.jobId} - no output file found`);
    return null;
  })
  .then((output) => {
    if (!output) {
      return null;
    }

    logger(`slave: ${job.jobId} - got output`);

    try {
      return JSON.parse(output);
    } catch (err) {
      logger(`slave: ${job.jobId} - error parsing output`);
      logger(output);
      return null;
    }
  });

  //write the raw result (final result is in the final job completion handler)
  //note - may be an error / cause an error stringifying, so try-catch
  const writeResultPromise = jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(result || '', null, 2), FILE_NAME_RAW_RESULT);

  //wait for file write and then return the processed result to the promise resolution
  return writeResultPromise
  .then(() => getRawResultPromise)
  .then((result) => {
    const gotRollup = (result && typeof result.blocks === 'object');
    if (gotRollup) {
      try {
        //if got an apparent rollup, validate that the rollup is valid
        Rollup.validate(result, true);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`slave: ${job.jobId} - error validating output rollup`);
        }
        throw err;
      }

      if (result.sequences) {
        return sequenceWriteManyChunksAndUpdateRollup(result);
      }
    }
    return result;
  })
  .then(promiseResolver)
  .catch((err) => {
    console.log('slave: jobCompleteHandler error');
    console.log(err);
    promiseResolver(Promise.reject(err));
  });
};

// JOB TYPES + QUEUES

const jobTypes = Object.keys(getServerExtensions(manifest => manifest.geneticConstructor.job));

if (process.env.NODE_ENV === 'test') {
  require('./testJobProcessor.js');
  jobTypes.push('test');
}

// map of job type to queue
// one queue per type of extension, expects that the extension has its own queue to process the jobs
// future - dynamic, based on extensions
const jobTypeToQueue = jobTypes.reduce((map, jobType) => {
  const manager = new JobQueueManager(jobType);

  manager.onAddJob((job) => {
    logger(`slave: [${jobType}] ${job.jobId} - started`);
  }, true);

  //when the job completes at the appropriate queue, resolve here
  manager.onComplete((job, result) => {
    logger(`slave: [${jobType}] ${job.jobId} - complete`);
    logger(result);
    attemptResolveJob(job.jobId, result);
  }, true);

  manager.queue.on('stalled', (job) => {
    // Job that was considered stalled. Useful for debugging job workers that crash or pause the event loop.
    logger(`slave: [${jobType}] ${job.jobId} - stalled`);
    attemptResolveJob(job.jobId, Promise.reject(new Error('job stalled')));
  }, true);

  //when the job fails, reject with error
  manager.onFail((job, err) => {
    logger(`slave: [${jobType}] ${job.jobId} - failed`);
    logger(err);
    attemptResolveJob(job.jobId, Promise.reject(new Error(err)));
  }, true);

  map[jobType] = manager;
  return map;
}, {});

// JOB HANDLING

//'jobs' queue used to delegate to other queues
delegatorManager.setProcessor((job) => {
  const jobId = job.jobId;
  const { type, data } = job.data;
  const { projectId } = job.opts;

  logger(`delegator: [${type}] ${jobId} (${projectId}) - processing`);

  const queueManager = jobTypeToQueue[type];

  return new Promise((resolve) => {
    if (!queueManager) {
      console.log(`delegator: task ${type} not recognized, failing`);
      throw new Error(`task ${type} not recognized`);
    }

    // save the data in s3, give url to extension (currently, its the same as the data object passed in)
    return jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(data, null, 2), FILE_NAME_INPUT)
    .then(() => {
      //urls for files the extension is expected to read / write
      const urlInput = jobFiles.jobFileSignedUrl(projectId, jobId, FILE_NAME_INPUT, 'getObject');
      const urlData = jobFiles.jobFileSignedUrl(projectId, jobId, FILE_NAME_DATA, 'putObject');
      const urlOutput = jobFiles.jobFileSignedUrl(projectId, jobId, FILE_NAME_OUTPUT, 'putObject');

      //create specific jobId for the slave job
      const taskJobId = JobQueueManager.createJobId();

      //add a resolution function, for when the job at slave is done
      jobResolutionMap[taskJobId] = createSlaveJobCompleteHandler(job, resolve);

      const jobOptions = {
        jobId: taskJobId,
        parentJobId: jobId,
        projectId,
        urlInput,
        urlData,
        urlOutput,
      };

      //delegate the job
      queueManager.createJob(data, jobOptions);
    });
  })
  .catch((err) => {
    console.log('delegator: job error!', type, jobId, projectId);
    console.log(err);
    attemptResolveJob(jobId, Promise.reject(err));
  });
});

//when jobs in 'jobs' queue complete, save the result
delegatorManager.onComplete((job, result) => {
  const jobId = job.jobId;
  const { type } = job.data;
  const { projectId } = job.opts;

  logger(`delegator: [${type}] ${jobId} (${projectId}) - onComplete`);
  logger(result);

  //save the result in s3, even if it was null / empty
  jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(result || '', null, 2), FILE_NAME_RESULT);
});

//handler for failed jobs
delegatorManager.onFail((job, err) => {
  const jobId = job.jobId;
  const { type } = job.data;
  const { projectId } = job.opts;

  console.log(`delegator: [${type}] ${jobId} (${projectId}) - onFail`);
  console.log(err);
});
