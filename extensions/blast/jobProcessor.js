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
const fetch = require('isomorphic-fetch');

const JobManager = require('../../server/jobs/JobManager');

const logger = require('./logger');
const ncbi = require('./ncbi');
const blast = require('./blast');
const parseJson = require('./parseJson');

const jobManager = new JobManager('blast');

///////////////////////////////////
// JOB QUEUE
///////////////////////////////////

//'jobs' queue used to delegate to other queues
jobManager.setProcessor((job) => {
  try {
    const { jobId, data } = job;
    const { parentJobId, urlData, urlOutput } = job.opts;

    logger(`BLAST processor got job ${jobId} (parent: ${parentJobId})`);
    logger(data);

    const { id, sequence } = data;

    job.progress(10);

    return blast.blastSequence(id, sequence)
    .then((result) => {
      logger(`${jobId} blast finished`);

      job.progress(50);

      //write the data file
      return fetch(urlData, { method: 'POST', body: result })
      .then(() => {
        logger(`${jobId} data file written`);
        return blast.blastParseXml(result);
      });
    }).then((result) => {
      logger(`${jobId} parse xml finished`);
      job.progress(60);

      return parseJson(result);
    })
    .then((result) => {
      logger(`${jobId} parse json finished`);
      job.progress(90);

      //write the output file
      return fetch(urlOutput, { method: 'POST', body: result })
      .then(() => {
        logger(`${jobId} output file written`);
        job.progress(100);

        return result;
      });
    })
    .catch((err) => {
      logger(`${jobId} BLAST catch() error`);
      logger(err);
      logger(err.stack);

      throw err;
    });
  } catch (err) {
    logger(`${jobId} BLAST caught error`);
    logger(err);
    logger(err.stack);

    throw err;
  }
});
