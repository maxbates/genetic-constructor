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
const JobManager = require('../../server/jobs/JobManager');
const Block = require('../../src/models/Block');

const ncbi = require('./ncbi');
const blast = require('./blast');

const jobManager = new JobManager('blast');

//generate blocks / a project at the end --- todo - determine appropriate output
//actually parse the json file we get back
function parseJson(json) {
  //keep the first 10 hits
  const hits = json.iterations[0].hits.slice(0, 10);

  //get fasta
  //todo - get genbank and actually parse it
  return Promise.all(hits.map(hit => ncbi.getFasta(hit.accession)))
  .then(fastas => {
    console.log(fastas);

    return hits.map((hit, index) => {
      const fasta = fastas[index];
      const sequence = fasta.split('\n').slice(1).filter(line => !!line).join('');

      //todo - save the sequence, should be simple like import middleware
      //create a block
      return new Block({
        metadata: {
          name: hit.accession,
          description: hit.def,
        },
        sequence: {
          sequence,
          length: sequence.length,
        },
      }, false);
    })
    .then((blocks) => {
      const construct = new Block({
        options: blocks.reduce((acc, block) => Object.assign(acc, { [block.id]: true }), {}),
      }, false);

      //todo - determine appropriate output
      //add Rollup.saveSequences which can also update blocks, share with importMiddleware
      return {
        blocks: [construct, ...blocks].reduce((acc, block) => Object.assign(acc, { [block.id]: block })),
        sequences: blocks.reduce((acc, block) => {
          acc.push({
            sequence: block.sequence,
            blocks: {
              [block.id]: true,
            },
          });
          delete block.sequence;
          return acc;
        }, []),
      };
    });
  });
}

///////////////////////////////////
// JOB QUEUE
///////////////////////////////////

//'jobs' queue used to delegate to other queues
jobManager.setProcessor((job) => {
  try {
    const { jobId, data } = job;

    console.log('BLAST processor got job', jobId);
    console.log(data);

    const { id, sequence } = data;

    job.progress(10);

    return blast.blastSequence(id, sequence)
    .then(result => {
      job.progress(50);
      console.log('blast finished');
      return blast.blastParseXml(result);
    }).then((result) => {
      console.log('parse xml finished');
      job.progress(60);
      return parseJson(result);
    })
    .then((result) => {
      console.log('parse json finished');
      job.progress(100);
      return result;
    })
    .catch(err => {
      console.log(err);
      console.log(err.stack);
      throw err;
    })
  } catch (err) {
    console.log(err);
    console.log(err.stack);
    throw err;
  }
});
