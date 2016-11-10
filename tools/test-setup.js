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

//requires that SERVER_MANUAL=true env var is set

import run from './run';
import del from 'del';
import setup from './setup';
import checks from './checks';

async function testSetup() {
  try {
    await run(checks);

    //delete old test data (must be before setup())
    await del(['storage/test'], { dot: true });

    //setup directories etc (may not be needed after transition to S3 / DB)
    await run(setup);

    console.log('tests ready to run! (if the DB is running!)');
  } catch (err) {
    console.log('GOT ERROR');
    console.log(err);
  }
}

export default testSetup;
