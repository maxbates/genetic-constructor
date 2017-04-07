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
import Rollup from '../../src/models/Rollup';

describe('Middleware', () => {
  describe('Jobs', () => {
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
      const roll = createExampleRollup();
      const projectId = roll.project.id;
      let jobId;
      const jobData = { some: 'data' };

      before(() => projectPersistence.projectWrite(projectId, roll, testUserId));

      it('can create a job, returns ID', () => {
        return api.jobCreate(projectId, 'test', jobData)
        .then(result => {
          expect(typeof result).to.equal('object');
          expect(typeof result.jobId).to.equal('string');

          jobId = result.jobId;
        });
      });

      it('can get a job', async() => {
        const result = await api.jobPoll(projectId, jobId, 500);

        expect(typeof result).to.equal('object');
        assert(result.complete === true || result.complete === false);
        assert(result.job, 'should get job');
        assert(result.jobId === jobId, 'should get jobId');
      });

      it('can get job input as file', async() => {
        const result = await api.jobFileRead(projectId, jobId, 'input')
        .then(resp => resp.text());

        expect(() => JSON.parse(result)).to.not.throw();
        expect(JSON.parse(result)).to.eql(jobData);
      });

      //test processor writes a file with a empty rollup
      it('can get job output as file', async() => {
        const result = await api.jobFileRead(projectId, jobId, 'output')
        .then(resp => resp.text());

        expect(() => JSON.parse(result)).to.not.throw();
        const parsed = JSON.parse(result);
        Rollup.validate(parsed, true);
      });

      //test processor writes job.data as raw result
      //we basically ignore this file
      it('can get job results as file', async() => {
        const result = await api.jobFileRead(projectId, jobId, 'rawresult')
        .then(resp => resp.text());

        expect(() => JSON.parse(result)).to.not.throw();
        expect(JSON.parse(result)).to.eql(jobData);
      });

      //final result from output after processing is returned
      it('can get job processed output as file "result"', async() => {
        const result = await api.jobFileRead(projectId, jobId, 'result')
        .then(resp => resp.text());

        expect(() => JSON.parse(result)).to.not.throw();
        const parsed = JSON.parse(result);
        Rollup.validate(parsed, true);
      });

      it('getJobResult returns the processed result', () => {
        return api.jobGetResult(projectId, jobId)
        .then(result => {
          Rollup.validate(result, true);
        });
      });
    });
  });
});
