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
import checks from './checks';
import { spawnAsync, promisedExec } from './lib/cp';

//todo - have a check to make sure docker is running

/** paths **/

const pathProjectRoot = path.resolve(__dirname, '../');
let pathBioNanoPlatform = path.resolve(pathProjectRoot, '../bio-user-platform');

/** config **/

//allow overwriting the bio-user-platform path
process.argv.forEach((val, index) => {
  const argFlag = 'PLATFORM_PATH';
  if (val.startsWith(argFlag)) {
    const newPath = val.substr(argFlag.length + 1);
    pathBioNanoPlatform = newPath;
  }
});
console.log('path for bio-user-platform is ' + pathBioNanoPlatform + '. Set by passing --PLATFORM_PATH=/your/path');

/** scripts **/

let dockerEnv;

const setupBioNanoPlatform = (useGenomeDesignerBranch = false) => {
  const checkoutPromise = useGenomeDesignerBranch === true ?
    promisedExec(`git checkout genome-designer`,
      { cwd: pathBioNanoPlatform }
    ) :
    Promise.resolve();

  return checkoutPromise
    .then(() => promisedExec(`npm install`,
      { cwd: pathBioNanoPlatform }
    ));
};

const startBioNanoPlatform = () => {
  return spawnAsync('npm', ['run', 'storage-background'],
    {
      cwd: pathBioNanoPlatform,
      env: Object.assign({}, process.env, dockerEnv),
    },
    { waitUntil: 'database system is ready to accept connections' }
  );
};

const startAuthServer = () => {
  return spawnAsync('npm', ['start'],
    { cwd: pathBioNanoPlatform },
    { waitUntil: `{ address: { address: '::', family: 'IPv6', port: 8080 } } 'started'` });
};

const startRunAuth = () => {
  console.log('\n\n');
  return spawnAsync('npm', ['run', 'auth'],
    { cwd: pathProjectRoot },
    {
      waitUntil: 'Server listening at http://0.0.0.0:3000/',
      forceOutput: true,
      failOnStderr: false,
    }
  );
};

async function auth() {
  try {
    await run(checks);
    await setupBioNanoPlatform();
    await startBioNanoPlatform();
    await startAuthServer();
    await startRunAuth();
  } catch (err) {
    console.log('CAUGHT', err);
    throw err;
  }
}

export default auth;
