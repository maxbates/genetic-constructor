import { assert, expect } from 'chai';
import request from 'supertest';
import { login, getUser } from '../../src/middleware/auth';

//noinspection JSUnusedLocalSymbols
const devServer = require('../../server/server'); // starts the server which will be accessed by methods below

describe('middleware', () => {
  describe('auth', () => {
    const dummyUser = {
      email: 'bio.nano.dev@autodesk.com',
      password: 'HelpMe#1',
    };

    it('login() receive the user object', () => {
      return login(dummyUser.email, dummyUser.password)
        .then(userInfo => {
          expect(userInfo).to.be.not.null;
          expect(userInfo.uuid).to.be.not.null;
          expect(userInfo.email).to.be.not.null;
        });
    });

    //not sure how to test this... jsdom doesn't set cookies apparently
    it('login() should set a cookie');

    it('getUser() should fetch a user object if you are logged in', () => {
      return getUser()
        .then(user => {
          expect(user).to.be.not.null;
          expect(user.uuid).to.be.not.null;
          expect(typeof user.uuid).to.be.equal('string');
        });
    });

    //not sure how to test this...
    it('logout() should clear cookie');
  });
});