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

//expects that SERVER_MANUAL=true env var is set, and the test suite starts the server

import invariant from 'invariant';
import run from './run';
import del from 'del';
import setup from './setup';
import checks from './checks';
import startDb from './startDb';
import { promisedExec, spawnAsync } from './lib/cp';

const withCoverage = process.env.COVERAGE === 'true';
const withReport = process.env.REPORT === 'true';

const mochaOptions = `--recursive --compilers js:babel-register,css:test/css-null-compiler.js --require ./test/setup.js --timeout 25000`;

const unitTestCommand = `./node_modules/mocha/bin/mocha ${mochaOptions}`;

//using babel-node and babel-istanbul is way slow
//todo - speed this up? may need a different package
const coverageCommand = `node_modules/.bin/babel-node node_modules/.bin/babel-istanbul cover --dir ./coverage --report lcovonly node_modules/.bin/_mocha -- ${mochaOptions}`;

//todo - test coveralls in travis
const coverageReport = `cat ./coverage/lcov.info | coveralls`;

//todo - incoporate jenkins needs

async function test() {
  const processes = [];
  let errored = 0;

  try {
    invariant(process.env.NODE_ENV === 'test', 'must set NODE_ENV=test');

    await run(checks);

    //delete old test data
    // must be before setup() makes its directories
    await del(['storage/test'], { dot: true });

    //setup directories etc (may not be needed after transition to S3 / DB)
    await run(setup);

    //start database (note - this holds onto the process until killed)
    const dbProcess = await run(startDb);
    processes.push(dbProcess);

    //now, run the test suite

    const command = withCoverage ? coverageCommand : unitTestCommand;
    const [cmd, ...args] = command.split(' ');

    const testProcess = await spawnAsync(cmd, args, {
      env: Object.assign({ SERVER_MANUAL: 'true' }, process.env),
      stdio: 'inherit',
    }, {
      forceOutput: true,
      comment: 'Starting Test Suite...',
    });

    processes.push(testProcess);

    //if we made it here, all tests passed
  } catch (err) {
    errored = 1;
  } finally {
    if (withReport) {
      //run coverage tests, even if tests failed
      try {
        await promisedExec(coverageReport, { stdio: 'inherit' }, { forceOutput: true });
      } catch (err) {
        console.error('couldnt generate coverage information');
      }
    }

    processes.forEach(proc => {
      if (!Number.isInteger(proc.exitCode)) {
        proc.kill();
      }
    });
    process.exit(errored);
  }
}

export default test;
