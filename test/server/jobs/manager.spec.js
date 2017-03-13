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
    describe.only('manager', () => {
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

        const jobData = { type: 'test', data: 'woo' };

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
            expect(result.type).to.equal('test');

            done();
          });
        });

        manager.createJob(jobData, { jobId });
      });

      it('nesting jobs should work', (done) => {
        const queueNameDelegator = 'delegator';
        const queueNameSlave = 'slave';

        const managerDelegator = new JobManager(queueNameDelegator);
        const managerSlave = new JobManager(queueNameSlave);

        const jobData = { special: 'data' };
        const jobBodyDelegator = { type: 'slave', data: jobData };
        const jobResult = { some: 'cool result' };

        managerSlave.setProcessor((job) => {
          //console.log('slave');
          //console.log(job);
          expect(job.data).to.eql(jobData);
          return Promise.resolve(jobResult);
        });

        managerDelegator.setProcessor((job, jobDone) => {
          //console.log('delegator');
          //console.log(job.data);
          expect(job.data).to.eql(jobBodyDelegator);
          expect(job.data.data).to.eql(jobData);

          managerSlave.onComplete((job, result) => {
            jobDone(null, result);
          });

          managerSlave.createJob(job.data.data);
        });

        managerDelegator.onComplete((job, result) => {
          //console.log('complete');
          //console.log(job);
          //console.log(result);
          expect(result).to.eql(jobResult);
          done();
        });

        managerDelegator.onFail((job, err) => done(err));

        managerDelegator.createJob(jobBodyDelegator);
      });

      it('jobs return reason for failure', (done) => {
        const manager = new JobManager(uuid.v4());
        const jobId = uuid.v4();

        const errorMsg = 'on nos';

        manager.setProcessor((job) => {
          throw new Error(errorMsg);
        });

        manager.onFail((job, err) => {
          console.log(err);
          expect(err.message).to.equal(errorMsg);

          //todo - interrogate job.failedReason
          assert(job.stacktrace.length > 0, 'should get stacktrace');
          done();
        });

        manager.createJob({ type: 'test', data: 'data' }, { jobId });
      });

      it('should fail on timeout', (done) => {
        const manager = new JobManager(uuid.v4());
        const jobId = uuid.v4();
        const timeout = 100;

        manager.setProcessor((job) => {
          return new Promise((resolve) => {});
        });

        manager.onFail((job, err) => {
          assert(err.message.indexOf('timed out') >= 0, 'should time out');
          done();
        });

        manager.createJob({ type: 'test', data: 'data' }, { jobId, timeout });
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
