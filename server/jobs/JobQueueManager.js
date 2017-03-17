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
import invariant from 'invariant';
import uuid from 'uuid';
import Queue from 'bull';
import debug from 'debug';

import { id as idRegex } from '../../src/utils/regex';
import { REDIS_PORT, REDIS_HOST } from '../urlConstants';

const logger = debug('constructor:jobs:manager');

//REFERENCE - https://github.com/OptimalBits/bull

//job queue manager
export default class JobQueueManager {
  //args to create Queue from bull
  constructor(queue, port = REDIS_PORT, host = REDIS_HOST, redisOpts) {
    this.queueName = queue;
    this.queue = Queue(queue, port, host, redisOpts); //eslint-disable-line new-cap

    //on start, log the initial job counts in background
    this.queue.getJobCounts()
    .then((counts) => {
      logger(`[${this.queueName}] job counts`, counts);
    });
  }

  static validateJobData(data) {
    invariant(typeof data === 'object', 'data must be object');
  }

  static validateJobId(jobId) {
    invariant(jobId && jobId !== 'null' && jobId !== 'undefined', 'invalid Job Id');
    invariant(idRegex().test(jobId), 'invalid Job Id');
  }

  static createJobId() {
    return `job-${uuid.v4()}`;
  }

  static createJobOptions(options = {}) {
    return {
      jobId: JobQueueManager.createJobId(),
      attempts: 1,
      delay: 0,
      timeout: (15 * 60 * 1000), //timeout after 15 minutes
      ...options,
    };
  }

  /**
   * set a function which processes the jobs
   * @param {Number} [concurrency]
   * @param {Function} processor in form (job, done) or (job) and return promise
   */
  setProcessor(...args) {
    if (args.length > 1) {
      invariant(Number.isInteger(args[0]), 'must pass number for concurrency');
      invariant(typeof args[1] === 'function', 'processor must be function');
    } else {
      invariant(typeof args[0] === 'function', 'processor must be function');
    }

    logger(`[process] [${this.queueName}] Setting processor`);
    return this.queue.process(...args);
  }

  //create new job, minting job if not provided
  //returns promise, resolves when job has been added
  createJob(data, options) {
    const opts = JobQueueManager.createJobOptions(options);
    const jobId = opts.jobId;

    logger(`[create] [${this.queueName}] creating... ${jobId}`);

    try {
      JobQueueManager.validateJobData(data);
    } catch (err) {
      logger(`[create] [${this.queueName}] INVALID DATA ${jobId}`);
      logger(err);

      return Promise.reject(err);
    }

    return this.queue.add(data, opts)
    .then((job) => {
      logger(`[create] [${this.queueName}] created ${job.jobId}`);
      //logger(job);

      return job;
    });
  }

  //get the bull job
  //rejects with null if job doesnt exist
  getJob(jobId) {
    logger(`[get] [${this.queueName}] getting... ${jobId}`);

    return this.queue.getJob(jobId)
    .then((job) => {
      if (!job) {
        logger(`[get] [${this.queueName}] failed ${jobId}`);
        return Promise.reject(`Job ${jobId} does not exist`);
      }

      logger(`[get] [${this.queueName}] got ${jobId}`);
      //logger(job);

      return job;
    });
  }

  //single check - resolve with { complete <bool>, failed <bool>, job <job>, result <*> }
  jobCompleted(jobId) {
    logger(`[jobCompleted] [${this.queueName}] checking... ${jobId}`);

    return this.getJob(jobId)
    .then((job) => {
      //logger(`[jobCompleted] [${this.queueName}] retrieved... ${jobId}`);

      return job.isCompleted()
      .then((complete) => {
        logger(`[jobCompleted] [${this.queueName}] complete? ${complete} ${jobId}`);

        const failure = !!job.failedReason || job.stacktrace.length > 0;
        const error = failure ? job.stacktrace : null;

        //todo - better failure checking
        //todo - should use URLs of data in s3

        return {
          complete,
          failure,
          error,
          type: job.data.type,
          result: job.returnvalue,
          job,
          jobId,
        };
      });
    });
  }

  //polling = will resolve / reject on complete / fail
  waitForJobCompletion(jobId) {
    logger(`[wait] [${this.queueName}] waiting for... ${jobId}`);

    return this.getJob(jobId)
    .then(job =>
      job.finished()
      .then((result) => {
        logger(`[wait] [${this.queueName}] completed ${jobId}`);
        return job;
      }));
  }

  deleteJob(jobId) {
    logger(`[delete] [${this.queueName}] deleting... ${jobId}`);

    return this.queue.getJob(jobId)
    .then(job => job.remove())
    .then(() => {
      logger(`[delete] [${this.queueName}] Deleted ${jobId}`);
      return jobId;
    });
  }

  //signature: job, jobPromise (can call cancel())
  onAddJob(func, globally = false) {
    logger(`[onAddJob] [${this.queueName}] registering ${func.name}`);

    const eventName = globalizeListener('active', globally);
    this.queue.on(eventName, func);
    return () => this.queue.removeListener(eventName, func);
  }

  //signature: job, result
  onComplete(func, globally = false) {
    logger(`[onComplete] [${this.queueName}] registering ${func.name}`);

    const eventName = globalizeListener('completed', globally);
    this.queue.on(eventName, func);
    return () => this.queue.removeListener(eventName, func);
  }

  onFail(func, globally = false) {
    logger(`[onFail] [${this.queueName}] registering ${func.name}`);

    const eventName = globalizeListener('failed', globally);
    this.queue.on(eventName, func);
    return () => this.queue.removeListener(eventName, func);
  }

  pause(localOnly = false) {
    return this.queue.pause(localOnly);
  }

  resume(localOnly = false) {
    return this.queue.resume(localOnly);
  }
}

function globalizeListener(event, global) {
  return `${global ? 'global:' : ''}${event}`;
}
