import { merge } from 'lodash';
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';
import rollupFromArray from '../../src/utils/rollup/rollupFromArray';

import { baseTemplates, blocks as templateBlocks } from './templates';
import { baseExamples, blocks as exampleBlocks } from './examples';

//note - dont need to set projectId, since it will be set when writing the rollup

//take the base tempaltes + examples, make them real blocks (give them IDs)
//not cloning, i.e. not tracking origin, since users just getting this project directly for the time being.
//NOTE - if clone the tempalte blocks and example blocks, need to update components: [] in list blocks
const makeBlocks = () => {
  return {
    constructs: [
      ...baseTemplates.map(baseTemplate => Block.classless(baseTemplate)),
      ...baseExamples.map(baseExample => Block.classless(baseExample)),
    ],
    blocks: [
      ...templateBlocks,
      ...exampleBlocks,
    ],
  };
};

const makeProject = (blockIds) => Project.classless({
  isSample: true,
  metadata: {
    name: 'EGF Sample Templates',
    description: `This project includes a set of templates - combinatorial constructs with biological function - which can be fabricated at the Edinburgh Genome Foundry. This sample project is locked. To use the templates, drag them from the inventory list on the left, into one of your own projects.`,
  },
  components: blockIds,
});

//make the blocks, make the project, return the rollup
//note that project ID will be set when write the rollup, so dont need to handle that here explicitly
export default function makeEgfRollup() {
  const blocks = makeBlocks();
  const blockIds = blocks.constructs.map(block => block.id);
  const project = makeProject(blockIds);

  return rollupFromArray(project, ...blocks.constructs, ...blocks.blocks);
}
