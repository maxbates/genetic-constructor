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
import { promisedExec, spawnWaitUntilString } from './lib/cp';
import checkPortFree from '../server/utils/checkPortFree';

//todo - env var?
const STORAGE_PORT = 5432;

const buildDb = 'docker build -t gctorstorage_db ./storage-ext/postgres/';
const runDb = `docker run -p ${STORAGE_PORT}:${STORAGE_PORT} -l "gctorstorage_db" --rm -t -i gctorstorage_db`;

async function startDb() {
  try {
    await promisedExec(buildDb, {}, { comment: 'Building DB Docker container...' });

    //todo - windows friendly
    /*
     await promisedExec(`lsof -i :${STORAGE_PORT}`, {}, { comment: `Checking port ${STORAGE_PORT} for DB...` })
     .then(results => {
     if (!results) {
     //either errored and nothing returned, or we're ok and port is free
     return;
     }

     const [, ...processes] = results.split('\n');

     if (processes.every(process => !process || process.indexOf('postgresql') >= 0)) {
     console.log(`Postgres already running at ${STORAGE_PORT}`);
     return;
     }

     throw new Error(`Process running on port ${STORAGE_PORT} does not appear to be Postgres...`);
     });
     */

    await checkPortFree(STORAGE_PORT)
      .catch(err => {
        //console.log(err);
        //ideallly should see what process is running on the port...
        console.log('Port not free - assuming port is occupied by Postgres DB process....');
        return false;
      })
      .then(free => {
        if (free) {
          const [cmd, ...args] = runDb.split(' ');

          //fixme - cant get process to inherit stdio, so node or docker complains about TTY
          //{ stdio: [process.stdin, process.stdout, process.stderr] }

          return spawnWaitUntilString(cmd, args, {}, {
            waitUntil: 'database system is ready to accept connections',
            comment: 'Running Docker container...',
          });
        }
      });
  } catch (err) {
    console.log('Error starting Storage service...');
    throw err;
  }
}

export default startDb;
