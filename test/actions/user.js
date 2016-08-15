import { expect } from 'chai';
import * as actions from '../../src/actions/user';
import userReducer from '../../src/reducers/user';
import { simpleStore } from '../store/mocks';

describe('Actions', () => {
  describe('User Actions', () => {
    const initialState = {
      userid: null,
      email: null,
      firstName: null,
      lastName: null,
    };

    //this actually comes from the default user in server/auth/local
    const dummyUser = {
      userid: '0',
      firstName: 'Dev',
      lastName: 'Eloper',
      email: 'developer@localhost',
    };

    const userStore = simpleStore(initialState, userReducer, 'user');

    it('should update user on userLogin', () => {
      const loginPromise = userStore.dispatch(actions.userLogin(dummyUser));

      return loginPromise.then(user => {
        expect(user).to.eql(dummyUser);
        expect(userStore.getState().user).to.eql(dummyUser);
      });
    });

    it('should update user on userLogout', () => {
      const logoutPromise = userStore.dispatch(actions.userLogout());

      return logoutPromise.then(() => {
        expect(userStore.getState().user).to.eql(initialState);
      });
    });
  });
});
