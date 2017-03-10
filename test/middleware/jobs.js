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
import { expect, assert } from 'chai';
import * as api from '../../src/middleware/jobs';

import { testUserId } from '../constants';
import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';

describe('Middleware', () => {
  describe.only('Jobs', () => {
    describe('Files', () => {
      const roll = createExampleRollup();
      const projectId = roll.project.id;

      before(() => projectPersistence.projectWrite(projectId, roll, testUserId));

      const namespace = 'someNamespace';
      const contents = `here's
    Some
Thing!`;

      let fileName;

      it('jobFileWrite() writes a file and returns name', () => {
        return api.jobFileWrite(projectId, namespace, contents)
        .then(resp => {
          expect(resp.url).to.be.defined;
          expect(resp.Key).to.be.defined;
          expect(resp.name).to.be.defined;
          fileName = resp.name;
        });
      });

      it('jobFileRead() gets a written file', () => {
        return api.jobFileRead(projectId, namespace, fileName)
        .then(resp => resp.text())
        .then(text => {
          expect(text).to.equal(contents);
        });
      });
    });

    describe('Jobs', () => {
      let jobId;
      const jobData = { some: 'data' };

      it('can create a job, returns ID', () => {
        return api.jobCreate(jobData)
        .then(result => {
          expect(typeof result).to.equal('object');
          expect(typeof result.jobId).to.equal('string');

          jobId = result.jobId;
        });
      });

      it('can get a job', async () => {
        const result = await api.jobGet(jobId);

        expect(typeof result).to.equal('object');
        assert(result.complete === true || result.complete === false);
        assert(result.job, 'should get job');
        assert(result.jobId === jobId, 'should get jobId');
      });
    });
  });
});
