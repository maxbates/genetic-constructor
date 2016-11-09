import { directoryMake } from '../server/data/middleware/fileSystem';
import { createStorageUrl } from '../server/data/middleware/filePaths';

import * as s3 from '../server/data/middleware/s3';

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

  if (s3.useRemote) {
    await Promise.all(
      s3.buckets.map(bucket => s3.ensureBucketProvisioned(bucket))
    );
  }
}

export default setup;
