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
const constructorClasses = require('constructor-classes');

const ncbi = require('./ncbi');

const Block = constructorClasses.models.Block;
const Project = constructorClasses.models.Project;
const Rollup = constructorClasses.models.Rollup;

const dummyJob = () => ({
  jobId: null,
  opts: {
    projectId: (new Project()).id,
    urlData: null,
  },
});

//actually parse the json file we get back
module.exports = function parseJson(json, job = dummyJob()) {
  const jobId = job.id;
  const { projectId } = job.opts;

  //can't use urlData because its a temporary URL
  const urlXml = `/jobs/file/${projectId}/${jobId}/data`;

  //todo - probably want more control than this...
  //keep the first 10 hits
  const allHits = json.iterations[0].hits;

  if (!allHits || allHits.length === 0) {
    return Promise.resolve(null);
  }

  const hits = allHits.slice(0, 10);

  //get fasta
  //todo - get genbank and actually parse it
  return Promise.all(hits.map(hit => ncbi.getFasta(hit.accession)))
  .then((fastas) => {
    //if we got no hits, just return an empty project as the patch
    //todo - should be able to return an error message
    if (!hits.length) {
      return new Rollup({
        project: new Project({ id: projectId }),
      });
    }

    //track block to sequence
    const blockToSequence = {};

    //create a block for each hit
    const blocks = hits.map((hit, index) => {
      const fasta = fastas[index];
      const sequence = fasta.split('\n').slice(1).filter(line => !!line).join('');

      const block = new Block({
        projectId,
        metadata: {
          name: hit.accession,
          description: hit.def,
        },
        source: {
          source: 'ncbi',
          id: hit.accession,
        },
      }, false);

      blockToSequence[block.id] = sequence;

      return block;
    });

    //make blocks list options
    const construct = new Block({
      metadata: { name: 'BLAST results' },
      projectId,
      rules: {
        list: true,
      },
      options: blocks.reduce((acc, block) => Object.assign(acc, { [block.id]: true }), {}),
      source: {
        source: 'BLAST',
        file: urlXml,
      },
      notes: {
        'BLAST Hits': allHits.length,
        blast: {
          jobId,
          accessions: allHits.map(hit => hit.accession),
          xml: urlXml,
        },
      },
    }, false);

    const blockMap = [...blocks, construct].reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});

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

    //make a dummy project, so its easy to find the construct
    const project = new Project({
      id: projectId,
      components: [construct.id],
    }, false);

    //return a rollup
    return new Rollup({
      project,
      blocks: blockMap,
      sequences,
    });
  });
};
