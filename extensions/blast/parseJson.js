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
const ncbi = require('./ncbi');

const Block = require('../../src/models/Block');
//const Rollup = require('../../src/models/Rollup');

//actually parse the json file we get back
module.exports = function parseJson(json) {
  //todo - probably want more control than this...
  //keep the first 10 hits
  const hits = json.iterations[0].hits.slice(0, 10);

  //get fasta
  //todo - get genbank and actually parse it
  return Promise.all(hits.map(hit => ncbi.getFasta(hit.accession)))
  .then(fastas => {
    //track block to sequence
    const blockToSequence = {};

    //create a block for each hit
    const blocks = hits.map((hit, index) => {
      const fasta = fastas[index];
      const sequence = fasta.split('\n').slice(1).filter(line => !!line).join('');

      const block = new Block({
        metadata: {
          name: hit.accession,
          description: hit.def,
        },
      }, false);

      blockToSequence[block.id] = sequence;

      return block;
    });

    //make blocks list options
    const construct = new Block({
      options: blocks.reduce((acc, block) => Object.assign(acc, { [block.id]: true }), {}),
    }, false);

    const blockMap = [construct, ...blocks].reduce((acc, block) => Object.assign(acc, { [block.id]: block }));

    //set up sequence map, so sequences are written after job is completed
    const sequences = blocks.reduce((acc, block) => {
      acc.push({
        sequence: blockToSequence[block.id],
        blocks: {
          [block.id]: true,
        },
      });
      return acc;
    }, []);

    //return a rollup
    //note - projectId is incorrect (not set)
    return {
      blocks: blockMap,
      sequences,
    };
  });
};
