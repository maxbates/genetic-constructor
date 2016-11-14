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
import { exec, spawn } from 'child_process';

const DEBUG = process.env.DEBUG && process.env.DEBUG.indexOf('tools') >= 0;
if (!DEBUG) {
  console.log('enable build tool debugging by setting env var DEBUG=tools');
}

//simple wrap around console.log
const log = (output = '', forceOutput = false) => {
  if (DEBUG || forceOutput === true) {
    console.log(output.trim());
  }
};

export const promisedExec = (cmd, opts, {
  forceOutput = false,
  comment = null,
} = {}) => {
  console.log(comment || 'running ' + cmd);

  return new Promise((resolve, reject) => {
    exec(cmd, opts, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      //`` to convert from buffers
      if (stdout) {
        log(`${stdout}`, forceOutput);
      }
      if (stderr) {
        log(`${stderr}`, forceOutput);
      }

      return resolve(`${stdout}`, `${stderr}`);
    });
  });
};

// two options
// pass IO to inherit, and resolve on close or reject on error (assumes task will close)
// don't pass IO, and pass waitUntil as string
// otherwise, could spawn in background
export const spawnAsync = (cmd, args = [], opts = {}, {
  waitUntil = `${Math.random()}`,
  forceOutput = false,
  failOnStderr = false,
  comment = null,
} = {}) => {
  console.log(comment || '\nrunning: ' + cmd + ' ' + args.join(' '));

  return new Promise((resolve, reject) => {
    //const [ command, ...args ] = cmd.split(' ');

    const spawned = spawn(cmd, args, Object.assign({ silent: false }, opts));

    //stdio only defined when piped, not if inherited / ignored
    if (spawned.stdout) {
      spawned.stdout.on('data', data => {
        log(`${data}`, forceOutput);
        if (`${data}`.indexOf(waitUntil) >= 0) {
          log('Resolved!');
          resolve(spawned);
        }
      });

      spawned.stderr.on('data', data => {
        log(`${data}`, true);
        if (`${data}`.indexOf(waitUntil) >= 0) {
          return resolve(spawned);
        }
        if (failOnStderr === true) {
          console.log('REJECTING');
          spawned.kill();
          reject(spawned);
        }
      });
    }

    spawned.on('error', (err) => {
      console.error('Error in process');
      console.error(err);
      reject(spawned);
    });

    spawned.on('close', (code) => {
      log(`child process exited with code ${code}`, forceOutput);
      if (code > 0) {
        return reject(spawned);
      }
      resolve(spawned);
    });
  });
};
