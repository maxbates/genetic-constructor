import { directoryMake } from '../server/data/middleware/fileSystem';
import {
  createStorageUrl,
  jobPath,
  sequencePath,
  projectFilesPath,
} from '../server/data/middleware/filePaths';

import * as s3 from '../server/data/middleware/s3';

import copyToStorage from '../data/egf_parts/copySequencesToStorage';

async function setupFiles() {
  console.log('Creating storage directories...');
  await directoryMake(createStorageUrl());
  await directoryMake(createStorageUrl(jobPath));
  await directoryMake(createStorageUrl(sequencePath));
  await directoryMake(createStorageUrl(projectFilesPath));

  if (s3.useRemote) {
    console.log('ensuring S3 buckets provisioned...');
    await Promise.all(
      s3.buckets.map(bucket => s3.ensureBucketProvisioned(bucket))
    );
  }

  console.log('Copying sequences to storage...');
  //todo - might need to clone these to S3
  await copyToStorage();
}

export default setupFiles;
