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
import cp from 'child_process';
import path from 'path';
import debug from 'debug';
import colors from 'colors/safe';
import { getServerExtensions } from './registry';
import { REDIS_PORT, REDIS_HOST } from '../urlConstants';

const logger = console.log.bind(console);
//const logger = debug('constructor:jobs:extensions');

/*
 temp - spin up each job processor in a fork
 Load the extensions which have jobs

 ** many security implications running anonymous jobs **

 todo - should wrap processor, so just needs to provide callback
 todo - should each get their own *auto-scaled* instance
 todo - better handling of passing REDIS PORT and URL
 */

//map extension { key : process }
const processes = {};

const jobExtensions = getServerExtensions(manifest => manifest.geneticConstructor.job);

logger('Job Extensions', Object.keys(jobExtensions));

Object.keys(jobExtensions).forEach((key) => {
  const manifest = jobExtensions[key];
  const jobPath = manifest.geneticConstructor.job;

  try {
    //future - build dependent path lookup
    const extensionDirectoryPath = path.resolve(__dirname, 'node_modules', key);
    const extensionJobPath = path.resolve(extensionDirectoryPath, jobPath);

    logger(`[${key}] Creating extension job process`);

    const child = cp.fork(`${extensionJobPath}`, {
      cwd: extensionDirectoryPath,
      execArgv: [],
      env: {
        REDIS_PORT,
        REDIS_HOST,
      },
    });

    logger(`[${key}] Process ${child.pid}`);

    Object.assign(processes, { [key]: child });
  } catch (err) {
    console.error(colors.bgRed(`[extension job] there was an error registering extension ${key}`));
    console.log(err);
    console.log(err.stack);
  }
});

process.on('exit', () => {
  logger('Killing Job processes');
  logger(processes.map(proc => proc.pid));

  processes.forEach(process => process.kill('SIGHUP'));
});
