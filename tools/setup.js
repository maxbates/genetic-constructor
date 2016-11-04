import { directoryMake } from '../server/data/middleware/fileSystem';
import { createStorageUrl } from '../server/data/middleware/filePaths';

console.log('todo - deprecate the setup of folders etc. once DB migration complete, and move the EGF sequences to S3');

import copyToStorage from '../data/egf_parts/copySequencesToStorage';

async function setup() {
  await Promise.all([
    directoryMake(createStorageUrl()),

    //paths dependent on whether testing or not
    directoryMake(createStorageUrl('projects')),
    directoryMake(createStorageUrl('sequence')),
    directoryMake(createStorageUrl('file')),
    directoryMake(createStorageUrl('temp')),
    directoryMake(createStorageUrl('genbank')),
    directoryMake(createStorageUrl('csv')),
    directoryMake(createStorageUrl('trash')),
  ]);

  await copyToStorage();
}

export default setup;
