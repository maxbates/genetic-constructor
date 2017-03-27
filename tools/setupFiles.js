import colors from 'colors/safe';
import * as fileSystem from '../server/data/middleware/fileSystem';
import {
  createStorageUrl,
  jobPath,
  sequencePath,
  projectFilesPath,
} from '../server/data/middleware/filePaths';

import * as s3 from '../server/data/middleware/s3';

async function setupFiles() {
  console.log(colors.blue('Creating storage directories...'));
  await fileSystem.directoryMake(createStorageUrl());
  await fileSystem.directoryMake(createStorageUrl(jobPath));
  await fileSystem.directoryMake(createStorageUrl(sequencePath));
  await fileSystem.directoryMake(createStorageUrl(projectFilesPath));

  if (s3.useRemote) {
    console.log(colors.blue('ensuring S3 buckets provisioned...'));
    await Promise.all(
      s3.buckets.map(bucket => s3.ensureBucketProvisioned(bucket)),
    );
  }
}

export default setupFiles;
