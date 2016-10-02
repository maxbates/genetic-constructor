import { merge } from 'lodash';
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';
import rollupFromArray from '../../src/utils/rollup/rollupFromArray';

import { templates, makeTemplates, blocks as templateBlocks } from './templates';
import { examples, makeExamples, blocks as exampleBlocks } from './examples';

//note - dont need to set projectId, since it will be set when writing the rollup

//clone everything so that IDs are unique -- note we pass clone(false), NOT clone(null) intentionally
//NOTE - if clone the tempalte blocks and example blocks, need to update components: [] in list blocks
//remember to set to frozen if clone them
const makeBlocks = () => {
  return {
    //todo - write these functions
    /*
    constructs: [
      ...makeTemplates({ rules: { frozen: true } }),
      ...makeExamples({ rules: { frozen: true } }),
    ],
    */
    constructs: [
      ...templates.map(template => merge({}, template, { rules: { frozen: true } })),
      ...examples.map(example => merge({}, example, { rules: { frozen: true } })),
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
