import { assert, expect } from 'chai';
import request from 'supertest';
import { login, getUser } from '../../../src/middleware/auth';

const devServer = require('../../../server/server');

describe('Server', () => {
  describe('auth', () => {
    const dummyUser = {
      email: 'bio.nano.dev@autodesk.com',
      password: 'HelpMe#1',
    };

    it('/auth/login route should return a 200', (done) => {
      request(devServer)
        .post('/auth/login')
        .send(dummyUser)
        .expect(200, done);
    });

    it('/auth/login should set a cookie on the client', (done) => {
      request(devServer)
        .post('/auth/login')
        .send(dummyUser)
        .expect((res) => {
          const cookie = res.headers['set-cookie'].join(';');
          assert(cookie, 'no cookie on response for login...');
        })
        .end(done);
    });

    it('/auth/cookies should return cookies sent on request', (done) => {
      const agent = request.agent(devServer);

      agent
        .post('/auth/login')
        .send(dummyUser)
        .end((err, res) => {
          const cookie = res.headers['set-cookie'].join(';');
          assert(cookie, 'no cookie on response for login...');

          agent
            .get('/auth/cookies')
            .expect((res) => {
              expect(res.text).to.not.equal(':(');
              expect(res.text).to.equal('mock-auth');
            })
            .end(done);
        });
    });

    //it('[future] should return the session key in the database');
    //it('[future] should ensure user exists');
    //it('[future] should error for invalid users');
  });
});
