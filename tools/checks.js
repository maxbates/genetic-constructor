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
import colors from 'colors/safe';
import { promisedExec } from './lib/cp';

const NO_DOCKER = !!process.env.NO_DOCKER;

export const checkNodeVersion = () => {
  const ver = process.version;
  console.log(colors.blue('Checking Node Version... ' + process.version));

  if (/v4/.test(ver)) {
    console.warn(colors.yellow('\n\nYou have version 4 of node. Node v6 is recommended.\n\n'));
    return;
  }

  //todo - any reason to support v5?

  if (!/v6/.test(ver)) {
    console.error('\n\nConstructor requires node version 6.x - you have: ' + ver + '\n\n');
    throw new Error('Constructor requires node version 6.x - you have: ' + ver);
  }
};

//not necessary, but v3 greatly preferred
export const checkNpmVersion = () => {};

export const checkDockerInstalled = () => {
  return promisedExec('docker ps', {}, { comment: 'Checking if Docker installed...' })
    .catch(err => {
      console.error('\n\nDocker is required to run Constructor\n\n');
      throw err;
    });
};

async function checks() {
  try {
    await checkNodeVersion();
    if (!NO_DOCKER) {
      await checkDockerInstalled();
    }
  } catch (err) {
    console.log('error running checks for Constructor: ', err);
    throw err;
  }
}

export default checks;
