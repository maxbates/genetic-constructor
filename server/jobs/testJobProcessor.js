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
import fetch from 'isomorphic-fetch';
import JobQueueManager from './JobQueueManager';

import Rollup from '../../src/models/Rollup';

// job handler for test environment, just returns the data passed in
// also basic test for the s3mock (write)

const queueManager = new JobQueueManager('test');

queueManager.setProcessor(job =>
  //console.log(job.opts);

  //test writing to the s3 mock before returning result
  //need to write simply, no extra headers etc.
  fetch(job.opts.urlOutput, { method: 'PUT', body: JSON.stringify(new Rollup(), null, 2) })
  .then(() => Promise.resolve(job.data))
  .catch((err) => {
    console.log(err);
    console.log(err.stack);
    throw err;
  }));
