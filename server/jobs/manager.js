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

import Queue from 'bull';
import debug from 'debug';

import { REDIS_PORT, REDIS_HOST } from '../urlConstants';

const logger = debug('constructor:jobs:manager');

//REFERENCE - https://github.com/OptimalBits/bull

export default class JobManager {
  //args to create Queue from bull
  constructor(queue, port = REDIS_PORT, host = REDIS_HOST, redisOpts) {
    this.queueName = queue;
    this.queue = Queue(queue, port, host, redisOpts); //eslint-disable-line new-cap
  }

  static validateJob(job) {
    //todo
  }

  setProcessor(func) {
    logger(`[process] [${this.queueName}] Setting processor`);

    return this.queue.process(func);
  }

  createJob(data, options) {
    logger(`[create] [${this.queueName}] creating...`);

    return this.queue.add(data, options)
    .then((job) => {
      logger(`[create] [${this.queueName}] created ${job.jobId}`);
      //logger(job);

      return job;
    });
  }

  getJob(jobId) {
    logger(`[get] [${this.queueName}] getting... ${jobId}`);

    return this.queue.getJob(jobId)
    .then((job) => {
      logger(`[get] [${this.queueName}] got ${jobId}`);
      //logger(job);

      return job;
    });
  }

  //single check - resolve with { complete <bool>, failed <bool>, job <job> }
  jobCompleted(jobId) {
    logger(`[jobCompleted] [${this.queueName}] checking... ${jobId}`);

    return this.getJob(jobId)
    .then((job) => {
      logger(`[jobCompleted] [${this.queueName}] retrieved... ${jobId}`);

      return job.isCompleted()
      .then((complete) => {
        logger(`[jobCompleted] [${this.queueName}] complete? ${complete} ${jobId}`);

        const failed = job && job.failedReason !== undefined;

        return {
          complete,
          failed,
          job,
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

  //signature: job, result
  onComplete(func, globally = false) {
    logger(`[onComplete] [${this.queueName}] registering onComplete`);

    this.queue.on('completed', func, globally);
    return () => this.queue.removeListener('completed', func);
  }

  onFail(func, globally = false) {
    logger(`[onFail] [${this.queueName}] registering onFail`);

    this.queue.on('failed', func, globally);
    return () => this.queue.removeListener('failed', func);
  }

  pause(localOnly = false) {
    return this.queue.pause(localOnly);
  }

  resume(localOnly = false) {
    return this.queue.resume(localOnly);
  }
}
