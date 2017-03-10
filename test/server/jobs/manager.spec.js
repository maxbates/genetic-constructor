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
import JobManager from '../../../server/jobs/JobManager';

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

      it('getJob rejects if job doesnt exist', (done) => {
        const manager = new JobManager(uuid.v4());

        manager.getJob(uuid.v4())
        .then(() => done(new Error('shouldnt resolve')))
        .catch(result => {
          done();
        });
      });

      it('can create + process a job', (done) => {
        const manager = new JobManager(uuid.v4());

        const jobData = { type: 'test', otherField: 'woo' };

        manager.setProcessor((job) => {
          expect(job.data).to.eql(jobData);
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
            setTimeout(resolve, 100);
          });
        });

        await manager.createJob({ type: 'test', data: 'data' }, { jobId });

        const initial = await manager.jobCompleted(jobId);
        expect(initial.complete).to.equal(false);
        expect(initial.job.jobId).to.equal(jobId);

        await new Promise(resolve => setTimeout(resolve, 200));

        const final = await manager.jobCompleted(jobId);
        expect(final.complete).to.equal(true);
        expect(final.job.jobId).to.equal(jobId);

      });

      it('can wait until job completed', async() => {
        const manager = new JobManager(uuid.v4());
        const jobId = uuid.v4();
        const jobData = { type: 'test', data: 'woo' };

        manager.setProcessor((job) => {
          return new Promise((resolve) => {
            job.progress(100);
            setTimeout(resolve, 100);
          });
        });

        await manager.createJob(jobData, { jobId });

        //only poll after job is successfully created
        const job = await manager.waitForJobCompletion(jobId);
        assert(job, 'should get resultant job');
        expect(job.jobId).to.equal(jobId);

        const complete = await job.isCompleted();
        assert(complete, 'should be marked finished');
      });

      it('jobs return their result, jobCompleted returns bunch of information about job including result', (done) => {
        const manager = new JobManager(uuid.v4());
        const jobId = uuid.v4();
        const jobData = { type: 'test', data: 'woo' };
        const processResult = 'some result you were expecting!';

        manager.setProcessor((job) => {
          return new Promise((resolve) => {
            job.progress(100);
            setTimeout(() => resolve(processResult), 100);
          });
        });

        manager.onComplete((job, result) => {
          //check result from onComplete message
          expect(result).to.equal(processResult);

          //now check custom getter
          manager.jobCompleted(jobId)
          .then(result => {
            assert(result.job, 'should get job');
            expect(result.complete).to.equal(true);
            assert(!result.failure, 'should not have failed');
            expect(result.result).to.equal(processResult);

            done();
          });
        });

        manager.createJob(jobData, { jobId });
      });

      it('jobs return reason for failure, marks as complete?', () => { throw new Error('todo'); });

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
              setTimeout(() => resolve(processResult), 100);
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
