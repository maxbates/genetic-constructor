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

import debug from 'debug';
import JobManager from './JobManager';

const jobManager = new JobManager('jobs');
const logger = debug('constructor:jobs:processor');

jobManager.setProcessor((job) => {
  console.log('got a job!', job.jobId, job.data.type);

  // DELEGATE
  // future - better delegation between all the things we actually would want to do
  switch (job.data.type) {
    case 'test': {
      job.progress(100);
      return Promise.resolve('yay');
    }
    case 'blast': {
      //todo - delegate to extension? or just hard-code?
      //job needs to be able to complete itself (can return promise)
      //job should write files to S3
      console.log('run teh blastz');
      break;
    }
    default: {
      throw new Error('task not recognized');
    }
  }
});

jobManager.onComplete((job) => {
  // todo
  // todo - persist the results somewhere
  // todo
});
