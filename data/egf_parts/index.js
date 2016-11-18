import { merge } from 'lodash';
import Project from '../../src/models/Project';
import Rollup from '../../src/models/Rollup';

import makeTemplates from './templates';
// import { baseExamples, blocks as exampleBlocks } from './examples';

function makeProject(componentIds) {
  return Project.classless({
    rules: { frozen: true },
    metadata: {
      name: 'EGF Sample Templates',
      description: `This project includes a set of templates - combinatorial constructs with biological function - which can be fabricated at the Edinburgh Genome Foundry. This sample project is locked. To use the templates, drag them from the inventory list on the left, into one of your own projects.`,
    },
    components: componentIds,
  });
}

//make the blocks, make the project, return the rollup
//note that project ID will be set when write the rollup, so dont need to handle that here explicitly
export default function makeEgfRollup() {
  const blocks = makeTemplates();

  //todo - the examples if we want them

  const constructIds = blocks.templates.map(block => block.id);
  const project = makeProject(constructIds);

  //note - dont need to set projectId, since it will be set when writing the rollup
  return Rollup.fromArray(project, ...blocks.templates, ...blocks.blocks);
}
