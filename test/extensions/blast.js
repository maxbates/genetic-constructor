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
import path from 'path';

import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as jobApi from '../../src/middleware/jobs';
import { callExtensionApi } from '../../src/middleware/extensions';
import { testUserId } from '../constants';
import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';
import Rollup from '../../src/models/Rollup';

describe('Extensions', () => {
  describe('BLAST', () => {
    const roll = createExampleRollup();
    const projectId = roll.project.id;
    let jobId;

    before(() => projectPersistence.projectWrite(projectId, roll, testUserId));

    it('has a REST API', () => {
      return fileSystem.fileRead(path.resolve(__dirname, '../../extensions/blast/example.xml'), false)
      .then(xml => callExtensionApi('blast', 'parseXml', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: xml,
      }))
      .then(resp => resp.json())
      .then(result => {
        console.log(result);
        expect(typeof result).to.equal('object');

        //assert valid rollup
        Rollup.validate(result, true);

        assert(result.project.components[0], 'should get construct');
        const construct = result.blocks[result.project.components[0]];
        assert(construct, 'construct should exist in blocks');
        assert(Object.keys(construct.options).length, 'should have list options');
      });
    });

    it('can start a job', async() => {
      try {
        const jobData = { sequence: 'TAGCACTGACTGACTAGCATCGATCGACTGACTGACTGACTGACTGACTATCGATCGTACGTAGCTAGCTAGCTAGCTAGCAC' };
        const posted = await jobApi.jobCreate(projectId, 'blast', jobData);
        jobId = posted.jobId;

        assert(jobId, 'should get a job ID');
      } catch (err) {
        console.log(err);
        throw err;
      }
    });

    it('completed job returns a project for patching', () => {
      assert(jobId, 'should already have a job ID');

      return jobApi.jobPoll(projectId, jobId, 500)
      .then(jobObj => {
        assert(jobObj, 'should get result object');

        return jobApi.jobGetResult(projectId, jobId);
      })
      .then(result => {
        Rollup.validate(result, true);
      });
    });
  });
});
