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

let queue;
try {
  queue = Queue('blast', process.env.REDIS_PORT, process.env.REDIS_HOST, { //eslint-disable-line new-cap
    db: process.env.REDIS_DB || 1, // matches default in GC's urlConstants.js
  });
} catch (err) {
  console.log('[blast] could not start queue - is redis running?');
  throw err;
}

const writeFile = (url, fileContent) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: fileContent });

//at most 5 in parallel so don't overload server
//todo - should batch them based on sequence length, not just hard stop at 5
queue.process(5, (job) => {
  try {
    const { jobId, data } = job;
    const { projectId, parentJobId, urlData, urlOutput } = job.opts;

    logger(`BLAST processor received job:
job ${jobId}
parent: ${parentJobId}
projectId: ${projectId}`);
    logger(data);

    const { id, sequence } = data;

    return blast.blastSequence(id || 'Unnamed', sequence)
    .then((result) => {
      logger(`${jobId} blast finished`);
      //logger(result);

      //write the data file
      return writeFile(urlData, result)
      .then(() => {
        logger(`${jobId} data file written @ ${urlData}`);
        return blast.blastParseXml(result);
      });
    }).then((result) => {
      logger(`${jobId} parse xml finished`);
      logger(result);

      return parseJson(result, job);
    })
    .then((result) => {
      logger(`${jobId} parse json finished`);

      //write the output file
      return writeFile(urlOutput, JSON.stringify(result, null, 2))
      .then(() => {
        logger(`${jobId} output file written @ ${urlOutput}`);

        //return a dummy result
        return true;
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
