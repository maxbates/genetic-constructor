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
import path from 'path';
import run from './run';
import setup from './setup';
import { spawnAsync, promisedExec } from './lib/cp';
import HOST_URL from '../server/urlConstants';

/** paths **/

const pathProjectRoot = path.resolve(__dirname, '../');
const pathBioNanoPlatform = process.env.PLATFORM_PATH || path.resolve(pathProjectRoot, '../bio-user-platform');
const PGPASSWORD = process.env.PGPASSWORD || 'storageGCTOR'; // TODO export this default from `gctor-storage`

/** scripts **/

const setupBioNanoPlatform = (useGenomeDesignerBranch = false) => {
  console.log(`PLATFORM_PATH=${pathBioNanoPlatform}`);

  const checkoutPromise = useGenomeDesignerBranch === true ?
    promisedExec('git checkout genome-designer',
      { cwd: pathBioNanoPlatform },
      { comment: 'Checking out \'genome-designer\' branch of User Platform...' },
    ) :
    Promise.resolve();

  return checkoutPromise
    .then(() => promisedExec('npm install',
      { cwd: pathBioNanoPlatform },
      { comment: 'Installing User Platform dependencies...' },
    ));
};

const startAuthServer = () => spawnAsync('npm', ['start'],
  {
    cwd: pathBioNanoPlatform,
    env: Object.assign({ PGPASSWORD }, process.env),
  },
  {
    comment: 'Starting User Platform...',
    waitUntil: '{ address: { address: \'::\', family: \'IPv6\', port: 8080 } } \'started\'',
  });

const installAuthModule = () => promisedExec(`npm install ${pathBioNanoPlatform}`, {
  cwd: pathProjectRoot,
}, {
  comment: 'Installing User Platform Authentication Module...',
});

const startRunAuth = () => {
  console.log('\n\n');
  return spawnAsync('npm', ['run', 'start'],
    { cwd: pathProjectRoot,
      stdio: 'inherit',
      env: Object.assign({
        BIO_NANO_AUTH: 1,
        HOST_URL,
        CONSTRUCTOR_SKIP_SETUP: 'true',
      }, process.env),
    },
    {
      comment: '\n\nStarting Constructor with Authentication...',
      waitUntil: `Server listening at ${HOST_URL}/`,
      forceOutput: true,
      failOnStderr: false,
    },
  );
};

async function authStack() {
  try {
    await run(setup);
    await setupBioNanoPlatform();
    await startAuthServer();
    await installAuthModule();
    await startRunAuth();
  } catch (err) {
    console.log('[auth-stack] CAUGHT', err);
    throw err;
  }
}

export default authStack;
