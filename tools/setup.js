import { directoryMake } from '../server/data/middleware/fileSystem';
import {
  createStorageUrl,
  jobPath,
  sequencePath,
  projectFilesPath,
} from '../server/data/middleware/filePaths';

import * as s3 from '../server/data/middleware/s3';

import copyToStorage from '../data/egf_parts/copySequencesToStorage';

async function setup() {
  await directoryMake(createStorageUrl());
  await directoryMake(createStorageUrl(jobPath));
  await directoryMake(createStorageUrl(sequencePath));
  await directoryMake(createStorageUrl(projectFilesPath));

  //todo - might need to clone these to S3
  await copyToStorage();

  if (s3.useRemote) {
    await Promise.all(
      s3.buckets.map(bucket => s3.ensureBucketProvisioned(bucket))
    );
  }
}

export default setup;
