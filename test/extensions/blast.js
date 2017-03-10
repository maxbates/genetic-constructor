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
import { assert, expect } from 'chai';
import uuid from 'uuid';

import * as jobApi from '../../src/middleware/jobs';
import JobManager from '../../server/jobs/JobManager';
import { testUserId } from '../constants';
import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';

describe('Extensions', () => {
  describe.only('BLAST', () => {
    const roll = createExampleRollup();
    const projectId = roll.project.id;

    before(() => projectPersistence.projectWrite(projectId, roll, testUserId));

    it('can run a job', async() => {
      try {
        const jobData = { some: 'field' };
        const posted = await jobApi.jobCreate(projectId, 'blast', jobData);
        const jobId = posted.jobId;

        console.log(posted);

        assert(jobId, 'should get a job ID');

        const result = await jobApi.jobPoll(projectId, jobId, 1000);

        console.log(result);

        assert(result, 'should get result object');
        assert(result.result, 'should get result');
      }
      catch (err) {
        console.log(err);
        throw err;
      }
    });

    it('interacts with JobManager', () => {
      throw new Error('test the manager');
    });
  });
});
