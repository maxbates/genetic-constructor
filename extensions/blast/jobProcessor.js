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
const Queue = require('bull');

const logger = require('./logger');
const ncbi = require('./ncbi');
const blast = require('./blast');
const parseJson = require('./parseJson');

///////////////////////////////////
// JOB QUEUE
///////////////////////////////////

const queue = Queue('blast', process.env.REDIS_PORT, process.env.REDIS_HOST);  //eslint-disable-line new-cap

//'jobs' queue used to delegate to other queues
queue.process((job) => {
  try {
    const { jobId, data } = job;
    const { projectId, parentJobId, urlData, urlOutput } = job.opts;

    logger(`BLAST processor got job ${jobId} (parent: ${parentJobId})`);
    logger(data);

    const { id, sequence } = data;

    return blast.blastSequence(id, sequence)
    .then((result) => {
      logger(`${jobId} blast finished`);

      //write the data file
      return fetch(urlData, { method: 'POST', body: result })
      .then(() => {
        logger(`${jobId} data file written`);
        return blast.blastParseXml(result);
      });
    }).then((result) => {
      logger(`${jobId} parse xml finished`);

      return parseJson(result, projectId);
    })
    .then((result) => {
      logger(`${jobId} parse json finished`);

      //write the output file
      return fetch(urlOutput, { method: 'POST', body: result })
      .then(() => {
        logger(`${jobId} output file written`);

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
    logger(`${job.jobId} BLAST caught error`);
    logger(err);
    logger(err.stack);

    throw err;
  }
});
