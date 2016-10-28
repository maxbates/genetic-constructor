import { expect, assert } from 'chai';
import uuid from 'node-uuid';
import request from 'supertest';
import { testUserId } from '../../../constants';
import { updateProjectWithTestAuthor } from '../../../_utils/userUtils';
import Project from '../../../../src/models/Project';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import { errorDoesNotExist } from '../../../../server/utils/errors';
import * as fileSystem from '../../../../server/data/middleware/fileSystem';
import * as filePaths from '../../../../server/data/middleware/filePaths';
import devServer from '../../../../server/server';

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('Projects', () => {
        let server;
        const userId = testUserId; //for test environment
        const initialFields = { initial: 'value' };
        const projectData = new Project(updateProjectWithTestAuthor(initialFields));
        const projectId = projectData.id;

        const invalidIdProject = Object.assign({}, projectData, { id: 'invalid' });
        const invalidDataProject = Object.assign({}, projectData, { metadata: 'blah' });

        const projectPatch = { some: 'field' };
        const patchedProject = projectData.merge(projectPatch);

        const roll = { project: projectData, blocks: {} };

        before(() => {
          return projectPersistence.projectWrite(projectId, roll, userId);
        });

        beforeEach('server setup', () => {
          server = devServer.listen();
        });
        afterEach(() => {
          server.close();
        });

        it('sends 404 if no id provided', (done) => {
          const url = `/data/`;
          request(server)
            .get(url)
            .expect(404)
            .end(done);
        });

        it('GET invalid project ID returns a 400', (done) => {
          const url = `/data/fakeId`;
          request(server)
            .get(url)
            .expect(400)
            .expect(result => {
              expect(result.body).to.be.empty;
            })
            .end(done);
        });

        it('GET a not real project returns {} and a 204', (done) => {
          const url = `/data/${uuid.v4()}`;
          request(server)
            .get(url)
            .expect(204)
            .expect(result => {
              expect(result.body).to.be.empty;
            })
            .end(done);
        });

        it('GET an existing project returns the project', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .get(url)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(result => {
              expect(result.body).to.eql(projectData);
            })
            .end(done);
        });

        //future
        //it('GET supports a depth query parameter');

        it('POST merges a project returns it', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .post(url)
            .send(projectData)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(projectData);

              persistence.projectGet(projectId)
                .then((result) => {
                  expect(result).to.eql(projectData);
                  done();
                })
                .catch(done);
            });
        });

        it('POST allows for delta merges', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .post(url)
            .send(projectPatch)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(patchedProject);
              expect(result.body).to.not.eql(projectData);

              persistence.projectGet(projectId)
                .then((result) => {
                  expect(result).to.eql(patchedProject);
                  done();
                })
                .catch(done);
            });
        });

        it('POST doesnt allow data with the wrong ID', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .post(url)
            .send(invalidIdProject)
            .expect(400, done);
        });

        it('PUT replaces the project', (done) => {
          const url = `/data/${projectId}`;
          const newProject = new Project(updateProjectWithTestAuthor({
            id: projectId,
            notes: { field: 'value' },
          }));

          request(server)
            .put(url)
            .send(newProject)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(newProject);
              expect(result.body).to.not.eql(projectData);

              projectPersistence.projectGetManifest(projectId)
                .then((result) => {
                  expect(result).to.eql(newProject);
                  done();
                })
                .catch(done);
            });
        });

        it('PUT forces the project ID', (done) => {
          const url = `/data/${projectId}`;
          const newProject = new Project(updateProjectWithTestAuthor({
            id: 'randomId',
            notes: { field: 'value' },
          }));
          const validator = Object.assign({}, newProject, { id: projectId });

          request(server)
            .put(url)
            .send(newProject)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(validator);
              expect(result.body).to.not.eql(newProject);
              expect(result.body).to.not.eql(projectData);

              projectPersistence.projectGetManifest(projectId)
                .then((result) => {
                  expect(result).to.eql(validator);
                  done();
                })
                .catch(done);
            });
        });

        it('PUT validates the project', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .put(url)
            .send(invalidDataProject)
            .expect(400, done);
        });

        it('DELETE deletes the project', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .delete(url)
            .expect(200)
            .end((err, result) => {
              if (err) {
                done(err);
              }

              projectPersistence.projectExists(projectId)
                .then(() => assert(false, 'shouldnt exist here any more...'))
                .catch(err => {
                  if (err === errorDoesNotExist) {
                    return done();
                  }
                  done(err);
                });
            });
        });
      });
    });
  });
});
