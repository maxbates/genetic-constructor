import del from 'del';
import { makeDir } from './lib/fs';
import * as filePaths from '../server/data/middleware/filePaths';

/**
 * Cleans up the output (build) directory.
 */
async function clean() {
  console.log('clearing temp files + previous builds');
  await del(['.tmp', 'build/*', '!build/.git'], { dot: true });

  // delete old test data
  // must be before setup() makes its directories
  console.log('clearing local files in ' + filePaths.createStorageUrl());
  await del([filePaths.createStorageUrl()], { force: true, dot: true });

  await makeDir('build/public');
}

export default clean;
