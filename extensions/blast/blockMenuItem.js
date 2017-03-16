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

constructor.extensions.register('blast', 'menu:block',
  (singleBlockSelected, block) => [{
    text: 'BLAST for similar sequences',
    disabled: !singleBlockSelected || !block.hasSequence(),
    action: () => {
      runBlast(block)
      .then((jobId) => {
        const component = constructor.api.blocks.blockClone(block.mutate('metadata.name', 'BLAST: Query'));

        const construct = constructor.api.blocks.blockCreate({
          metadata: { name: `BLAST: ${block.metadata.name || 'Unnamed Block'}` },
          jobId,
          components: [component.id],
        });
        constructor.api.projects.projectAddConstruct(block.projectId, construct.id);
      })
      .catch(err => {
        constructor.api.ui.uiSetGrunt('There was an error starting your BLAST search...');
        console.error(err); //eslint-disable-line no-console
      });
    },
  }]);

//start a job
function runBlast(block) {
  return block.getSequence()
  .then(sequence => constructor.jobs.jobCreate(block.projectId, 'blast', { id: block.id, sequence }))
  .then(result => result.jobId);
}
