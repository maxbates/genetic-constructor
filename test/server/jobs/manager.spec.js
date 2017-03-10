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
import JobManager from '../../../server/jobs/manager';

describe('Server', () => {
  describe('Jobs', () => {
    describe('manager', () => {
      it('is class, accepts queue', () => {
        const manager = new JobManager('myQueue');
        expect(typeof manager.setProcessor).to.equal('function');
        expect(typeof manager.createJob).to.equal('function');
        expect(typeof manager.getJob).to.equal('function');
        expect(typeof manager.deleteJob).to.equal('function');
      });

      it('can create + process a job', (done) => {
        const manager = new JobManager(uuid.v4());

        const jobData = { type: 'test', otherField: 'woo' };

        manager.setProcessor((job) => {
          expect(job.data).to.equal(jobData);
          done();
        });

        manager.createJob(jobData);
      });

      it('can get job and see if compelte', async() => {
        const manager = new JobManager(uuid.v4());
        const jobId = uuid.v4();

        manager.setProcessor((job) => {
          return new Promise((resolve) => {
            job.progress(100);
            setTimeout(resolve, 1000);
          });
        });

        manager.createJob({ type: 'test', data: 'data' }, { jobId });

        const initial = await manager.jobCompleted(jobId);
        expect(initial.complete).to.equal(false);
        expect(initial.job.jobId).to.equal(jobId);

        await new Promise(resolve => setTimeout(resolve, 1100));

        const final = await manager.jobCompleted(jobId);
        expect(final.complete).to.equal(true);
        expect(final.job.jobId).to.equal(jobId);

      });

      it('can wait until job completed', (done) => {
        const manager = new JobManager(uuid.v4());
        const jobId = uuid.v4();
        const jobData = { type: 'test', data: 'woo' };

        manager.setProcessor((job) => {
          return new Promise((resolve) => {
            job.progress(100);
            setTimeout(resolve, 1000);
          });
        });

        manager.createJob(jobData, { jobId });

        manager.waitForJobCompletion(jobId)
        .then(job => {
          assert(job, 'should get resultant job');
          expect(job.jobId).to.equal(jobId);

          job.isCompleted().then(complete => {
            assert(complete, 'should be marked finished');
            done();
          })
          .catch(done);
        });
      });

      describe('coordination', () => {
        it('processor and creator can be created separately', (done) => {
          const queueName = uuid.v4();

          const managerA = new JobManager(queueName);
          const managerB = new JobManager(queueName);

          const jobData = { type: 'test', some: 'data' };
          const jobId = uuid.v4();
          const processResult = 'some result you were expecting!';

          let called = false;

          managerB.setProcessor((job) => {
            called = job;
            job.progress(50);

            return new Promise((resolve) => {
              job.progress(100);
              setTimeout(() => resolve(processResult), 1000);
            });
          });

          managerB.onComplete((job, result) => {
            expect(result).to.equal(processResult);
            expect(called.data).to.eql(jobData);
            expect(job.jobId).to.equal(jobId);
            expect(job.progress()).to.equal(100);
            done();
          });

          managerA.createJob(jobData, { jobId });
        });
      });
    });
  });
});
